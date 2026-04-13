/** Vibe States — thresholds on the 0–100 Vibe Meter */
export type VibeStateName = 'dead_zone' | 'cruising' | 'flow_state' | 'peak_vibe'

export interface VibeStateDefinition {
  name: VibeStateName
  label: string
  min: number
  max: number
  resourceMultiplier: number
  proxySpeedMultiplier: number
  glitchSpawnMultiplier: number
  logicFragmentDropMultiplier: number
  ambientColor: string
  hudAccent: string
  proxyFace: string
  hudMessage: string | null
}

export interface VibeState {
  value: number
  stateName: VibeStateName
  /** Timestamp of last vibe change */
  lastUpdate: number
  /** Whether a Flow State Event is currently active */
  flowEventActive: boolean
  flowEventStartedAt: number | null
  /** Cooldown: earliest time the next Flow State Event can trigger */
  flowEventCooldownUntil: number
  /** Consecutive minutes above 70 during active Flow State Event */
  sustainedFlowMinutes: number
  /** Number of AI Token Bundles in the last 2 minutes (for Flow State trigger) */
  recentTokenBundles: number[]
}

export interface FlowStateReport {
  duration: number
  resourcesGenerated: Record<string, number>
  glitchesAvoided: number
  peakVibeReached: number
  sustainedFlowBonus: number
}

export type VibeHookTrigger = 'enter' | 'exit' | 'tick'

export interface VibeHook {
  id: string
  on: VibeHookTrigger
  state: VibeStateName | '*'
  handler: (ctx: VibeContext) => void | Promise<void>
}

export interface VibeContext {
  currentState: VibeStateName
  previousState: VibeStateName | null
  value: number
  delta: number
  flowEventActive: boolean
}
