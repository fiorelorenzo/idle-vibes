import type { LayerId } from '../types/world.js'

export const WORLD_SCHEMA_VERSION = 1

/** Tile grid width (columns) — constant across layers */
export const GRID_WIDTH = 20

/** Default starting rows for the Surface layer */
export const SURFACE_ROWS = 12

/** Max rows a layer can grow to via platform_grow */
export const MAX_LAYER_ROWS = 32

/** Rows per other layers at unlock */
export const LAYER_ROWS_AT_UNLOCK = 16

export interface LayerDef {
  id: LayerId
  displayName: string
  unlockCostShards: number
  bossId: string
}

export const LAYER_DEFS: readonly LayerDef[] = [
  { id: 'surface', displayName: 'SURFACE', unlockCostShards: 0, bossId: 'surface_watcher' },
  { id: 'shallow', displayName: 'SHALLOW', unlockCostShards: 10, bossId: 'null_lord' },
  { id: 'deep', displayName: 'DEEP', unlockCostShards: 50, bossId: 'recursion_beast' },
  { id: 'abyss', displayName: 'ABYSS', unlockCostShards: 200, bossId: 'stack_overflow' },
  { id: 'main', displayName: 'MAIN', unlockCostShards: 1000, bossId: 'merge_conflict' },
]

/** Layer index by id, for seed-driven procgen */
export const LAYER_INDEX: Record<LayerId, number> = {
  surface: 0,
  shallow: 1,
  deep: 2,
  abyss: 3,
  main: 4,
}

// ── Drama clock ──────────────────────────────────────────────────────
export const DRAMA_PHASE_MS = {
  calm: 5 * 60 * 1000,
  crescendo: 15 * 60 * 1000,
  climax: 20 * 60 * 1000,
  dusk: 10 * 60 * 1000,
} as const

// ── Rate limits for parser signal translation ────────────────────────
export const RATE_LIMITS = {
  moteRainMinIntervalMs: 2_000,
  bloomThresholdFunctions: 5,
  bloomMinIntervalMs: 15_000,
  platformGrowMinIntervalMs: 60_000,
  pillarBGlitchMinIntervalMs: 15_000,
  flowCascadeCooldownMs: 20 * 60 * 1000,
} as const

// ── Risk model ───────────────────────────────────────────────────────
export const KIN_RESPAWN_MS = 60_000
export const KIN_RESPAWN_COST_TOKENS = 5
export const LAYER_COLLAPSE_RECOVERY_MS = 3 * 60 * 1000
export const EXPEDITION_MIN_FAIL_RATE = 0.05
export const EXPEDITION_MAX_FAIL_RATE = 0.20

// ── Passive generation baseline (the "always alive" heartbeat) ──────
export const PASSIVE_MOTE_BASE_INTERVAL_MS = 6_000
