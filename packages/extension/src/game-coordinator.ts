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

/**
 * GameCoordinator — host-side authoritative controller.
 *
 * Responsibilities:
 *   - Owns the WorldSnapshot (resources, unlocks, expeditions, meta).
 *   - Translates ParserSignal → GameEvent with rate limits (to be added in Phase 3).
 *   - Applies WorldMutation commands from the webview and persists.
 *   - Streams events to the webview via the bridge.
 *
 * Phase 0 scope: just boot a default snapshot, send it on ui:ready, and
 * apply resource_delta mutations. Everything else is a stub.
 */
export class GameCoordinator {
  private snapshot: WorldSnapshot
  private tick = 0
  private saveTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly bridge: ExtensionBridge,
    private readonly storage: LocalStateStorage,
  ) {
    this.snapshot = storage.load() ?? createDefaultSnapshot()
  }

  start(): { dispose(): void } {
    this.saveTimer = setInterval(() => this.persist(), 30_000)
    return { dispose: () => this.stop() }
  }

  stop(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }
    this.persist()
  }

  /**
   * Handle a parser signal. Phase 0: no translation yet.
   * Phase 3+: translate to GameEvent with rate limits, emit via `emitEvent`.
   */
  handleParserSignal(_signal: ParserSignal): void {
    // no-op in Phase 0 — the coordinator only echoes the snapshot.
  }

  /**
   * Handle a webview message. Mutations update the snapshot authoritatively.
   */
  handleWebviewMessage(msg: WebviewMessage): void {
    switch (msg.type) {
      case 'ui:ready':
      case 'ui:request-snapshot':
        this.sendSnapshot()
        break
      case 'ui:world-mutation':
        this.applyMutation(msg.mutation)
        break
      // Other message types wired up in later phases
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
        const next = this.snapshot.resources[mutation.resource] + mutation.delta
        this.snapshot.resources[mutation.resource] = Math.max(0, next)
        break
      }
      // Other mutations wired in Phase 5/7/8
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
