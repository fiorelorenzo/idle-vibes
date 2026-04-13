import { describe, it, expect } from 'vitest'
import { RESOURCES, INITIAL_RESOURCES, CONVERSION_RATES } from '@idle-vibes/shared'
import type { ResourceId } from '@idle-vibes/shared'

describe('RESOURCES tier assignments', () => {
  const tier1: ResourceId[] = ['raw_data', 'volatile_energy', 'vibe_charge']
  const tier2: ResourceId[] = ['stabilized_energy', 'pure_energy']
  const tier3: ResourceId[] = ['clean_arch_points', 'logic_fragments', 'aria_shards']

  it.each(tier1)('%s is tier 1', (id) => {
    expect(RESOURCES[id].tier).toBe(1)
  })

  it.each(tier2)('%s is tier 2', (id) => {
    expect(RESOURCES[id].tier).toBe(2)
  })

  it.each(tier3)('%s is tier 3', (id) => {
    expect(RESOURCES[id].tier).toBe(3)
  })
})

describe('INITIAL_RESOURCES', () => {
  const allResourceIds: ResourceId[] = [
    'raw_data',
    'volatile_energy',
    'vibe_charge',
    'stabilized_energy',
    'pure_energy',
    'clean_arch_points',
    'logic_fragments',
    'aria_shards',
  ]

  it('contains all resource IDs', () => {
    for (const id of allResourceIds) {
      expect(INITIAL_RESOURCES).toHaveProperty(id)
    }
  })

  it('all initial values are 0', () => {
    for (const id of allResourceIds) {
      expect(INITIAL_RESOURCES[id]).toBe(0)
    }
  })
})

describe('CONVERSION_RATES', () => {
  const validResourceIds = Object.keys(RESOURCES)

  it('all "from" fields are valid resource IDs', () => {
    for (const rate of CONVERSION_RATES) {
      expect(validResourceIds).toContain(rate.from)
    }
  })

  it('all "to" fields are valid resource IDs', () => {
    for (const rate of CONVERSION_RATES) {
      expect(validResourceIds).toContain(rate.to)
    }
  })

  it('all ratios are greater than 0', () => {
    for (const rate of CONVERSION_RATES) {
      expect(rate.ratio).toBeGreaterThan(0)
    }
  })
})
