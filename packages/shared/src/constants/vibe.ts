import type { VibeStateDefinition, VibeStateName } from '../types/vibe.js'

export const VIBE_MIN = 0
export const VIBE_MAX = 100

/** Passive decay per minute when no coding activity detected */
export const VIBE_DECAY_PER_MIN = 0.3
/** Accelerated decay per minute at Peak Vibe */
export const VIBE_PEAK_DECAY_PER_MIN = 1.5
/** Decay per minute during standby */
export const VIBE_STANDBY_DECAY_PER_MIN = 0.5

/** Vibe pressure values from various events */
export const VIBE_PRESSURE = {
  ai_token_bundle: 1.5,
  errors_decreased: 2.0,
  errors_increased: -1.0,
  git_commit_feat: 4.0,
  git_commit_fix: 2.0,
  git_commit: 1.0,
  glitch_spawn: -3.0,
  glitch_cleared_code: 2.0,
  glitch_cleared_click: 0.5,
  proxy_integrity_zero: -5.0,
  new_class: 3.0,
  new_function: 1.0,
  new_interface: 1.0,
  standby_per_min: -0.5,
} as const

/** Flow State Event: minimum AI Token Bundles in last 2 min to trigger */
export const FLOW_EVENT_MIN_TOKENS = 3
/** Flow State Event: cooldown between events (30 minutes) */
export const FLOW_EVENT_COOLDOWN_MS = 30 * 60 * 1000
/** Flow State Event: sustained bonus per minute above vibe 70 */
export const FLOW_SUSTAINED_BONUS_PERCENT = 5

export const VIBE_STATES: Record<VibeStateName, VibeStateDefinition> = {
  dead_zone: {
    name: 'dead_zone',
    label: 'DEAD ZONE',
    min: 0,
    max: 24,
    resourceMultiplier: 0.7,
    proxySpeedMultiplier: 0.8,
    glitchSpawnMultiplier: 1.5,
    logicFragmentDropMultiplier: 1.0,
    ambientColor: '#330000',
    hudAccent: '#FF4444',
    proxyFace: '[._.]',
    hudMessage: null,
  },
  cruising: {
    name: 'cruising',
    label: 'CRUISING',
    min: 25,
    max: 59,
    resourceMultiplier: 1.0,
    proxySpeedMultiplier: 1.0,
    glitchSpawnMultiplier: 1.0,
    logicFragmentDropMultiplier: 1.0,
    ambientColor: '#000a1a',
    hudAccent: '#00AAFF',
    proxyFace: '[^_^]',
    hudMessage: null,
  },
  flow_state: {
    name: 'flow_state',
    label: 'FLOW STATE',
    min: 60,
    max: 84,
    resourceMultiplier: 1.4,
    proxySpeedMultiplier: 1.25,
    glitchSpawnMultiplier: 0.7,
    logicFragmentDropMultiplier: 1.5,
    ambientColor: '#001a0d',
    hudAccent: '#00FF88',
    proxyFace: '[*_*]',
    hudMessage: "// you're in the zone",
  },
  peak_vibe: {
    name: 'peak_vibe',
    label: 'PEAK VIBE \u2726',
    min: 85,
    max: 100,
    resourceMultiplier: 2.0,
    proxySpeedMultiplier: 1.5,
    glitchSpawnMultiplier: 0.3,
    logicFragmentDropMultiplier: 3.0,
    ambientColor: '#1a001a',
    hudAccent: '#FF00FF',
    proxyFace: '[\u2726_\u2726]',
    hudMessage: '// peak vibe achieved \u2726',
  },
}

export function getVibeStateName(value: number): VibeStateName {
  if (value >= 85) return 'peak_vibe'
  if (value >= 60) return 'flow_state'
  if (value >= 25) return 'cruising'
  return 'dead_zone'
}
