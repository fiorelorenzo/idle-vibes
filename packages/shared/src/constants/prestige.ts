/** ARIA Shards required for Awakening */
export const ARIA_SHARDS_FOR_AWAKENING = 50

/** Base scheduled job slots */
export const BASE_JOB_SLOTS = 2
/** Max scheduled job slots (via Tech Tree) */
export const MAX_JOB_SLOTS = 5

/** Streak bonuses */
export const STREAK_BONUSES = [
  { days: 2, description: '+10% Raw Data generation all day', rawDataMultiplier: 1.1 },
  { days: 5, description: 'Logic Fragment drop rate +25%', fragmentDropMultiplier: 1.25 },
  { days: 10, description: 'ARIA-0 cosmetic evolution', cosmetic: true },
  { days: 30, description: 'Unique "Veteran" colony skin', cosmetic: true },
] as const

/** Tech Tree categories and max levels */
export const TECH_TREE = {
  refining_efficiency: { maxLevel: 5, costPerLevel: 10, bonusPerLevel: 0.1 },
  proxy_performance: { maxLevel: 5, costPerLevel: 15, bonusPerLevel: 0.15 },
  glitch_resistance: { maxLevel: 5, costPerLevel: 12, bonusPerLevel: 0.1 },
  passive_generation: { maxLevel: 3, costPerLevel: 20, bonusPerLevel: 1.0 },
  vibe_stability: { maxLevel: 5, costPerLevel: 10, bonusPerLevel: 0.1 },
  aria_assembly: { maxLevel: 1, costPerLevel: 50, bonusPerLevel: 1.0 },
} as const
