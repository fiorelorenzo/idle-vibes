export type BuildingId =
  | 'buffer_tank'
  | 'refinery'
  | 'volatile_condenser'
  | 'vibe_condenser'
  | 'curation_pod'
  | 'firewall_turret'
  | 'core_terminal'
  | 'fragment_extractor'
  | 'overclock_terminal'
  | 'vibe_resonator'

export interface BuildingDefinition {
  id: BuildingId
  name: string
  description: string
  cost: Record<string, number>
  /** Whether this building auto-spawns (e.g. Vibe Condenser during Flow State) */
  autoSpawn: boolean
}

export interface Building {
  instanceId: string
  buildingId: BuildingId
  position: { x: number; y: number }
  level: number
  efficiency: number
  assignedProxyId: string | null
  /** Whether the building has the "Faulty" flag from a low-integrity Constructor */
  faulty: boolean
  /** Whether in maintenance mode (Operator Dead Zone behavior) */
  maintenanceMode: boolean
  /** Overclock end timestamp, null if not overclocked */
  overclockUntil: number | null
}
