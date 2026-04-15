import type { WorldSnapshot } from '@idle-vibes/shared'
import { RELIC_DEFS } from '@idle-vibes/shared'

/**
 * Aggregates passive effects from equipped relics into a single
 * RelicEffects record. The host EffectsBus then weighs this against
 * run modifiers and echo tree grants.
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
      // ── common ────────────────────────────────────────
      case 'token_lens':       effects.moteValueMul *= 1.5; break
      case 'delvers_compass':  effects.expeditionDurationMul *= 0.75; break
      case 'scribe_cloak':     /* lingering motes handled client-side */ break
      case 'shard_pocket':     /* extra shard on glitch kill handled in combat */ break
      case 'warm_spark':       /* +1 focus on fix commit handled in rate limiter */ break
      case 'boot_ration':      /* starting tokens applied at prestige/setup */ break
      case 'steady_drum':      /* passive trickle rate handled in heartbeat */ break

      // ── rare ──────────────────────────────────────────
      case 'warden_promise':   effects.wardenDmgMul *= 1.25; break
      case 'commit_mirror':    effects.commitShardBonus += 1; break
      case 'iron_patience':    /* wave interval handled by wave clock */ break
      case 'archivist_tome':   /* expedition loot bonus in ExpeditionManager */ break
      case 'focus_prism':      /* focus gain multiplier in rate limiter */ break
      case 'crack_sealer':     /* wave size reduction */ break
      case 'mote_magnet':      /* motes drift toward Scribe (client-side) */ break

      // ── legendary ─────────────────────────────────────
      case 'aria_whisper':     effects.duskTokenTrickle = true; break
      case 'brittle_glass':    effects.brittleGlass = true; break
      case 'recursion_ring':   /* bonus motes every 5th kill (combat) */ break
      case 'drama_mask':       /* dusk extended (effects bus) */ break
      case 'echo_lantern':     /* +20% echoes payout (effects bus) */ break
      case 'null_parachute':   /* expedition fail safety */ break
    }
  }
  return effects
}
