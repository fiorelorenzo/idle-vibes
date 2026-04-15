import { defineQuery } from 'bitecs'
import { PathTarget, PathBuffer, GridPos, AIState, STATE } from '../components'
import type { EcsWorld } from '../world'
import { findPath, createPathResult } from '../pathfinding/astar'

const pendingPathQuery = defineQuery([PathTarget, PathBuffer, GridPos])

const scratch = createPathResult()
const MAX_REQUESTS_PER_TICK = 4

/**
 * Resolves path requests flagged as "pending" (active=0 but AIState=walking
 * with a new target set by AI). Writes waypoints into PathBuffer. The Movement
 * system then drains them.
 *
 * Request protocol:
 *   - AI sets PathTarget.gx/gy to the desired tile, state=walking.
 *   - Pathfinding system sees active=0 with state=walking → computes A*.
 *   - On success: writes waypoints into PathBuffer, sets active=1, nodeIdx=0.
 *   - On failure: sets state back to idle.
 */
export function pathfindingSystem(world: EcsWorld): void {
  const entities = pendingPathQuery(world)
  let processed = 0

  for (let i = 0; i < entities.length && processed < MAX_REQUESTS_PER_TICK; i++) {
    const eid = entities[i]
    if (PathTarget.active[eid] !== 0) continue
    if (AIState.state[eid] !== STATE.walking && AIState.state[eid] !== STATE.chasing_mote) continue

    const sx = GridPos.gx[eid]
    const sy = GridPos.gy[eid]
    const gx = PathTarget.gx[eid]
    const gy = PathTarget.gy[eid]

    scratch.nodes.length = 0
    scratch.found = false
    findPath(world.grid, sx, sy, gx, gy, scratch)

    if (!scratch.found) {
      AIState.state[eid] = STATE.idle
      continue
    }

    const maxWaypoints = 32
    const nodes = scratch.nodes
    const count = Math.min(nodes.length / 2, maxWaypoints)
    for (let n = 0; n < count; n++) {
      PathBuffer.nodes[eid][n * 2] = nodes[n * 2]
      PathBuffer.nodes[eid][n * 2 + 1] = nodes[n * 2 + 1]
    }
    PathBuffer.length[eid] = count
    PathTarget.nodeIdx[eid] = 0
    PathTarget.active[eid] = 1
    processed++
  }
}
