import { describe, it, expect } from 'vitest'
import { getVibeStateName, VIBE_STATES, VIBE_PRESSURE } from '@idle-vibes/shared'

describe('getVibeStateName', () => {
  it('returns dead_zone for 0', () => {
    expect(getVibeStateName(0)).toBe('dead_zone')
  })

  it('returns dead_zone for 24', () => {
    expect(getVibeStateName(24)).toBe('dead_zone')
  })

  it('returns cruising for 25', () => {
    expect(getVibeStateName(25)).toBe('cruising')
  })

  it('returns cruising for 59', () => {
    expect(getVibeStateName(59)).toBe('cruising')
  })

  it('returns flow_state for 60', () => {
    expect(getVibeStateName(60)).toBe('flow_state')
  })

  it('returns flow_state for 84', () => {
    expect(getVibeStateName(84)).toBe('flow_state')
  })

  it('returns peak_vibe for 85', () => {
    expect(getVibeStateName(85)).toBe('peak_vibe')
  })

  it('returns peak_vibe for 100', () => {
    expect(getVibeStateName(100)).toBe('peak_vibe')
  })
})

describe('VIBE_STATES', () => {
  it('has correct thresholds for dead_zone', () => {
    expect(VIBE_STATES.dead_zone.min).toBe(0)
    expect(VIBE_STATES.dead_zone.max).toBe(24)
  })

  it('has correct thresholds for cruising', () => {
    expect(VIBE_STATES.cruising.min).toBe(25)
    expect(VIBE_STATES.cruising.max).toBe(59)
  })

  it('has correct thresholds for flow_state', () => {
    expect(VIBE_STATES.flow_state.min).toBe(60)
    expect(VIBE_STATES.flow_state.max).toBe(84)
  })

  it('has correct thresholds for peak_vibe', () => {
    expect(VIBE_STATES.peak_vibe.min).toBe(85)
    expect(VIBE_STATES.peak_vibe.max).toBe(100)
  })

  it('dead_zone has reduced resource multiplier', () => {
    expect(VIBE_STATES.dead_zone.resourceMultiplier).toBeLessThan(1)
  })

  it('cruising has baseline multiplier of 1', () => {
    expect(VIBE_STATES.cruising.resourceMultiplier).toBe(1.0)
  })

  it('flow_state has boosted resource multiplier', () => {
    expect(VIBE_STATES.flow_state.resourceMultiplier).toBeGreaterThan(1)
  })

  it('peak_vibe has the highest resource multiplier', () => {
    expect(VIBE_STATES.peak_vibe.resourceMultiplier).toBeGreaterThan(
      VIBE_STATES.flow_state.resourceMultiplier,
    )
  })
})

describe('VIBE_PRESSURE', () => {
  it('has positive pressure for good events', () => {
    expect(VIBE_PRESSURE.ai_token_bundle).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.errors_decreased).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.git_commit_feat).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.git_commit_fix).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.git_commit).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.glitch_cleared_code).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.glitch_cleared_click).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.new_class).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.new_function).toBeGreaterThan(0)
    expect(VIBE_PRESSURE.new_interface).toBeGreaterThan(0)
  })

  it('has negative pressure for bad events', () => {
    expect(VIBE_PRESSURE.errors_increased).toBeLessThan(0)
    expect(VIBE_PRESSURE.glitch_spawn).toBeLessThan(0)
    expect(VIBE_PRESSURE.proxy_integrity_zero).toBeLessThan(0)
    expect(VIBE_PRESSURE.standby_per_min).toBeLessThan(0)
  })
})
