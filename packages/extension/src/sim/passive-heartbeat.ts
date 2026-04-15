import type { GameEvent } from '@idle-vibes/shared'
import { PASSIVE_MOTE_BASE_INTERVAL_MS } from '@idle-vibes/shared'

/**
 * The "always alive" heartbeat. Even when the developer is away from the
 * keyboard, the colony generates a slow trickle of motes so the sidebar
 * is never visually dead. Fires one event roughly every 6 seconds.
 */
export class PassiveHeartbeat {
  private timer: ReturnType<typeof setInterval> | null = null

  start(onTick: (event: GameEvent) => void): void {
    this.stop()
    this.timer = setInterval(() => {
      onTick({ kind: 'mote_rain', count: 1, source: 'passive' })
    }, PASSIVE_MOTE_BASE_INTERVAL_MS)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
