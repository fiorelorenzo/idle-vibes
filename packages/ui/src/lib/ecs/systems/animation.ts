import { defineQuery } from 'bitecs'
import { Animation, Velocity, SpriteRef, DIR } from '../components'
import type { EcsWorld } from '../world'

const animQuery = defineQuery([Animation, SpriteRef, Velocity])

/**
 * Advances animation frames based on elapsed time and picks a direction
 * from velocity so sprites face where they move.
 */
export function animationSystem(world: EcsWorld): void {
  const dt = world.delta
  const entities = animQuery(world)
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    const speed = Animation.speed[eid]
    Animation.elapsed[eid] += dt * speed
    if (Animation.elapsed[eid] >= 0.25) {
      Animation.elapsed[eid] = 0
      Animation.frame[eid] = (Animation.frame[eid] + 1) % 4
      SpriteRef.frame[eid] = Animation.frame[eid]
    }

    const vx = Velocity.vx[eid]
    const vy = Velocity.vy[eid]
    if (Math.abs(vx) > Math.abs(vy)) {
      SpriteRef.dir[eid] = vx > 0 ? DIR.right : DIR.left
    } else if (Math.abs(vy) > 0.1) {
      SpriteRef.dir[eid] = vy > 0 ? DIR.down : DIR.up
    }
  }
}
