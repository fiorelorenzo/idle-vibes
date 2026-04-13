import type { ProxyRole, ProxyRoleDefinition } from '../types/proxy.js'

export const PROXY_ROLES: Record<ProxyRole, ProxyRoleDefinition> = {
  miner: {
    role: 'miner',
    uniqueStatName: 'Throughput',
    preferredEnergy: 'AI Token Bundles',
    baseUniqueStat: 1,
    tierBonusXp: [50, 200, 500] as [number, number, number],
  },
  constructor: {
    role: 'constructor',
    uniqueStatName: 'Precision',
    preferredEnergy: 'Pure Energy',
    baseUniqueStat: 1,
    tierBonusXp: [50, 200, 500] as [number, number, number],
  },
  guard: {
    role: 'guard',
    uniqueStatName: 'Vigilance',
    preferredEnergy: 'Volatile Energy',
    baseUniqueStat: 3,
    tierBonusXp: [50, 200, 500] as [number, number, number],
  },
  operator: {
    role: 'operator',
    uniqueStatName: 'Uptime',
    preferredEnergy: 'Commit Events',
    baseUniqueStat: 1,
    tierBonusXp: [50, 200, 500] as [number, number, number],
  },
}

/** Proxy faces by state */
export const PROXY_FACES = {
  working: '[^_^]',
  low_energy: '[-_-]',
  low_integrity: '[x_x]',
  standby: '[z z]',
  flow_state: '[*_*]',
  peak_vibe: '[\u2726_\u2726]',
  glitched: '[###]',
} as const

/** Logic Integrity thresholds that trigger failure modes */
export const INTEGRITY_THRESHOLDS = {
  miner_lost: 20,
  constructor_faulty: 30,
  guard_berserker: 10,
  guard_attacks_buildings: 40,
  operator_legacy: 25,
} as const

/** XP required per tier */
export const XP_TIERS = [50, 200, 500] as const

/** Proxy charging: auto-return to charging station below this energy level */
export const AUTO_CHARGE_THRESHOLD = 15
