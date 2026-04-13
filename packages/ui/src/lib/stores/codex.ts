import { writable, derived } from 'svelte/store'
import type { CodexEntry, CodexCategory } from '@idle-vibes/shared'
import { gameState } from './game-state'

export const selectedCategory = writable<CodexCategory>('resources')
export const codexOpen = writable(false)

export const unlockedEntries = derived(gameState, ($state) => {
  return new Set($state.prestige.codexUnlocks)
})
