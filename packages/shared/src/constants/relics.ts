import type { RelicDef } from '../types/roguelike.js'

/**
 * Pool of Relics. Filled out in Phase 8 / Phase 9.
 * Each relic has an opaque effect id consumed by the extension's relic-engine.
 *
 * Run 1 starts with an empty equipped set; relics drop from bosses and rare events.
 */
export const RELIC_DEFS: readonly RelicDef[] = [
  // Placeholder starter relic — a free passive so Run 2+ has something to equip
  // even before the player has defeated any boss.
  {
    id: 'starter_token_lens',
    name: 'Token Lens',
    rarity: 'common',
    description: 'Motes are 2× larger and 0.5× slower. Easier to catch.',
    effectId: 'relic_token_lens',
  },
]

export const MAX_EQUIPPED_RELICS_BASE = 3
