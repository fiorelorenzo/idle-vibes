import { defineQuery } from 'bitecs'
import { Position, Velocity, MoteTag, GridPos, PreviousPosition } from '../components'
import type { EcsWorld } from '../world'
import { TILE_SIZE } from '../../render/tiles'

const fallingMoteQuery = defineQuery([MoteTag, Position, Velocity, GridPos])

/**
 * Applies gravity to falling motes until they reach their grid landing spot.
 * Once landed, velocity is zeroed so the Scribe can walk up and pick them up.
 */
export function moteFallSystem(world: EcsWorld): void {
  const dt = world.delta
  const entities = fallingMoteQuery(world)
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    PreviousPosition.x[eid] = Position.x[eid]
    PreviousPosition.y[eid] = Position.y[eid]

    if (Velocity.vy[eid] <= 0) continue
    const landingY = GridPos.gy[eid] * TILE_SIZE + TILE_SIZE / 2
    Position.y[eid] += Velocity.vy[eid] * dt
    if (Position.y[eid] >= landingY) {
      Position.y[eid] = landingY
      Velocity.vy[eid] = 0
    }
  }
}
