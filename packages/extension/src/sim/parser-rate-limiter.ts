import type { ParserSignal, GameEvent } from '@idle-vibes/shared'
import { RATE_LIMITS } from '@idle-vibes/shared'

/**
 * Converts raw parser signals into game events, applying rate limits so
 * busty agent coding (e.g. Claude Code writing 20 classes in 10 seconds)
 * doesn't saturate the screen and devalue rare events.
 *
 * Returns zero or more GameEvents to emit this tick.
 */
export class ParserRateLimiter {
  private lastMoteRainAt = 0
  private newFunctionCounter = 0
  private lastBloomAt = 0
  private lastPlatformGrowAt = 0
  private lastPortalAt = 0
  private lastPillarBGlitchAt = 0
  private lastFlowCascadeAt = 0
  private spiritActive = false

  /** Called when a companion spirit's lifetime expires so a new one can spawn. */
  spiritEnded(): void {
    this.spiritActive = false
  }

  translate(signal: ParserSignal): GameEvent[] {
    const now = Date.now()
    const out: GameEvent[] = []

    switch (signal.type) {
      case 'ai_token_bundle': {
        if (now - this.lastMoteRainAt >= RATE_LIMITS.moteRainMinIntervalMs) {
          this.lastMoteRainAt = now
          const count = clamp(Math.ceil(signal.value / 80), 2, 10)
          out.push({ kind: 'mote_rain', count, source: 'ai' })
        }
        // Sustained AI activity: check for flow cascade
        if (now - this.lastFlowCascadeAt >= RATE_LIMITS.flowCascadeCooldownMs) {
          this.lastFlowCascadeAt = now
          out.push({ kind: 'flow_cascade' })
        }
        break
      }
      case 'errors_decreased': {
        out.push({ kind: 'focus_surge', amount: Math.max(1, signal.value) })
        break
      }
      case 'errors_increased': {
        if (now - this.lastPillarBGlitchAt >= RATE_LIMITS.pillarBGlitchMinIntervalMs) {
          this.lastPillarBGlitchAt = now
          out.push({
            kind: 'glitch_spawn',
            glitchType: 'bug_sprite',
            count: clamp(signal.value, 1, 3),
            reason: 'pillarB',
            layer: 'surface',
          })
        }
        break
      }
      case 'new_function': {
        this.newFunctionCounter++
        if (
          this.newFunctionCounter >= RATE_LIMITS.bloomThresholdFunctions &&
          now - this.lastBloomAt >= RATE_LIMITS.bloomMinIntervalMs
        ) {
          this.newFunctionCounter = 0
          this.lastBloomAt = now
          out.push({ kind: 'bloom', origin: 'random_scribe' })
        }
        break
      }
      case 'new_class': {
        if (now - this.lastPlatformGrowAt >= RATE_LIMITS.platformGrowMinIntervalMs) {
          this.lastPlatformGrowAt = now
          out.push({ kind: 'platform_grow', layer: 'surface' })
        } else {
          out.push({ kind: 'shard_pop', count: 1 })
        }
        break
      }
      case 'new_interface': {
        if (now - this.lastPortalAt >= 20_000) {
          this.lastPortalAt = now
          out.push({ kind: 'portal_open', durationMs: 10_000 })
        }
        break
      }
      case 'git_commit': {
        out.push({ kind: 'shard_pop', count: 1 })
        break
      }
      case 'git_commit_fix': {
        out.push({ kind: 'heal_pulse', amount: 10 })
        break
      }
      case 'git_commit_feat': {
        if (!this.spiritActive) {
          this.spiritActive = true
          out.push({ kind: 'summon_spirit', durationMs: 60_000 })
        }
        out.push({ kind: 'shard_pop', count: 2 })
        break
      }
      case 'errors_unchanged':
        break
    }

    return out
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
