import type { GameEvent, LayerId, ExpeditionState, WorldSnapshot, Loot } from '@idle-vibes/shared'
import { EXPEDITION_MIN_FAIL_RATE, EXPEDITION_MAX_FAIL_RATE, LAYER_INDEX, LAYER_DEFS } from '@idle-vibes/shared'

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

  attach(snapshot: WorldSnapshot, emit: (e: GameEvent) => void): void {
    this.snapshot = snapshot
    this.emit = emit
    // On boot, resume any persisted expeditions.
    for (const exp of snapshot.expeditions) {
      this.scheduleReturn(exp)
    }
  }

  start(delverId: string, targetLayer: LayerId, durationMs: number): ExpeditionState | null {
    if (!this.snapshot) return null

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

    const failRate = lerp(
      EXPEDITION_MIN_FAIL_RATE,
      EXPEDITION_MAX_FAIL_RATE,
      (LAYER_INDEX[exp.targetLayer] ?? 0) / 4,
    )
    const success = Math.random() > failRate
    const loot: Loot = success
      ? rollLoot(exp.targetLayer)
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

function rollLoot(layer: LayerId): Loot {
  const layerIdx = LAYER_INDEX[layer] ?? 0
  const multiplier = 1 + layerIdx * 0.6
  return {
    shards: Math.floor(2 * multiplier + Math.random() * 4 * multiplier),
    tokens: Math.floor(3 * multiplier + Math.random() * 6 * multiplier),
    focus: Math.floor(1 * multiplier + Math.random() * 3),
    relicId: Math.random() < 0.1 ? 'starter_token_lens' : null,
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
