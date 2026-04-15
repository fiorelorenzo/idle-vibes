import { defineQuery } from 'bitecs'
import { Position, PreviousPosition, FloatingText } from '../components'
import type { EcsWorld } from '../world'
import { killEntity } from '../world'

const ftQuery = defineQuery([FloatingText, Position, PreviousPosition])

/** Rises, fades, dies. */
export function floatingTextSystem(world: EcsWorld): void {
  const dt = world.delta
  const entities = ftQuery(world)
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    FloatingText.life[eid] -= dt
    if (FloatingText.life[eid] <= 0) {
      killEntity(world, eid)
      continue
    }
    // Snapshot previous position BEFORE advancing so the render
    // interpolator has a valid (prev, current) pair each tick.
    PreviousPosition.x[eid] = Position.x[eid]
    PreviousPosition.y[eid] = Position.y[eid]
    Position.y[eid] -= 18 * dt

    const sprite = world.sprites.get(eid)
    if (sprite) {
      const ratio = FloatingText.life[eid] / FloatingText.maxLife[eid]
      sprite.alpha = ratio < 0.3 ? ratio / 0.3 : 1
    }
  }
}
