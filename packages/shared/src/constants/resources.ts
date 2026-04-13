import type { ConversionRate, ResourceDefinition, ResourceId } from '../types/resources.js'

/** Two hours in milliseconds — Vibe Charge decay timer */
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export const RESOURCES: Record<ResourceId, ResourceDefinition> = {
  // Tier 1 — Volatile
  raw_data: {
    id: 'raw_data',
    name: 'Raw Data',
    tier: 1,
    baseCap: 500,
    maxCap: 50_000,
    decayAfterMs: null,
  },
  volatile_energy: {
    id: 'volatile_energy',
    name: 'Volatile Energy',
    tier: 1,
    baseCap: 200,
    maxCap: 2_000,
    decayAfterMs: null,
  },
  vibe_charge: {
    id: 'vibe_charge',
    name: 'Vibe Charge',
    tier: 1,
    baseCap: 3,
    maxCap: 10,
    decayAfterMs: TWO_HOURS_MS,
  },
  // Tier 2 — Stable
  stabilized_energy: {
    id: 'stabilized_energy',
    name: 'Stabilized Energy',
    tier: 2,
    baseCap: 100,
    maxCap: 10_000,
    decayAfterMs: null,
  },
  pure_energy: {
    id: 'pure_energy',
    name: 'Pure Energy',
    tier: 2,
    baseCap: 50,
    maxCap: 500,
    decayAfterMs: null,
  },
  // Tier 3 — Persistent
  clean_arch_points: {
    id: 'clean_arch_points',
    name: 'Clean Architecture Points',
    tier: 3,
    baseCap: null,
    maxCap: null,
    decayAfterMs: null,
  },
  logic_fragments: {
    id: 'logic_fragments',
    name: 'Logic Fragments',
    tier: 3,
    baseCap: 10,
    maxCap: 50,
    decayAfterMs: null,
  },
  aria_shards: {
    id: 'aria_shards',
    name: 'ARIA Shards',
    tier: 3,
    baseCap: null,
    maxCap: null,
    decayAfterMs: null,
  },
}

export const CONVERSION_RATES: ConversionRate[] = [
  { from: 'raw_data', to: 'stabilized_energy', ratio: 10, buildingRequired: 'refinery' },
  {
    from: 'volatile_energy',
    to: 'stabilized_energy',
    ratio: 5,
    buildingRequired: 'volatile_condenser',
  },
  {
    from: 'volatile_energy',
    to: 'stabilized_energy',
    ratio: 0.2,
    buildingRequired: 'vibe_condenser',
  },
  { from: 'pure_energy', to: 'stabilized_energy', ratio: 1 / 3, buildingRequired: null },
  {
    from: 'stabilized_energy',
    to: 'clean_arch_points',
    ratio: 500,
    buildingRequired: 'core_terminal',
  },
]

export const INITIAL_RESOURCES: Record<ResourceId, number> = {
  raw_data: 0,
  volatile_energy: 0,
  vibe_charge: 0,
  stabilized_energy: 0,
  pure_energy: 0,
  clean_arch_points: 0,
  logic_fragments: 0,
  aria_shards: 0,
}
