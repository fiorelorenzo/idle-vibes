import { defineQuery } from 'bitecs'
import { AIState, Kin, KinType, SpriteRef, STATE, KIN } from '../components'
import type { EcsWorld } from '../world'
import { rand } from '../util/rng'

const idleKinQuery = defineQuery([Kin, KinType, AIState, SpriteRef])

/**
 * Idle ambient behaviors — pure visual, no world mutation. When a Kin has
 * been idle for a while it briefly switches to a "dance" animation frame
 * offset for 1-2 seconds so the colony feels alive even during a lull.
 */
export function ambientSystem(world: EcsWorld): void {
  const entities = idleKinQuery(world)
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    if (AIState.state[eid] !== STATE.idle) continue
    AIState.ticks[eid]++
    if (AIState.ticks[eid] < 60) continue // ~3s of real idle
    if (rand(world) < 0.002) {
      // Short dance flicker — bump frame once
      SpriteRef.frame[eid] = (SpriteRef.frame[eid] + 1) % 4
      if (KinType.type[eid] === KIN.scribe) {
        // sometimes emit a happy-face particle equivalent: just reset ticks
      }
      AIState.ticks[eid] = 0
    }
  }
}
