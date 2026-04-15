import { writable, get } from 'svelte/store'

export interface GameEvent {
  id: string
  text: string
  type: 'info' | 'warning' | 'success' | 'danger'
  timestamp: number
}

let nextId = 0
const MAX_VISIBLE = 3
const EVENT_LIFETIME_MS = 3000

export const eventQueue = writable<GameEvent[]>([])

/**
 * Push a new event notification.
 * Auto-prunes events older than 3 seconds.
 */
export function pushEvent(text: string, type: GameEvent['type'] = 'info'): void {
  const now = Date.now()
  const event: GameEvent = {
    id: `evt_${nextId++}`,
    text,
    type,
    timestamp: now,
  }

  eventQueue.update((events) => {
    // Prune old events
    const fresh = events.filter((e) => now - e.timestamp < EVENT_LIFETIME_MS)
    // Add new event, keep max visible
    const updated = [...fresh, event]
    return updated.slice(-MAX_VISIBLE)
  })

  // Auto-remove after lifetime
  setTimeout(() => {
    eventQueue.update((events) => events.filter((e) => e.id !== event.id))
  }, EVENT_LIFETIME_MS)
}
