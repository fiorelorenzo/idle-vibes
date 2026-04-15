import { defineQuery } from 'bitecs'
import { Lifetime } from '../components'
import type { EcsWorld } from '../world'
import { killEntity } from '../world'

const lifeQuery = defineQuery([Lifetime])

/** Decrements Lifetime and culls entities whose remaining time hits zero. */
export function lifetimeSystem(world: EcsWorld): void {
  const entities = lifeQuery(world)
  const dt = world.delta
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    Lifetime.remaining[eid] -= dt
    if (Lifetime.remaining[eid] <= 0) {
      killEntity(world, eid)
    }
  }
}
