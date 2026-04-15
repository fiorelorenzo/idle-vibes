import { defineQuery, hasComponent } from 'bitecs'
import { Position, PreviousPosition, Velocity, Particle } from '../components'
import type { EcsWorld } from '../world'
import { killEntity } from '../world'

const particleQuery = defineQuery([Particle, Position, Velocity])

/**
 * Integrates particles (gravity, velocity, life decay).
 * Rendering of particles happens through the same SpriteRegistry + Renderable
 * flow as Kin — just as cheap graphics objects that don't have walk cycles.
 */
export function particleSystem(world: EcsWorld): void {
  const dt = world.delta
  const entities = particleQuery(world)
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    Particle.life[eid] -= dt
    if (Particle.life[eid] <= 0) {
      killEntity(world, eid)
      continue
    }
    if (hasComponent(world, PreviousPosition, eid)) {
      PreviousPosition.x[eid] = Position.x[eid]
      PreviousPosition.y[eid] = Position.y[eid]
    }
    Velocity.vy[eid] += Particle.gravity[eid] * dt
    Position.x[eid] += Velocity.vx[eid] * dt
    Position.y[eid] += Velocity.vy[eid] * dt

    const sprite = world.sprites.get(eid)
    if (sprite) {
      sprite.alpha = Math.max(0, Particle.life[eid] / Particle.maxLife[eid])
    }
  }
}
