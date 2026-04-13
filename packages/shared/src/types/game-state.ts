import type { ResourceAmounts } from './resources.js'
import type { VibeState } from './vibe.js'
import type { Proxy } from './proxy.js'
import type { Building } from './building.js'
import type { Glitch } from './glitch.js'
import type { MiningMap } from './mining.js'

export interface ColonyState {
  resources: ResourceAmounts
  vibe: VibeState
  proxies: Proxy[]
  buildings: Building[]
  glitches: Glitch[]
  miningMap: MiningMap
  /** Whether standby mode is active */
  standbyActive: boolean
  standbyStartedAt: number | null
  scheduledJobs: ScheduledJob[]
  /** Micro-objectives for the current day */
  dailyObjectives: DailyObjective[]
  /** Current streak count */
  streakDays: number
  lastActiveDate: string | null
}

export interface PrestigeData {
  cleanArchPoints: number
  prestigeCount: number
  lastPrestigeAt: number | null
  techTreeUnlocks: string[]
  codexUnlocks: string[]
  ariaShards: number
  logicFragments: number
  /** ARIA-0 persists through prestige */
  ariaProxy: Proxy | null
}

export interface GameState {
  colony: ColonyState
  prestige: PrestigeData
  settings: GameSettings
  /** Session start timestamp */
  sessionStartedAt: number
  /** Total accumulated XP across all prestiges */
  totalXp: number
  /** Whether ARIA has been awakened */
  awakened: boolean
}

export interface GameSettings {
  fpsLimit: 15 | 30 | 60
  lowPowerMode: boolean
  cloudSyncEnabled: boolean
  soundEnabled: boolean
}

export interface ScheduledJob {
  id: string
  type: 'passive_mine' | 'refinery_shift' | 'deep_scan' | 'curation_rest' | 'vibe_meditation'
  proxyId: string
  startedAt: number
  durationMs: number
}

export interface DailyObjective {
  id: string
  description: string
  progress: number
  target: number
  completed: boolean
  reward: Record<string, number>
}
