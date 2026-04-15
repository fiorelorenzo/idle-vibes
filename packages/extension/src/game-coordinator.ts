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

  constructor(
    private readonly bridge: ExtensionBridge,
    private readonly storage: LocalStateStorage,
  ) {
    this.snapshot = storage.load() ?? createDefaultSnapshot()
  }

  start(): { dispose(): void } {
    this.saveTimer = setInterval(() => this.persist(), 30_000)
    this.heartbeat.start((event) => this.emitEvent(event))
    return { dispose: () => this.stop() }
  }

  stop(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }
    this.heartbeat.stop()
    this.persist()
  }

  handleParserSignal(signal: ParserSignal): void {
    const events = this.rateLimiter.translate(signal)
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
      default:
        break
    }
  }

  private sendSnapshot(): void {
    this.bridge.send({
      type: 'ext:world-snapshot',
      snapshot: this.snapshot,
      tick: this.tick,
    })
  }

  private emitEvent(event: GameEvent): void {
    this.tick++
    this.bridge.send({ type: 'ext:game-event', event, tick: this.tick })
  }

  private applyMutation(mutation: WorldMutation): void {
    switch (mutation.kind) {
      case 'resource_delta': {
        const current = this.snapshot.resources[mutation.resource] ?? 0
        this.snapshot.resources[mutation.resource] = Math.max(0, current + mutation.delta)
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
        if (this.snapshot.meta.echoes >= mutation.cost) {
          this.snapshot.meta.echoes -= mutation.cost
          this.snapshot.meta.echoNodes[mutation.nodeId] =
            (this.snapshot.meta.echoNodes[mutation.nodeId] ?? 0) + 1
        }
        break
      }
      case 'pick_modifier':
        this.snapshot.run.modifierId = mutation.modifierId
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
      ownedRelics: [],
      unlockedModifiers: [],
      unlockedKinTypes: ['scribe'],
      loreEntries: [],
      totalPrestiges: 0,
    },
    tutorial: { step: 0 },
    drama: { phase: 'calm', elapsedInPhaseMs: 0, cycles: 0 },
  }
}
