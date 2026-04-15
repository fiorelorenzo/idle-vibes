import type { RelicDef } from '../types/roguelike.js'

/**
 * Pool of Relics. Each has an opaque `effectId` consumed by the
 * host-side RelicEngine. Up to 3 equipped slots between runs
 * (expandable via Echo Tree unlock_relic_slot nodes).
 */
export const RELIC_DEFS: readonly RelicDef[] = [
  // ── common ─────────────────────────────────────────────────
  {
    id: 'token_lens',
    name: 'Token Lens',
    rarity: 'common',
    description: 'Motes are worth 1.5× Tokens.',
    effectId: 'token_lens',
  },
  {
    id: 'delvers_compass',
    name: "Delver's Compass",
    rarity: 'common',
    description: 'Expeditions return 25% faster.',
    effectId: 'delvers_compass',
  },
  {
    id: 'scribe_cloak',
    name: 'Scribe Cloak',
    rarity: 'common',
    description: 'Motes linger 50% longer before decaying.',
    effectId: 'scribe_cloak',
  },
  {
    id: 'shard_pocket',
    name: 'Shard Pocket',
    rarity: 'common',
    description: '+1 Depth Shard on every glitch kill.',
    effectId: 'shard_pocket',
  },
  {
    id: 'warm_spark',
    name: 'Warm Spark',
    rarity: 'common',
    description: '+1 Focus on every fix commit.',
    effectId: 'warm_spark',
  },
  {
    id: 'boot_ration',
    name: 'Boot Ration',
    rarity: 'common',
    description: 'Start each run with 20 extra Tokens.',
    effectId: 'boot_ration',
  },
  {
    id: 'steady_drum',
    name: 'Steady Drum',
    rarity: 'common',
    description: 'Passive mote rain fires 30% more often.',
    effectId: 'steady_drum',
  },

  // ── rare ───────────────────────────────────────────────────
  {
    id: 'warden_promise',
    name: "Warden's Promise",
    rarity: 'rare',
    description: 'Wardens hit 25% harder.',
    effectId: 'warden_promise',
  },
  {
    id: 'commit_mirror',
    name: 'Commit Mirror',
    rarity: 'rare',
    description: 'Every commit drops +1 extra shard.',
    effectId: 'commit_mirror',
  },
  {
    id: 'iron_patience',
    name: 'Iron Patience',
    rarity: 'rare',
    description: 'Wave timers are 20% longer (calmer pacing, bigger bursts).',
    effectId: 'iron_patience',
  },
  {
    id: 'archivist_tome',
    name: "Archivist's Tome",
    rarity: 'rare',
    description: 'Expedition loot is 50% richer.',
    effectId: 'archivist_tome',
  },
  {
    id: 'focus_prism',
    name: 'Focus Prism',
    rarity: 'rare',
    description: 'Focus gain is +50%.',
    effectId: 'focus_prism',
  },
  {
    id: 'crack_sealer',
    name: 'Crack Sealer',
    rarity: 'rare',
    description: 'Glitch waves spawn 25% fewer enemies.',
    effectId: 'crack_sealer',
  },
  {
    id: 'mote_magnet',
    name: 'Mote Magnet',
    rarity: 'rare',
    description: 'Motes drift toward the nearest Scribe.',
    effectId: 'mote_magnet',
  },

  // ── legendary ──────────────────────────────────────────────
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
  {
    id: 'recursion_ring',
    name: 'Recursion Ring',
    rarity: 'legendary',
    description: 'Every 5th glitch killed spawns 2 bonus motes.',
    effectId: 'recursion_ring',
  },
  {
    id: 'drama_mask',
    name: 'Drama Mask',
    rarity: 'legendary',
    description: 'Dusk lasts twice as long. Tokens during dusk are doubled.',
    effectId: 'drama_mask',
  },
  {
    id: 'echo_lantern',
    name: 'Echo Lantern',
    rarity: 'legendary',
    description: 'Prestige payout gains +20% Echoes.',
    effectId: 'echo_lantern',
  },
  {
    id: 'null_parachute',
    name: 'Null Parachute',
    rarity: 'legendary',
    description: "Failed expeditions return the Delver at half loot.",
    effectId: 'null_parachute',
  },
]

export const MAX_EQUIPPED_RELICS_BASE = 3
