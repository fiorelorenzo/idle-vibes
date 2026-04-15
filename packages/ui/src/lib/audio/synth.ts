/**
 * Tiny WebAudio SFX synth. No samples, no deps — just oscillators
 * shaped by AD envelopes. Each cue is a one-shot square/triangle
 * with tuned pitch and decay.
 *
 * Gated by a runtime "enabled" flag so it can be toggled off without
 * touching the callsites. The first user interaction initializes the
 * AudioContext (browsers block auto-start on page load).
 */

let ctx: AudioContext | null = null
let enabled = false
let masterGain: GainNode | null = null

export function setSfxEnabled(on: boolean): void {
  enabled = on
  if (on && !ctx) {
    try {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
      masterGain = ctx.createGain()
      masterGain.gain.value = 0.06
      masterGain.connect(ctx.destination)
    } catch {
      // AudioContext creation can fail in locked-down contexts; just no-op.
    }
  }
}

export function isSfxEnabled(): boolean {
  return enabled
}

interface ToneOptions {
  freq: number
  endFreq?: number
  duration: number
  type?: OscillatorType
  gain?: number
}

function play(opts: ToneOptions): void {
  if (!enabled || !ctx || !masterGain) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = opts.type ?? 'square'
  osc.frequency.setValueAtTime(opts.freq, now)
  if (opts.endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.endFreq), now + opts.duration)
  }
  const peak = opts.gain ?? 1
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(peak, now + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration)
  osc.connect(gain)
  gain.connect(masterGain)
  osc.start(now)
  osc.stop(now + opts.duration + 0.05)
}

// ── Named cues ──────────────────────────────────────────────────

export const sfx = {
  moteDeliver(): void {
    play({ freq: 880, endFreq: 1320, duration: 0.08, type: 'triangle', gain: 0.8 })
  },
  glitchHit(): void {
    play({ freq: 220, endFreq: 120, duration: 0.12, type: 'square', gain: 0.6 })
  },
  glitchSpawn(): void {
    play({ freq: 110, endFreq: 80, duration: 0.18, type: 'sawtooth', gain: 0.5 })
  },
  commit(): void {
    play({ freq: 440, endFreq: 660, duration: 0.15, type: 'triangle', gain: 0.8 })
  },
  bossSpawn(): void {
    play({ freq: 80, endFreq: 60, duration: 0.7, type: 'sawtooth', gain: 1 })
  },
  bossDown(): void {
    play({ freq: 660, endFreq: 110, duration: 0.6, type: 'square', gain: 0.9 })
  },
  prestige(): void {
    play({ freq: 523, duration: 0.12, type: 'triangle', gain: 0.9 })
    setTimeout(() => play({ freq: 659, duration: 0.12, type: 'triangle', gain: 0.9 }), 120)
    setTimeout(() => play({ freq: 784, duration: 0.24, type: 'triangle', gain: 0.9 }), 240)
  },
  shardPop(): void {
    play({ freq: 1320, endFreq: 1760, duration: 0.05, type: 'triangle', gain: 0.6 })
  },
}
