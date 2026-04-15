import type { GameEvent } from '@idle-vibes/shared'
import { DRAMA_PHASE_MS } from '@idle-vibes/shared'

type Phase = 'calm' | 'crescendo' | 'climax' | 'dusk'

/**
 * Dramatic 4-phase cycle on a real-time clock, independent of player idle.
 * Each phase has its own wave cadence and modifier, set in the WaveClock.
 *
 * Total loop: ~50 minutes.
 */
export class DramaClock {
  private phase: Phase = 'calm'
  private elapsed = 0
  private interval: ReturnType<typeof setInterval> | null = null
  private emit: (e: GameEvent) => void = () => {}

  start(emit: (e: GameEvent) => void): void {
    this.emit = emit
    this.interval = setInterval(() => this.tick(1000), 1000)
    this.emit({ kind: 'phase_change', phase: this.phase })
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  currentPhase(): Phase {
    return this.phase
  }

  private tick(ms: number): void {
    this.elapsed += ms
    const budget = DRAMA_PHASE_MS[this.phase]
    if (this.elapsed >= budget) {
      this.elapsed = 0
      this.phase = nextPhase(this.phase)
      this.emit({ kind: 'phase_change', phase: this.phase })
    }
  }
}

function nextPhase(phase: Phase): Phase {
  switch (phase) {
    case 'calm':
      return 'crescendo'
    case 'crescendo':
      return 'climax'
    case 'climax':
      return 'dusk'
    case 'dusk':
      return 'calm'
  }
}
