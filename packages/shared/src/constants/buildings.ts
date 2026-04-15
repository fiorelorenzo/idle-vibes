import type { BuildingKind } from '../types/world.js'

export interface BuildingDef {
  id: BuildingKind
  name: string
  description: string
  cost: number
  /** Seconds between production ticks (0 = passive / no production) */
  productionIntervalSec: number
}

export const BUILDING_DEFS: readonly BuildingDef[] = [
  {
    id: 'loom',
    name: 'Scribe Loom',
    description: 'Spawns a new Scribe every 45 seconds.',
    cost: 15,
    productionIntervalSec: 45,
  },
  {
    id: 'barracks',
    name: 'Warden Barracks',
    description: 'Spawns a new Warden every 75 seconds.',
    cost: 30,
    productionIntervalSec: 75,
  },
  {
    id: 'well',
    name: 'Mote Well',
    description: '+1 passive Token every 8 seconds.',
    cost: 20,
    productionIntervalSec: 8,
  },
  {
    id: 'gate',
    name: 'Delver Gate',
    description: 'Reduces expedition duration by 20%.',
    cost: 40,
    productionIntervalSec: 0,
  },
]
