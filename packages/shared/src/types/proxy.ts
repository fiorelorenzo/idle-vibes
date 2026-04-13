export type ProxyRole = 'miner' | 'constructor' | 'guard' | 'operator'

export interface Proxy {
  id: string
  role: ProxyRole
  name: string

  logicIntegrity: number
  energyLevel: number
  experience: number
  vibeSensitivity: number

  /** Role-specific unique stat */
  uniqueStat: number

  position: { x: number; y: number }
  assignedBuildingId: string | null
  assignedJobId: string | null

  /** Current behavioral state */
  state: ProxyState
  /** Whether this is ARIA-0 (persists through prestige) */
  isAria: boolean
}

export type ProxyState =
  | 'idle'
  | 'working'
  | 'moving'
  | 'charging'
  | 'standby'
  | 'lost'
  | 'berserker'
  | 'legacy_mode'
  | 'glitched'

export interface ProxyRoleDefinition {
  role: ProxyRole
  uniqueStatName: string
  preferredEnergy: string
  baseUniqueStat: number
  tierBonusXp: [number, number, number]
}
