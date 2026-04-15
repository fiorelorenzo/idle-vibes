import type { WorldSnapshot } from '@idle-vibes/shared'
import { RELIC_DEFS } from '@idle-vibes/shared'

/**
 * Aggregates passive effects from equipped relics into a single
 * RelicEffects record. Called whenever relics change or on snapshot load.
 */
export interface RelicEffects {
  moteValueMul: number
  wardenDmgMul: number
  expeditionDurationMul: number
  commitShardBonus: number
  duskTokenTrickle: boolean
  brittleGlass: boolean
}

const DEFAULT: RelicEffects = {
  moteValueMul: 1,
  wardenDmgMul: 1,
  expeditionDurationMul: 1,
  commitShardBonus: 0,
  duskTokenTrickle: false,
  brittleGlass: false,
}

export function resolveRelics(snapshot: WorldSnapshot): RelicEffects {
  const effects: RelicEffects = { ...DEFAULT }
  for (const relicId of snapshot.meta.equippedRelics) {
    const def = RELIC_DEFS.find((r) => r.id === relicId)
    if (!def) continue
    switch (def.effectId) {
      case 'token_lens':
        effects.moteValueMul *= 1.5
        break
      case 'warden_promise':
        effects.wardenDmgMul *= 1.25
        break
      case 'delvers_compass':
        effects.expeditionDurationMul *= 0.75
        break
      case 'commit_mirror':
        effects.commitShardBonus += 1
        break
      case 'aria_whisper':
        effects.duskTokenTrickle = true
        break
      case 'brittle_glass':
        effects.brittleGlass = true
        break
    }
  }
  return effects
}
