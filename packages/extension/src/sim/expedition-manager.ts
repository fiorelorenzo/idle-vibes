import type { GameEvent, LayerId, ExpeditionState, WorldSnapshot, Loot } from '@idle-vibes/shared'
import {
  EXPEDITION_MIN_FAIL_RATE,
  EXPEDITION_MAX_FAIL_RATE,
  LAYER_INDEX,
  LAYER_DEFS,
  EXPEDITION_EVENTS,
  EXPEDITION_EVENT_INTERVAL_MS,
  EXPEDITION_EVENT_CHANCE,
  EXPEDITION_CHOICE_AUTO_MS,
} from '@idle-vibes/shared'
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
    this.scheduleChoices(expedition)
    return expedition
  }

  resolveChoice(expeditionId: string, choiceId: string, pickedA: boolean): void {
    if (!this.snapshot) return
    const exp = this.snapshot.expeditions.find((e) => e.id === expeditionId)
    if (!exp) return
    const pending = exp.pendingChoices.find((c) => c.id === choiceId)
    if (!pending) return
    const tag = pickedA ? pending.optionA.outcomeTag : pending.optionB.outcomeTag
    exp.resolvedChoices.push(tag)
    exp.pendingChoices = exp.pendingChoices.filter((c) => c.id !== choiceId)
  }

  private scheduleChoices(exp: ExpeditionState): void {
    const layerIdx = LAYER_INDEX[exp.targetLayer] ?? 0
    const candidates = EXPEDITION_EVENTS.filter((e) => e.minLayerIndex <= layerIdx)
    if (candidates.length === 0) return

    const timers: ReturnType<typeof setTimeout>[] = []
    const totalWindows = Math.max(1, Math.floor(exp.durationMs / EXPEDITION_EVENT_INTERVAL_MS))
    for (let i = 1; i <= totalWindows; i++) {
      const at = i * EXPEDITION_EVENT_INTERVAL_MS
      if (at >= exp.durationMs - 10_000) break
      const t = setTimeout(() => {
        if (Math.random() > EXPEDITION_EVENT_CHANCE) return
        this.fireChoice(exp.id, candidates)
      }, at)
      timers.push(t)
    }
    this.choiceTimers.set(exp.id, timers)
  }

  private fireChoice(expId: string, candidates: typeof EXPEDITION_EVENTS): void {
    if (!this.snapshot) return
    const exp = this.snapshot.expeditions.find((e) => e.id === expId)
    if (!exp) return
    const def = candidates[Math.floor(Math.random() * candidates.length)]
    if (!def) return
    const choiceId = `ch-${Date.now()}-${Math.floor(Math.random() * 9999)}`
    const autoResolveAt = Date.now() + EXPEDITION_CHOICE_AUTO_MS
    exp.pendingChoices.push({
      id: choiceId,
      poolEventId: def.id,
      optionA: { label: def.optionA.label, outcomeTag: def.optionA.outcome },
      optionB: { label: def.optionB.label, outcomeTag: def.optionB.outcome },
      autoResolveAt,
    })
    this.emit({
      kind: 'expedition_choice',
      expeditionId: exp.id,
      choiceId,
      optionA: def.optionA.label,
      optionB: def.optionB.label,
      autoResolveAt,
    })
    // Auto-resolve if the player ignores it
    setTimeout(() => this.autoResolveIfPending(exp.id, choiceId), EXPEDITION_CHOICE_AUTO_MS + 100)
  }

  private autoResolveIfPending(expId: string, choiceId: string): void {
    if (!this.snapshot) return
    const exp = this.snapshot.expeditions.find((e) => e.id === expId)
    if (!exp) return
    const pending = exp.pendingChoices.find((c) => c.id === choiceId)
    if (!pending) return
    // Default: option A wins.
    exp.resolvedChoices.push(pending.optionA.outcomeTag)
    exp.pendingChoices = exp.pendingChoices.filter((c) => c.id !== choiceId)
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
      ? applyChoiceTags(rollLoot(exp.targetLayer, lootBonus), exp.resolvedChoices)
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

/** Apply accumulated choice outcome tags to a base loot roll. */
function applyChoiceTags(loot: Loot, tags: string[]): Loot {
  const out: Loot = { ...loot }
  for (const tag of tags) {
    switch (tag) {
      case 'bonus_shards':              out.shards += 3; break
      case 'bonus_shards_slow':         out.shards += 5; break
      case 'bonus_focus':               out.focus += 2; break
      case 'bonus_focus_big':           out.focus += 5; break
      case 'bonus_tokens':              out.tokens += 4; break
      case 'bonus_tokens_big':          out.tokens += 10; break
      case 'kin_bonus':                 out.focus += 2; out.tokens += 2; break
      case 'bonus_relic_chance':
        if (!out.relicId && Math.random() < 0.35) out.relicId = randomRelicDrop()
        break
      case 'legendary_relic_chance':
        if (!out.relicId && Math.random() < 0.2) out.relicId = 'aria_whisper'
        break
      case 'trade_shards_relic':
        if (out.shards >= 10) {
          out.shards -= 10
          if (!out.relicId) out.relicId = randomRelicDrop()
        }
        break
      case 'risk_big':
        if (Math.random() < 0.3) {
          out.shards = Math.floor(out.shards * 0.5)
          out.tokens = Math.floor(out.tokens * 0.5)
        } else {
          out.shards += 6
          out.tokens += 6
        }
        break
      case 'risk_small':
        if (Math.random() < 0.2) out.shards = Math.floor(out.shards * 0.75)
        else out.shards += 2
        break
      case 'slight_delay':
      case 'safe':
        break
    }
  }
  return out
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
