import type { ModifierDef } from '../types/roguelike.js'

/**
 * Pool of Run Modifiers. Three random modifiers surface at run start.
 * Opt-in until the 3rd prestige, mandatory after.
 *
 * Each modifier has an opaque effectId. The host ModifierEngine maps
 * ids → concrete effects applied during event translation and mutation.
 */
export const MODIFIER_DEFS: readonly ModifierDef[] = [
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
    id: 'recursion_echo',
    name: 'Recursion Echo',
    description: 'Commits count 2×. Glitch spawns 1.5×.',
    weight: 3,
    effectId: 'recursion_echo',
  },
  {
    id: 'delver_rush',
    name: 'Delver Rush',
    description: 'Expeditions 50% faster. Cost Focus to launch.',
    weight: 2,
    effectId: 'delver_rush',
  },
  {
    id: 'silent_run',
    name: 'Silent Run',
    description: 'No mote rain until the first real commit.',
    weight: 3,
    effectId: 'silent_run',
  },
  {
    id: 'glass_core',
    name: 'Glass Core',
    description: 'Core HP halved. Focus gains +100%.',
    weight: 4,
    effectId: 'glass_core',
  },
]

export const MODIFIER_MANDATORY_AFTER_PRESTIGE = 3
export const MODIFIER_PICKER_COUNT = 3
