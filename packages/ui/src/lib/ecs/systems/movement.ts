import { defineQuery } from 'bitecs'
import {
  Position,
  Velocity,
  PreviousPosition,
  PathTarget,
  PathBuffer,
  GridPos,
  AIState,
  STATE,
} from '../components'
import type { EcsWorld } from '../world'
import { TILE_SIZE } from '../../render/tiles'

const pathQuery = defineQuery([Position, PathTarget, PathBuffer, AIState])

const WALK_SPEED = 40 // pixels per second

/**
 * Advances entities along their path waypoints. When the final waypoint is
 * reached, PathTarget.active is set to 0 and the AIState returns to idle.
 *
 * Also writes PreviousPosition for interpolation in the render system.
 */
export function movementSystem(world: EcsWorld): void {
  const dt = world.delta
  const entities = pathQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    PreviousPosition.x[eid] = Position.x[eid]
    PreviousPosition.y[eid] = Position.y[eid]

    if (PathTarget.active[eid] === 0) {
      Velocity.vx[eid] = 0
      Velocity.vy[eid] = 0
      continue
    }

    const nodeIdx = PathTarget.nodeIdx[eid]
    const length = PathBuffer.length[eid]
    if (nodeIdx >= length) {
      // Arrived at last node
      PathTarget.active[eid] = 0
      Velocity.vx[eid] = 0
      Velocity.vy[eid] = 0
      const state = AIState.state[eid]
      if (state === STATE.walking || state === STATE.chasing_mote) {
        AIState.state[eid] = STATE.idle
        AIState.ticks[eid] = 0
      }
      continue
    }

    const tgtGx = PathBuffer.nodes[eid][nodeIdx * 2]
    const tgtGy = PathBuffer.nodes[eid][nodeIdx * 2 + 1]
    const tgtPxX = tgtGx * TILE_SIZE + TILE_SIZE / 2
    const tgtPxY = tgtGy * TILE_SIZE + TILE_SIZE / 2

    const dx = tgtPxX - Position.x[eid]
    const dy = tgtPxY - Position.y[eid]
    const dist = Math.hypot(dx, dy)

    if (dist < 1) {
      Position.x[eid] = tgtPxX
      Position.y[eid] = tgtPxY
      GridPos.gx[eid] = tgtGx
      GridPos.gy[eid] = tgtGy
      PathTarget.nodeIdx[eid] = nodeIdx + 1
      Velocity.vx[eid] = 0
      Velocity.vy[eid] = 0
      continue
    }

    const ndx = dx / dist
    const ndy = dy / dist
    const step = Math.min(dist, WALK_SPEED * dt)
    Position.x[eid] += ndx * step
    Position.y[eid] += ndy * step
    Velocity.vx[eid] = ndx * WALK_SPEED
    Velocity.vy[eid] = ndy * WALK_SPEED
  }
}
