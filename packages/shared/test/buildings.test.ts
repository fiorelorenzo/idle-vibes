import { describe, it, expect } from 'vitest'
import { BUILDINGS, RESOURCES } from '@idle-vibes/shared'

describe('BUILDINGS', () => {
  const buildingEntries = Object.entries(BUILDINGS)

  it('all buildings have a non-empty name', () => {
    for (const [, building] of buildingEntries) {
      expect(building.name).toBeTruthy()
      expect(building.name.length).toBeGreaterThan(0)
    }
  })

  it('all buildings have a non-empty description', () => {
    for (const [, building] of buildingEntries) {
      expect(building.description).toBeTruthy()
      expect(building.description.length).toBeGreaterThan(0)
    }
  })

  it('only vibe_condenser has autoSpawn = true', () => {
    for (const [key, building] of buildingEntries) {
      if (key === 'vibe_condenser') {
        expect(building.autoSpawn).toBe(true)
      } else {
        expect(building.autoSpawn).toBe(false)
      }
    }
  })

  it('building costs reference valid resource IDs', () => {
    const validResourceIds = Object.keys(RESOURCES)
    for (const [, building] of buildingEntries) {
      for (const resourceId of Object.keys(building.cost)) {
        expect(validResourceIds).toContain(resourceId)
      }
    }
  })
})
