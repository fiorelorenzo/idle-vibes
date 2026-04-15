import { defineQuery } from 'bitecs'
import { Position, FloatingText } from '../components'
import type { EcsWorld } from '../world'
import { killEntity } from '../world'

const ftQuery = defineQuery([FloatingText, Position])

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
    Position.y[eid] -= 18 * dt

    const sprite = world.sprites.get(eid)
    if (sprite) {
      const ratio = FloatingText.life[eid] / FloatingText.maxLife[eid]
      sprite.alpha = ratio < 0.3 ? ratio / 0.3 : 1
    }
  }
}
