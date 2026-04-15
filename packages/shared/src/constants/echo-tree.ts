import type { EchoNodeDef } from '../types/roguelike.js'

/**
 * Echo Tree — permanent upgrades purchased with Commit Echoes.
 *
 * Three branches. Each node has a baseCost and a maxRank. Phase 9 may
 * add more nodes; this file is the design contract.
 */
export const ECHO_NODE_DEFS: readonly EchoNodeDef[] = [
  // ── Foundations (scaling stat boosts) ─────────────────────
  {
    id: 'foundations_mote_value',
    category: 'foundations',
    name: 'Denser Motes',
    description: '+5% Token value per rank.',
    baseCost: 1,
    maxRank: 5,
    grant: { kind: 'stat_mote_value', value: 0.05 },
  },
  {
    id: 'foundations_starting_tokens',
    category: 'foundations',
    name: 'Primed Reserves',
    description: '+10 starting Tokens per rank.',
    baseCost: 2,
    maxRank: 5,
    grant: { kind: 'stat_starting_tokens', value: 10 },
  },
  {
    id: 'foundations_expedition_speed',
    category: 'foundations',
    name: 'Path Memory',
    description: '-5% expedition duration per rank.',
    baseCost: 2,
    maxRank: 5,
    grant: { kind: 'stat_expedition_speed', value: 0.05 },
  },
  {
    id: 'foundations_kin_cap',
    category: 'foundations',
    name: 'Open Gates',
    description: '+1 starting Kin per rank.',
    baseCost: 3,
    maxRank: 4,
    grant: { kind: 'stat_kin_cap', value: 1 },
  },

  // ── Unlocks (one-shot content unlocks) ────────────────────
  {
    id: 'unlock_relic_commit_mirror',
    category: 'unlocks',
    name: 'Commit Mirror (relic)',
    description: 'Adds Commit Mirror to the drop pool.',
    baseCost: 5,
    maxRank: 1,
    grant: { kind: 'unlock_relic', target: 'commit_mirror' },
  },
  {
    id: 'unlock_relic_aria_whisper',
    category: 'unlocks',
    name: "ARIA's Whisper (relic)",
    description: 'Adds the legendary ARIA relic to the pool.',
    baseCost: 15,
    maxRank: 1,
    grant: { kind: 'unlock_relic', target: 'aria_whisper' },
  },
  {
    id: 'unlock_modifier_glass_core',
    category: 'unlocks',
    name: 'Glass Core (modifier)',
    description: 'Unlocks the high-risk Glass Core run modifier.',
    baseCost: 8,
    maxRank: 1,
    grant: { kind: 'unlock_modifier', target: 'glass_core' },
  },
  {
    id: 'unlock_relic_slot',
    category: 'unlocks',
    name: 'Extra Relic Slot',
    description: '+1 equipped Relic slot (max 5).',
    baseCost: 10,
    maxRank: 2,
    grant: { kind: 'unlock_relic_slot', value: 1 },
  },

  // ── Mutations (rule-changing) ─────────────────────────────
  {
    id: 'mutation_wardens_carry',
    category: 'mutations',
    name: 'Wardens Also Carry',
    description: 'Wardens pick up motes when no glitches are present.',
    baseCost: 20,
    maxRank: 1,
    grant: { kind: 'mutation_wardens_carry' },
  },
  {
    id: 'mutation_passive_shards',
    category: 'mutations',
    name: 'Core Whisper',
    description: 'The Core generates 1 shard per minute passively.',
    baseCost: 25,
    maxRank: 1,
    grant: { kind: 'mutation_passive_shards' },
  },
]
