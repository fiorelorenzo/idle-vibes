import type {
  ParserSignal,
  WorldSnapshot,
  WorldMutation,
  GameEvent,
  WebviewMessage,
} from '@idle-vibes/shared'
import {
  WORLD_SCHEMA_VERSION,
  LAYER_DEFS,
  SURFACE_ROWS,
  LAYER_ROWS_AT_UNLOCK,
  GRID_WIDTH,
} from '@idle-vibes/shared'
import type { ExtensionBridge } from './bridge/host'
import type { LocalStateStorage } from './storage/local-state'
import { ParserRateLimiter } from './sim/parser-rate-limiter'
import { PassiveHeartbeat } from './sim/passive-heartbeat'
import { DramaClock } from './sim/drama-clock'
import { WaveClock } from './sim/wave-clock'
import { ExpeditionManager } from './sim/expedition-manager'
import { performPrestige, computeEchoes } from './sim/prestige'
import { rollModifierChoices, resolveModifier } from './sim/modifier-engine'
import { ECHO_NODE_DEFS } from '@idle-vibes/shared'

/**
 * GameCoordinator — host-side authoritative controller.
 *
 * - Owns the WorldSnapshot
 * - Translates ParserSignal → GameEvent (rate-limited)
 * - Runs the passive heartbeat (always-alive trickle)
 * - Applies WorldMutations from the webview, persists
 * - Streams events to the webview via the bridge
 */
export class GameCoordinator {
  private snapshot: WorldSnapshot
  private tick = 0
  private saveTimer: ReturnType<typeof setInterval> | null = null
  private rateLimiter = new ParserRateLimiter()
  private heartbeat = new PassiveHeartbeat()
  private drama = new DramaClock()
  private waves = new WaveClock()
  private expeditions = new ExpeditionManager()
  private snapshotDirty = false
  private lastSnapshotSendAt = 0
  private syncFlushTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly bridge: ExtensionBridge,
    private readonly storage: LocalStateStorage,
  ) {
    this.snapshot = storage.load() ?? createDefaultSnapshot()
  }

  start(): { dispose(): void } {
    this.saveTimer = setInterval(() => this.persist(), 30_000)
    this.syncFlushTimer = setInterval(() => this.flushDirtySnapshot(), 500)
    this.heartbeat.start((event) => this.emitEvent(event))
    this.drama.start((event) => this.emitEvent(event))
    this.waves.start(this.drama, (event) => this.emitEvent(event))
    this.expeditions.attach(this.snapshot, (event) => this.emitEvent(event))
    return { dispose: () => this.stop() }
  }

  stop(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }
    if (this.syncFlushTimer) {
      clearInterval(this.syncFlushTimer)
      this.syncFlushTimer = null
    }
    this.heartbeat.stop()
    this.drama.stop()
    this.waves.stop()
    this.expeditions.stop()
    this.persist()
  }

  handleParserSignal(signal: ParserSignal): void {
    const effects = resolveModifier(this.snapshot)
    const events = this.rateLimiter.translate(signal, effects)
    for (const event of events) {
      this.emitEvent(event)
    }
  }

  handleWebviewMessage(msg: WebviewMessage): void {
    switch (msg.type) {
      case 'ui:ready':
      case 'ui:request-snapshot':
        this.sendSnapshot()
        break
      case 'ui:world-mutation':
        this.applyMutation(msg.mutation)
        break
      case 'ui:request-prestige':
        this.prestige()
        break
      default:
        break
    }
  }

  private prestige(): void {
    performPrestige(this.snapshot)
    this.expeditions.stop()
    this.expeditions = new ExpeditionManager()
    this.expeditions.attach(this.snapshot, (event) => this.emitEvent(event))
    this.persist()
    this.sendSnapshot()
  }

  getEchoPreview(): number {
    return computeEchoes(this.snapshot)
  }

  /** Returns 3 random modifier ids for the run picker. */
  rollModifiers(): string[] {
    return rollModifierChoices(this.snapshot)
  }

  private sendSnapshot(): void {
    const now = Date.now()
    if (now - this.lastSnapshotSendAt < 250) {
      // Coalesce rapid resyncs — the snapshot is small but postMessage isn't free.
      this.snapshotDirty = true
      return
    }
    this.lastSnapshotSendAt = now
    this.snapshotDirty = false
    this.bridge.send({
      type: 'ext:world-snapshot',
      snapshot: this.snapshot,
      tick: this.tick,
    })
  }

  private flushDirtySnapshot(): void {
    if (this.snapshotDirty) this.sendSnapshot()
  }

  private emitEvent(event: GameEvent): void {
    this.tick++
    this.bridge.send({ type: 'ext:game-event', event, tick: this.tick })
    // Certain events change the snapshot materially on the host — re-send
    // a full snapshot so the webview UI (HUD, expeditions, layer state)
    // stays in sync without a separate sync channel.
    if (
      event.kind === 'expedition_start' ||
      event.kind === 'expedition_return' ||
      event.kind === 'platform_grow' ||
      event.kind === 'boss_defeated' ||
      event.kind === 'phase_change'
    ) {
      this.sendSnapshot()
    }
  }

  private applyMutation(mutation: WorldMutation): void {
    switch (mutation.kind) {
      case 'resource_delta': {
        const current = this.snapshot.resources[mutation.resource] ?? 0
        this.snapshot.resources[mutation.resource] = Math.max(0, current + mutation.delta)
        // Lightweight resync so the HUD ticks up visibly (we'd rather burn
        // a few KB over the bridge than chase reactivity bugs).
        this.sendSnapshot()
        break
      }
      case 'boss_defeated': {
        const layer = this.snapshot.layers.find((l) => l.id === mutation.layer)
        if (layer) {
          layer.bossDefeated = true
          this.snapshot.run.bossesKilled++
        }
        break
      }
      case 'unlock_layer': {
        const layer = this.snapshot.layers.find((l) => l.id === mutation.layer)
        if (layer && !layer.unlocked && this.snapshot.resources.shards >= mutation.cost) {
          this.snapshot.resources.shards -= mutation.cost
          layer.unlocked = true
          this.snapshot.run.layersCleared++
        }
        break
      }
      case 'layer_rows_grew': {
        const layer = this.snapshot.layers.find((l) => l.id === mutation.layer)
        if (layer && layer.rows < 32) layer.rows++
        break
      }
      case 'layer_stability': {
        const layer = this.snapshot.layers.find((l) => l.id === mutation.layer)
        if (layer) {
          layer.stability = Math.max(0, Math.min(100, layer.stability + mutation.delta))
        }
        break
      }
      case 'tutorial_advance':
        this.snapshot.tutorial.step = mutation.step
        break
      case 'equip_relic': {
        const { relicId, slot } = mutation
        const equipped = this.snapshot.meta.equippedRelics.slice()
        while (equipped.length <= slot) equipped.push('')
        equipped[slot] = relicId
        this.snapshot.meta.equippedRelics = equipped.filter(Boolean)
        break
      }
      case 'buy_echo_node': {
        const def = ECHO_NODE_DEFS.find((n) => n.id === mutation.nodeId)
        if (!def) break
        const currentRank = this.snapshot.meta.echoNodes[mutation.nodeId] ?? 0
        if (currentRank >= def.maxRank) break
        const cost = def.baseCost * (currentRank + 1)
        if (this.snapshot.meta.echoes < cost) break
        this.snapshot.meta.echoes -= cost
        this.snapshot.meta.echoNodes[mutation.nodeId] = currentRank + 1
        // Unlock side-effects from one-shot unlock nodes
        if (def.grant.kind === 'unlock_relic' && def.grant.target) {
          if (!this.snapshot.meta.ownedRelics.includes(def.grant.target)) {
            this.snapshot.meta.ownedRelics.push(def.grant.target)
          }
        } else if (def.grant.kind === 'unlock_modifier' && def.grant.target) {
          if (!this.snapshot.meta.unlockedModifiers.includes(def.grant.target)) {
            this.snapshot.meta.unlockedModifiers.push(def.grant.target)
          }
        }
        break
      }
      case 'pick_modifier':
        this.snapshot.run.modifierId = mutation.modifierId
        break
      case 'expedition_start':
        this.expeditions.start(mutation.delverId, mutation.targetLayer, mutation.durationMs)
        break
      default:
        break
    }
  }

  private persist(): void {
    this.snapshot.savedAt = Date.now()
    this.storage.save(this.snapshot)
  }

  getSnapshot(): WorldSnapshot {
    return this.snapshot
  }
}

function createDefaultSnapshot(): WorldSnapshot {
  const now = Date.now()
  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    savedAt: now,
    tick: 0,
    resources: { tokens: 0, focus: 0, shards: 0 },
    layers: LAYER_DEFS.map((def, i) => ({
      id: def.id,
      unlocked: i === 0,
      stability: 100,
      rows: i === 0 ? SURFACE_ROWS : LAYER_ROWS_AT_UNLOCK,
      fogRemaining: i === 0 ? 0 : GRID_WIDTH * LAYER_ROWS_AT_UNLOCK,
      bossDefeated: false,
    })),
    expeditions: [],
    run: {
      prestigeCount: 0,
      seed: Math.floor(Math.random() * 0x7fffffff),
      modifierId: null,
      startedAt: now,
      layersCleared: 0,
      bossesKilled: 0,
      deepestLayer: 'surface',
    },
    meta: {
      echoes: 0,
      echoNodes: {},
      equippedRelics: [],
      ownedRelics: ['token_lens'],
      unlockedModifiers: [],
      unlockedKinTypes: ['scribe', 'warden', 'delver'],
      loreEntries: [],
      totalPrestiges: 0,
    },
    tutorial: { step: 0 },
    drama: { phase: 'calm', elapsedInPhaseMs: 0, cycles: 0 },
  }
}
