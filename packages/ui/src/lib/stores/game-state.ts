import { writable, derived } from 'svelte/store'
import type { GameState, ColonyState, VibeState, ResourceAmounts, Proxy, Building, Glitch } from '@idle-vibes/shared'
import { VIBE_STATES, INITIAL_RESOURCES } from '@idle-vibes/shared'
import { bridge } from '../bridge/webview-bridge'

function createDefaultState(): GameState {
  return {
    colony: {
      resources: { ...INITIAL_RESOURCES },
      vibe: {
        value: 30,
        stateName: 'cruising',
        lastUpdate: Date.now(),
        flowEventActive: false,
        flowEventStartedAt: null,
        flowEventCooldownUntil: 0,
        sustainedFlowMinutes: 0,
        recentTokenBundles: [],
      },
      proxies: [],
      buildings: [],
      glitches: [],
      miningMap: { grid: [], width: 0, height: 0 },
      standbyActive: false,
      standbyStartedAt: null,
      scheduledJobs: [],
      dailyObjectives: [],
      streakDays: 0,
      lastActiveDate: null,
    },
    prestige: {
      cleanArchPoints: 0,
      prestigeCount: 0,
      lastPrestigeAt: null,
      techTreeUnlocks: [],
      codexUnlocks: [],
      ariaShards: 0,
      logicFragments: 0,
      ariaProxy: null,
    },
    settings: {
      fpsLimit: 30,
      lowPowerMode: false,
      cloudSyncEnabled: false,
      soundEnabled: true,
    },
    sessionStartedAt: Date.now(),
    totalXp: 0,
    awakened: false,
  }
}

export const gameState = writable<GameState>(createDefaultState())

// Derived stores for easy access in components
export const colony = derived(gameState, ($s) => $s.colony)
export const vibe = derived(gameState, ($s) => $s.colony.vibe)
export const resources = derived(gameState, ($s) => $s.colony.resources)
export const proxies = derived(gameState, ($s) => $s.colony.proxies)
export const buildings = derived(gameState, ($s) => $s.colony.buildings)
export const glitches = derived(gameState, ($s) => $s.colony.glitches)
export const prestige = derived(gameState, ($s) => $s.prestige)
export const vibeStateDef = derived(vibe, ($v) => VIBE_STATES[$v.stateName])

/**
 * Initialize the store — listen for state updates from the extension.
 */
export function initGameStore(): void {
  bridge.onMessage((msg) => {
    if (msg.type === 'ext:state-sync') {
      gameState.set(msg.state)
    }
  })

  // Request current state
  bridge.send({ type: 'ui:request-state' })
}
