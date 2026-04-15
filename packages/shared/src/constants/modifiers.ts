import type { ModifierDef } from '../types/roguelike.js'

/**
 * Pool of Run Modifiers. Filled out in Phase 8 / Phase 9.
 * Three random modifiers are surfaced at run start (optional until 3rd prestige,
 * mandatory after). Opt-in on lower prestiges = smoother onboarding.
 */
export const MODIFIER_DEFS: readonly ModifierDef[] = [
  // Placeholder — a mild modifier visible from Run 1 so the picker has
  // something real to display during Phase 7 smoke tests.
  {
    id: 'flow_glutton',
    name: 'Flow Glutton',
    description: 'Motes are worth 2× Tokens, but no Expeditions can be launched.',
    weight: 2,
    effectId: 'modifier_flow_glutton',
  },
]

/** Prestige count at which picking a modifier becomes mandatory. */
export const MODIFIER_MANDATORY_AFTER_PRESTIGE = 3

/** Count of modifier options shown in the picker. */
export const MODIFIER_PICKER_COUNT = 3
