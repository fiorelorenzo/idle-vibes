import { describe, it, expect } from 'vitest'
import type { ParserSignal } from '@idle-vibes/shared'
import { VibeEngine } from '../src/vibe/vibe-engine'

function makeSignal(type: ParserSignal['type'], value = 1): ParserSignal {
  return { type, pillar: 'A', timestamp: Date.now(), value }
}

describe('VibeEngine', () => {
  describe('initial state', () => {
    it('starts with value 30', () => {
      const engine = new VibeEngine()
      expect(engine.getState().value).toBe(30)
    })

    it('starts in cruising state', () => {
      const engine = new VibeEngine()
      expect(engine.getState().stateName).toBe('cruising')
    })

    it('starts with no active flow event', () => {
      const engine = new VibeEngine()
      expect(engine.getState().flowEventActive).toBe(false)
    })
  })

  describe('applySignal', () => {
    it('ai_token_bundle increases vibe', () => {
      const engine = new VibeEngine()
      const before = engine.getState().value
      engine.applySignal(makeSignal('ai_token_bundle'))
      expect(engine.getState().value).toBeGreaterThan(before)
    })

    it('errors_increased decreases vibe', () => {
      const engine = new VibeEngine()
      const before = engine.getState().value
      engine.applySignal(makeSignal('errors_increased', 2))
      expect(engine.getState().value).toBeLessThan(before)
    })

    it('errors_unchanged does not change vibe', () => {
      const engine = new VibeEngine()
      const before = engine.getState().value
      engine.applySignal(makeSignal('errors_unchanged'))
      expect(engine.getState().value).toBe(before)
    })
  })

  describe('clamping', () => {
    it('vibe does not exceed 100', () => {
      const engine = new VibeEngine()
      engine.setValue(99)
      // Apply many positive signals
      for (let i = 0; i < 50; i++) {
        engine.applySignal(makeSignal('git_commit_feat'))
      }
      expect(engine.getState().value).toBeLessThanOrEqual(100)
    })

    it('vibe does not go below 0', () => {
      const engine = new VibeEngine()
      engine.setValue(1)
      // Apply many negative signals
      for (let i = 0; i < 50; i++) {
        engine.applySignal(makeSignal('errors_increased', 5))
      }
      expect(engine.getState().value).toBeGreaterThanOrEqual(0)
    })
  })

  describe('tick', () => {
    it('applies decay over time', () => {
      const engine = new VibeEngine()
      engine.setValue(50)
      const before = engine.getState().value
      engine.tick(60_000) // 1 minute
      expect(engine.getState().value).toBeLessThan(before)
    })
  })

  describe('canTriggerFlowEvent', () => {
    it('returns false when value < 60', () => {
      const engine = new VibeEngine()
      engine.setValue(50)
      expect(engine.canTriggerFlowEvent()).toBe(false)
    })

    it('returns false when not enough recent token bundles', () => {
      const engine = new VibeEngine()
      engine.setValue(70)
      expect(engine.canTriggerFlowEvent()).toBe(false)
    })
  })

  describe('state transitions', () => {
    it('transitions from cruising to flow_state at 60', () => {
      const engine = new VibeEngine()
      engine.setValue(59)
      expect(engine.getState().stateName).toBe('cruising')
      engine.applyPressure(1)
      expect(engine.getState().stateName).toBe('flow_state')
    })

    it('transitions from flow_state to peak_vibe at 85', () => {
      const engine = new VibeEngine()
      engine.setValue(84)
      expect(engine.getState().stateName).toBe('flow_state')
      engine.applyPressure(1)
      expect(engine.getState().stateName).toBe('peak_vibe')
    })

    it('transitions from cruising to dead_zone at 25 boundary', () => {
      const engine = new VibeEngine()
      engine.setValue(25)
      expect(engine.getState().stateName).toBe('cruising')
      engine.applyPressure(-1)
      expect(engine.getState().stateName).toBe('dead_zone')
    })
  })
})
