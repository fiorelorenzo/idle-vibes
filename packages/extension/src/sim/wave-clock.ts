import type { GameEvent, GlitchKind, LayerId } from '@idle-vibes/shared'
import type { DramaClock } from './drama-clock'

/**
 * Periodic glitch wave emitter. The cadence depends on the current drama
 * phase so the sidebar feels like it's *telling a story* rather than
 * ticking a metronome.
 *
 * Waves 3-5 glitches each, type drawn from a small pool.
 */
export class WaveClock {
  private timer: ReturnType<typeof setTimeout> | null = null
  private emit: (e: GameEvent) => void = () => {}
  private drama: DramaClock | null = null

  start(drama: DramaClock, emit: (e: GameEvent) => void): void {
    this.drama = drama
    this.emit = emit
    this.schedule()
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private schedule(): void {
    const phase = this.drama?.currentPhase() ?? 'calm'
    const baseMs = phase === 'calm'
      ? 120_000
      : phase === 'crescendo'
      ? 80_000
      : phase === 'climax'
      ? 50_000
      : 150_000
    const jitter = baseMs * 0.3 * (Math.random() - 0.5)
    const delay = Math.max(15_000, Math.floor(baseMs + jitter))
    this.timer = setTimeout(() => this.fire(), delay)
  }

  private fire(): void {
    const phase = this.drama?.currentPhase() ?? 'calm'
    const count = phase === 'climax' ? 5 : phase === 'crescendo' ? 4 : 3
    const glitchType: GlitchKind = pick(
      phase === 'calm'
        ? ['bug_sprite']
        : phase === 'crescendo'
        ? ['bug_sprite', 'runner']
        : phase === 'climax'
        ? ['bug_sprite', 'runner', 'tank']
        : ['bug_sprite', 'leech'],
    )
    const layer: LayerId = 'surface'
    this.emit({ kind: 'glitch_spawn', glitchType, count, reason: 'wave', layer })
    this.schedule()
  }
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
