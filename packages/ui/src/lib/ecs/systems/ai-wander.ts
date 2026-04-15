import { defineQuery } from 'bitecs'
import {
  AIState,
  GridPos,
  Kin,
  PathTarget,
  KinType,
  KIN,
  STATE,
} from '../components'
import type { EcsWorld } from '../world'
import { rand } from '../util/rng'

const idleKinQuery = defineQuery([Kin, AIState, GridPos, PathTarget, KinType])

/**
 * Phase 2 placeholder AI: idle Scribes pick a nearby tile and walk to it
 * every few seconds. This is just the bare minimum to prove movement +
 * pathfinding works. Phase 3 replaces this with the carry loop, Phase 4
 * adds Warden aggro, etc.
 */
export function aiWanderSystem(world: EcsWorld): void {
  const entities = idleKinQuery(world)
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    if (KinType.type[eid] !== KIN.scribe) continue
    if (AIState.state[eid] !== STATE.idle) continue
    if (world.time < AIState.nextThinkAt[eid]) continue

    const gx = GridPos.gx[eid]
    const gy = GridPos.gy[eid]

    const dx = Math.floor(rand(world) * 5) - 2
    const dy = Math.floor(rand(world) * 5) - 2
    const tgtX = Math.max(0, Math.min(world.grid.width - 1, gx + dx))
    const tgtY = Math.max(0, Math.min(world.grid.height - 1, gy + dy))

    if (tgtX === gx && tgtY === gy) {
      AIState.nextThinkAt[eid] = world.time + 1 + rand(world) * 2
      continue
    }

    PathTarget.gx[eid] = tgtX
    PathTarget.gy[eid] = tgtY
    PathTarget.active[eid] = 0
    AIState.state[eid] = STATE.walking
    AIState.nextThinkAt[eid] = world.time + 2 + rand(world) * 3
  }
}
