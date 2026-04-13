import type { ParserSignal, VibeState, VibeStateName, FlowStateReport, VibeHook, VibeContext } from '@idle-vibes/shared'
import {
  VIBE_MIN,
  VIBE_MAX,
  VIBE_DECAY_PER_MIN,
  VIBE_PEAK_DECAY_PER_MIN,
  VIBE_PRESSURE,
  FLOW_EVENT_MIN_TOKENS,
  FLOW_EVENT_COOLDOWN_MS,
  FLOW_SUSTAINED_BONUS_PERCENT,
  getVibeStateName,
} from '@idle-vibes/shared'

/**
 * The Vibe Engine — maintains the Vibe Meter and manages state transitions.
 *
 * Processes parser signals into vibe pressure, applies decay,
 * and triggers Flow State Events when conditions are met.
 */
export class VibeEngine {
  private state: VibeState = {
    value: 30,
    stateName: 'cruising',
    lastUpdate: Date.now(),
    flowEventActive: false,
    flowEventStartedAt: null,
    flowEventCooldownUntil: 0,
    sustainedFlowMinutes: 0,
    recentTokenBundles: [],
  }

  private hooks: VibeHook[] = []
  private flowReportCallback: ((report: FlowStateReport) => void) | null = null
  /** Tracks resources generated during flow event for the report */
  private flowResources: Record<string, number> = {}
  private flowGlitchesAvoided = 0
  private flowPeakVibe = 0

  getState(): VibeState {
    return { ...this.state }
  }

  setValue(value: number): void {
    this.state.value = Math.max(VIBE_MIN, Math.min(VIBE_MAX, value))
    this.state.stateName = getVibeStateName(this.state.value)
  }

  onFlowReport(callback: (report: FlowStateReport) => void): void {
    this.flowReportCallback = callback
  }

  registerHook(hook: VibeHook): void {
    this.hooks.push(hook)
  }

  /**
   * Process a parser signal and apply vibe pressure.
   */
  applySignal(signal: ParserSignal): void {
    const pressure = this.getPressureFromSignal(signal)
    if (pressure === 0) return

    // Track token bundles for Flow State Event triggering
    if (signal.type === 'ai_token_bundle') {
      const now = Date.now()
      this.state.recentTokenBundles.push(now)
      // Keep only bundles from the last 2 minutes
      const twoMinAgo = now - 2 * 60 * 1000
      this.state.recentTokenBundles = this.state.recentTokenBundles.filter((t) => t >= twoMinAgo)
    }

    this.applyPressure(pressure)
  }

  /**
   * Apply a direct vibe pressure value. Positive = good, negative = bad.
   */
  applyPressure(pressure: number): void {
    const previousState = this.state.stateName
    const previousValue = this.state.value

    this.state.value = Math.max(VIBE_MIN, Math.min(VIBE_MAX, this.state.value + pressure))
    this.state.stateName = getVibeStateName(this.state.value)
    this.state.lastUpdate = Date.now()

    // Track peak vibe during flow event
    if (this.state.flowEventActive && this.state.value > this.flowPeakVibe) {
      this.flowPeakVibe = this.state.value
    }

    // Handle state transitions
    if (previousState !== this.state.stateName) {
      this.fireHooks('exit', previousState, previousValue)
      this.fireHooks('enter', this.state.stateName, previousValue)
    }

    // Check Flow State Event trigger conditions
    this.checkFlowEventTrigger()
    // Check Flow State Event end conditions
    this.checkFlowEventEnd()
  }

  /**
   * Called on a regular tick (every ~1 second) to apply passive decay.
   */
  tick(deltaMs: number): void {
    const deltaMin = deltaMs / 60_000

    // Apply decay
    let decayRate = VIBE_DECAY_PER_MIN
    if (this.state.stateName === 'peak_vibe') {
      decayRate = VIBE_PEAK_DECAY_PER_MIN
    }

    const decay = decayRate * deltaMin
    if (decay > 0) {
      this.applyPressure(-decay)
    }

    // Track sustained flow bonus
    if (this.state.flowEventActive && this.state.value >= 70) {
      this.state.sustainedFlowMinutes += deltaMin
    }

    // Fire tick hooks
    this.fireHooks('tick', this.state.stateName, this.state.value)
  }

  private getPressureFromSignal(signal: ParserSignal): number {
    switch (signal.type) {
      case 'ai_token_bundle':
        return VIBE_PRESSURE.ai_token_bundle
      case 'errors_decreased':
        return VIBE_PRESSURE.errors_decreased * signal.value
      case 'errors_increased':
        return VIBE_PRESSURE.errors_increased * signal.value
      case 'errors_unchanged':
        return 0
      case 'git_commit_feat':
        return VIBE_PRESSURE.git_commit_feat
      case 'git_commit_fix':
        return VIBE_PRESSURE.git_commit_fix
      case 'git_commit':
        return VIBE_PRESSURE.git_commit
      case 'new_class':
        return VIBE_PRESSURE.new_class
      case 'new_function':
        return VIBE_PRESSURE.new_function
      case 'new_interface':
        return VIBE_PRESSURE.new_interface
      default:
        return 0
    }
  }

  private checkFlowEventTrigger(): void {
    if (this.state.flowEventActive) return
    if (this.state.value < 60) return
    if (Date.now() < this.state.flowEventCooldownUntil) return
    if (this.state.recentTokenBundles.length < FLOW_EVENT_MIN_TOKENS) return

    // Check no active glitches — this is checked by the game engine
    // before calling startFlowEvent()
  }

  /**
   * Called by the game engine when all Flow State conditions are verified
   * (including the "no active glitches" check the vibe engine can't do).
   */
  startFlowEvent(): void {
    this.state.flowEventActive = true
    this.state.flowEventStartedAt = Date.now()
    this.state.sustainedFlowMinutes = 0
    this.flowResources = {}
    this.flowGlitchesAvoided = 0
    this.flowPeakVibe = this.state.value
  }

  canTriggerFlowEvent(): boolean {
    return (
      !this.state.flowEventActive &&
      this.state.value >= 60 &&
      Date.now() >= this.state.flowEventCooldownUntil &&
      this.state.recentTokenBundles.length >= FLOW_EVENT_MIN_TOKENS
    )
  }

  private checkFlowEventEnd(): void {
    if (!this.state.flowEventActive) return

    // End if vibe drops below 60
    if (this.state.value < 60) {
      this.endFlowEvent()
    }

    // Max duration: 15 minutes
    if (this.state.flowEventStartedAt) {
      const elapsed = Date.now() - this.state.flowEventStartedAt
      if (elapsed >= 15 * 60 * 1000) {
        this.endFlowEvent()
      }
    }
  }

  private endFlowEvent(): void {
    const sustained = this.state.sustainedFlowMinutes
    const bonus = Math.floor(sustained) * FLOW_SUSTAINED_BONUS_PERCENT

    const report: FlowStateReport = {
      duration: this.state.flowEventStartedAt ? Date.now() - this.state.flowEventStartedAt : 0,
      resourcesGenerated: { ...this.flowResources },
      glitchesAvoided: this.flowGlitchesAvoided,
      peakVibeReached: this.flowPeakVibe,
      sustainedFlowBonus: bonus,
    }

    this.state.flowEventActive = false
    this.state.flowEventStartedAt = null
    this.state.flowEventCooldownUntil = Date.now() + FLOW_EVENT_COOLDOWN_MS
    this.state.sustainedFlowMinutes = 0

    this.flowReportCallback?.(report)
  }

  trackFlowResource(resourceId: string, amount: number): void {
    if (!this.state.flowEventActive) return
    this.flowResources[resourceId] = (this.flowResources[resourceId] ?? 0) + amount
  }

  trackFlowGlitchAvoided(): void {
    if (!this.state.flowEventActive) return
    this.flowGlitchesAvoided++
  }

  private fireHooks(trigger: 'enter' | 'exit' | 'tick', state: VibeStateName, previousValue: number): void {
    const ctx: VibeContext = {
      currentState: this.state.stateName,
      previousState: trigger === 'enter' || trigger === 'exit' ? state : null,
      value: this.state.value,
      delta: this.state.value - previousValue,
      flowEventActive: this.state.flowEventActive,
    }

    for (const hook of this.hooks) {
      if (hook.on !== trigger) continue
      if (hook.state !== '*' && hook.state !== state) continue
      try {
        hook.handler(ctx)
      } catch {
        // Hooks should not crash the engine
      }
    }
  }
}
