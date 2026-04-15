import type { EchoNodeDef } from '../types/roguelike.js'

/**
 * Echo Tree — permanent upgrades purchased with Commit Echoes between runs.
 *
 * Structure: 3 branches
 *   - foundations: stat boosts that scale with rank
 *   - unlocks: one-shot unlocks of new content (relics, Kin types, layers, modifiers)
 *   - mutations: rule-changing upgrades (expensive, one-shot)
 *
 * Phase 8 will add the first ~15 functional nodes. Phase 9 fills to ~50.
 */
export const ECHO_NODE_DEFS: readonly EchoNodeDef[] = [
  {
    id: 'foundations_mote_value',
    category: 'foundations',
    name: 'Denser Motes',
    description: '+5% Token value from motes, per rank.',
    baseCost: 1,
    maxRank: 5,
    grant: { kind: 'foundations_mote_value', value: 0.05 },
  },
]
