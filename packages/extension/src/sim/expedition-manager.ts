import type { GameEvent, LayerId, ExpeditionState, WorldSnapshot, Loot } from '@idle-vibes/shared'
import { EXPEDITION_MIN_FAIL_RATE, EXPEDITION_MAX_FAIL_RATE, LAYER_INDEX, LAYER_DEFS } from '@idle-vibes/shared'
import type { RunEffects } from './effects-bus'

/**
 * Host-side expedition lifecycle.
 *
 * - Client sends an `expedition_start` request via WorldMutation-like call.
 * - The manager writes an active expedition into the snapshot, emits an
 *   `expedition_start` event, and schedules the return timer + mid-
 *   expedition choice cards.
 * - On return, it rolls loot (weighted by layer + choice tags) and emits
 *   `expedition_return`.
 */
export class ExpeditionManager {
  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  private choiceTimers = new Map<string, ReturnType<typeof setTimeout>[]>()
  private emit: (e: GameEvent) => void = () => {}
  private snapshot: WorldSnapshot | null = null
  private effectsProvider: () => RunEffects = () => ({}) as RunEffects

  attach(
    snapshot: WorldSnapshot,
    emit: (e: GameEvent) => void,
    effectsProvider: () => RunEffects,
  ): void {
    this.snapshot = snapshot
    this.emit = emit
    this.effectsProvider = effectsProvider
    for (const exp of snapshot.expeditions) {
      this.scheduleReturn(exp)
    }
  }

  start(delverId: string, targetLayer: LayerId, requestedDurationMs: number): ExpeditionState | null {
    if (!this.snapshot) return null

    const effects = this.effectsProvider()
    if (effects.expeditionDisabled) return null
    if (!effects.doubleExpedition && this.snapshot.expeditions.length >= 1) return null
    if (effects.doubleExpedition && this.snapshot.expeditions.length >= 2) return null

    const durationMs = Math.max(5_000, Math.floor(requestedDurationMs * (effects.expeditionDurationMul ?? 1)))

    const id = `exp-${Date.now()}-${Math.floor(Math.random() * 9999)}`
    const expedition: ExpeditionState = {
      id,
      delverId,
      targetLayer,
      startedAt: Date.now(),
      durationMs,
      progress: 0,
      pendingChoices: [],
      resolvedChoices: [],
    }
    this.snapshot.expeditions.push(expedition)
    this.emit({ kind: 'expedition_start', expeditionId: id, delverId, targetLayer, durationMs })
    this.scheduleReturn(expedition)
    return expedition
  }

  private scheduleReturn(exp: ExpeditionState): void {
    const remaining = exp.durationMs - (Date.now() - exp.startedAt)
    if (remaining <= 0) {
      // The app was closed while this expedition was in flight and its
      // duration has already elapsed. Resolve on the next tick so the
      // webview has a chance to receive the initial snapshot first.
      const timer = setTimeout(() => this.resolve(exp.id), 0)
      this.timers.set(exp.id, timer)
      return
    }
    const timer = setTimeout(() => this.resolve(exp.id), remaining)
    this.timers.set(exp.id, timer)
  }

  private resolve(expId: string): void {
    if (!this.snapshot) return
    const idx = this.snapshot.expeditions.findIndex((e) => e.id === expId)
    if (idx < 0) return
    const exp = this.snapshot.expeditions[idx]
    this.snapshot.expeditions.splice(idx, 1)

    const effects = this.effectsProvider()
    const baseFailRate = lerp(
      EXPEDITION_MIN_FAIL_RATE,
      EXPEDITION_MAX_FAIL_RATE,
      (LAYER_INDEX[exp.targetLayer] ?? 0) / 4,
    )
    const failRate = Math.max(0, Math.min(1, baseFailRate + (effects.expeditionFailDelta ?? 0)))
    const success = Math.random() > failRate
    const lootBonus = (effects.shardGainMul ?? 1)
    const loot: Loot = success
      ? rollLoot(exp.targetLayer, lootBonus)
      : { shards: 0, tokens: 0, focus: 0, relicId: null }

    // Credit loot to snapshot and record how deep the player has been.
    if (success) {
      this.snapshot.resources.shards += loot.shards
      this.snapshot.resources.tokens += loot.tokens
      this.snapshot.resources.focus += loot.focus
      const reachedIdx = LAYER_INDEX[exp.targetLayer] ?? 0
      const currentIdx = LAYER_INDEX[this.snapshot.run.deepestLayer] ?? 0
      if (reachedIdx > currentIdx) {
        this.snapshot.run.deepestLayer = exp.targetLayer
        if (!this.snapshot.run.layersCleared || reachedIdx > this.snapshot.run.layersCleared) {
          this.snapshot.run.layersCleared = reachedIdx
        }
      }
      // Mark the Loot.relicId as owned so the player sees it in the tray.
      if (loot.relicId && !this.snapshot.meta.ownedRelics.includes(loot.relicId)) {
        this.snapshot.meta.ownedRelics.push(loot.relicId)
      }
    }
    void LAYER_DEFS

    this.emit({ kind: 'expedition_return', expeditionId: exp.id, success, loot })

    const choiceArr = this.choiceTimers.get(exp.id)
    choiceArr?.forEach((t) => clearTimeout(t))
    this.choiceTimers.delete(exp.id)
    this.timers.delete(exp.id)
  }

  stop(): void {
    this.timers.forEach((t) => clearTimeout(t))
    this.timers.clear()
    this.choiceTimers.forEach((arr) => arr.forEach((t) => clearTimeout(t)))
    this.choiceTimers.clear()
  }
}

function rollLoot(layer: LayerId, lootBonus = 1): Loot {
  const layerIdx = LAYER_INDEX[layer] ?? 0
  const multiplier = (1 + layerIdx * 0.6) * lootBonus
  return {
    shards: Math.floor(2 * multiplier + Math.random() * 4 * multiplier),
    tokens: Math.floor(3 * multiplier + Math.random() * 6 * multiplier),
    focus: Math.floor(1 * multiplier + Math.random() * 3),
    relicId: Math.random() < 0.15 ? randomRelicDrop() : null,
  }
}

const RELIC_DROP_POOL = [
  'token_lens',
  'delvers_compass',
  'scribe_cloak',
  'shard_pocket',
  'warm_spark',
  'boot_ration',
  'steady_drum',
  'warden_promise',
  'commit_mirror',
  'iron_patience',
  'archivist_tome',
  'focus_prism',
  'crack_sealer',
  'mote_magnet',
]

function randomRelicDrop(): string {
  return RELIC_DROP_POOL[Math.floor(Math.random() * RELIC_DROP_POOL.length)]
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
