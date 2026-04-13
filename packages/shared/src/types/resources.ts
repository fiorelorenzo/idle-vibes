/**
 * Three-tier resource architecture.
 *
 * Tier 1 (Volatile)  — fast cycle, resets on prestige
 * Tier 2 (Stable)    — mid-term, resets on prestige
 * Tier 3 (Persistent) — survives prestige
 */
export type ResourceTier = 1 | 2 | 3

export type ResourceId =
  // Tier 1
  | 'raw_data'
  | 'volatile_energy'
  | 'vibe_charge'
  // Tier 2
  | 'stabilized_energy'
  | 'pure_energy'
  // Tier 3
  | 'clean_arch_points'
  | 'logic_fragments'
  | 'aria_shards'

export interface ResourceDefinition {
  id: ResourceId
  name: string
  tier: ResourceTier
  baseCap: number | null
  maxCap: number | null
  /** Vibe Charge decays to zero after this many ms if unspent (null = no decay) */
  decayAfterMs: number | null
}

export type ResourceAmounts = Record<ResourceId, number>

export interface ConversionRate {
  from: ResourceId
  to: ResourceId
  ratio: number
  buildingRequired: string | null
}
