import { addComponent, addEntity } from 'bitecs'
import {
  Position,
  PreviousPosition,
  Velocity,
  GridPos,
  SpriteRef,
  MoteTag,
  Item,
  Lifetime,
  Renderable,
} from '../components'
import type { EcsWorld } from '../world'
import { createMoteSprite } from '../../render/sprites'
import { TILE_SIZE } from '../../render/tiles'

/**
 * A Token mote. Falls from the sky, lands on a tile, and waits for a
 * Scribe to pick it up. If no one picks it up in ~20 seconds, it decays.
 */
export function spawnMote(world: EcsWorld, gx: number, gy: number, value = 1): number {
  const eid = addEntity(world)
  addComponent(world, MoteTag, eid)
  addComponent(world, Position, eid)
  addComponent(world, PreviousPosition, eid)
  addComponent(world, Velocity, eid)
  addComponent(world, GridPos, eid)
  addComponent(world, SpriteRef, eid)
  addComponent(world, Item, eid)
  addComponent(world, Lifetime, eid)
  addComponent(world, Renderable, eid)

  const tint = world.pixi.themeInts.chartsBlue
  // Start a few tiles above the target and fall
  Position.x[eid] = gx * TILE_SIZE + TILE_SIZE / 2
  Position.y[eid] = Math.max(0, gy - 3) * TILE_SIZE
  PreviousPosition.x[eid] = Position.x[eid]
  PreviousPosition.y[eid] = Position.y[eid]
  Velocity.vx[eid] = 0
  Velocity.vy[eid] = 30
  GridPos.gx[eid] = gx
  GridPos.gy[eid] = gy
  SpriteRef.tint[eid] = tint
  SpriteRef.frame[eid] = 0
  Item.kind[eid] = 1 // token
  Item.value[eid] = value
  Lifetime.remaining[eid] = 20 // seconds

  const sprite = createMoteSprite(world.pixi.themeInts, tint)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  return eid
}
