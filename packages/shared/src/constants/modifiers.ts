import type { ModifierDef } from '../types/roguelike.js'

/**
 * Pool of Run Modifiers. Three random modifiers surface at run start.
 * Opt-in until the 3rd prestige, mandatory after.
 *
 * The `weight` field is the rough risk/reward tier (1=mild .. 5=extreme).
 * Higher weight translates to a larger Echoes payout at prestige.
 */
export const MODIFIER_DEFS: readonly ModifierDef[] = [
  // ── low risk / mild tweaks ─────────────────────────────────
  {
    id: 'flow_glutton',
    name: 'Flow Glutton',
    description: 'Motes worth 2× Tokens. No expeditions.',
    weight: 2,
    effectId: 'flow_glutton',
  },
  {
    id: 'iron_wardens',
    name: 'Iron Wardens',
    description: 'Wardens hit 50% harder. Scribes move 20% slower.',
    weight: 2,
    effectId: 'iron_wardens',
  },
  {
    id: 'delver_rush',
    name: 'Delver Rush',
    description: 'Expeditions 50% faster. Cost Focus to launch.',
    weight: 2,
    effectId: 'delver_rush',
  },
  {
    id: 'shard_magnet',
    name: 'Shard Magnet',
    description: 'Glitch kills drop double shards, tokens halved.',
    weight: 2,
    effectId: 'shard_magnet',
  },
  {
    id: 'quiet_streets',
    name: 'Quiet Streets',
    description: '50% fewer wave glitches, but each is 50% tankier.',
    weight: 2,
    effectId: 'quiet_streets',
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    description: 'Dusk lasts twice as long and triples mote value.',
    weight: 2,
    effectId: 'golden_hour',
  },

  // ── medium risk ────────────────────────────────────────────
  {
    id: 'recursion_echo',
    name: 'Recursion Echo',
    description: 'Commits count 2×. Glitch spawns 1.5×.',
    weight: 3,
    effectId: 'recursion_echo',
  },
  {
    id: 'silent_run',
    name: 'Silent Run',
    description: 'No mote rain until the first real commit.',
    weight: 3,
    effectId: 'silent_run',
  },
  {
    id: 'ascetic',
    name: 'Ascetic',
    description: 'No relic slots this run. All rewards +50%.',
    weight: 3,
    effectId: 'ascetic',
  },
  {
    id: 'frostbite',
    name: 'Frostbite',
    description: 'Kin move 35% slower. Mote value 2×.',
    weight: 3,
    effectId: 'frostbite',
  },
  {
    id: 'brittle_code',
    name: 'Brittle Code',
    description: 'Errors spawn 2× glitches. Fix commits heal 2× Kin.',
    weight: 3,
    effectId: 'brittle_code',
  },
  {
    id: 'shallow_pockets',
    name: 'Shallow Pockets',
    description: 'Start with 0 tokens. Shards give tokens on pickup.',
    weight: 3,
    effectId: 'shallow_pockets',
  },

  // ── high risk ──────────────────────────────────────────────
  {
    id: 'glass_core',
    name: 'Glass Core',
    description: 'Core HP halved. Focus gains +100%.',
    weight: 4,
    effectId: 'glass_core',
  },
  {
    id: 'one_shot',
    name: 'One-Shot',
    description: 'Kin die in one hit. Damage dealt ×10.',
    weight: 4,
    effectId: 'one_shot',
  },
  {
    id: 'dual_expeditions',
    name: 'Dual Expeditions',
    description: 'Two expeditions at once. Expedition failure rate doubled.',
    weight: 4,
    effectId: 'dual_expeditions',
  },
  {
    id: 'crescendo_forever',
    name: 'Crescendo Forever',
    description: 'Drama clock is stuck on climax. Payout +50%.',
    weight: 4,
    effectId: 'crescendo_forever',
  },

  // ── extreme ────────────────────────────────────────────────
  {
    id: 'blind_descent',
    name: 'Blind Descent',
    description: 'Fog of war on all layers. Shards 3×.',
    weight: 5,
    effectId: 'blind_descent',
  },
  {
    id: 'no_wardens',
    name: 'No Wardens',
    description: 'Wardens cannot be summoned. Scribes double as fighters.',
    weight: 5,
    effectId: 'no_wardens',
  },
  {
    id: 'feast_famine',
    name: 'Feast & Famine',
    description: 'Mote rain comes in huge rare bursts only.',
    weight: 5,
    effectId: 'feast_famine',
  },
  {
    id: 'perma_night',
    name: 'Perma-Night',
    description: 'Always Dusk. Glitches +30% damage, motes 2×.',
    weight: 5,
    effectId: 'perma_night',
  },
]

export const MODIFIER_MANDATORY_AFTER_PRESTIGE = 3
export const MODIFIER_PICKER_COUNT = 3
