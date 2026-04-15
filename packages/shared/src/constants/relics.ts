import type { RelicDef } from '../types/roguelike.js'

/**
 * Pool of Relics. Each relic has an opaque effectId the host relic-engine
 * interprets. Up to 3 equipped between runs (upgradeable via Echo Tree).
 */
export const RELIC_DEFS: readonly RelicDef[] = [
  {
    id: 'token_lens',
    name: 'Token Lens',
    rarity: 'common',
    description: 'Motes are worth 1.5× Tokens.',
    effectId: 'token_lens',
  },
  {
    id: 'warden_promise',
    name: "Warden's Promise",
    rarity: 'rare',
    description: 'Wardens hit 25% harder.',
    effectId: 'warden_promise',
  },
  {
    id: 'delvers_compass',
    name: "Delver's Compass",
    rarity: 'common',
    description: 'Expeditions return 25% faster.',
    effectId: 'delvers_compass',
  },
  {
    id: 'commit_mirror',
    name: 'Commit Mirror',
    rarity: 'rare',
    description: 'Every commit drops +1 extra shard.',
    effectId: 'commit_mirror',
  },
  {
    id: 'aria_whisper',
    name: "ARIA's Whisper",
    rarity: 'legendary',
    description: 'During Dusk, every Kin generates passive Tokens.',
    effectId: 'aria_whisper',
  },
  {
    id: 'brittle_glass',
    name: 'Brittle Glass',
    rarity: 'legendary',
    description: 'All damage dealt +50%. All damage taken +50%.',
    effectId: 'brittle_glass',
    risky: true,
  },
]

export const MAX_EQUIPPED_RELICS_BASE = 3
