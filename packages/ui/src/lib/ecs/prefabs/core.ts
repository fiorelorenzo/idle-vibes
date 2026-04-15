import { addComponent, addEntity } from 'bitecs'
import {
  Position,
  PreviousPosition,
  GridPos,
  SpriteRef,
  Renderable,
  Health,
  CoreTag,
  LayerRef,
} from '../components'
import type { EcsWorld } from '../world'
import { createCoreSprite } from '../../render/core-sprite'
import { TILE_SIZE } from '../../render/tiles'

export const CORE_MAX_HP = 100

/**
 * The Core — a large persistent entity at a fixed tile. It has HP
 * (passive decay when glitches nibble) and a visible sprite.
 */
export function spawnCore(world: EcsWorld, gx: number, gy: number, layer = 0): number {
  const eid = addEntity(world)
  addComponent(world, CoreTag, eid)
  addComponent(world, Position, eid)
  addComponent(world, PreviousPosition, eid)
  addComponent(world, GridPos, eid)
  addComponent(world, LayerRef, eid)
  addComponent(world, SpriteRef, eid)
  addComponent(world, Health, eid)
  addComponent(world, Renderable, eid)

  Position.x[eid] = gx * TILE_SIZE + TILE_SIZE / 2
  Position.y[eid] = gy * TILE_SIZE + TILE_SIZE / 2
  PreviousPosition.x[eid] = Position.x[eid]
  PreviousPosition.y[eid] = Position.y[eid]
  GridPos.gx[eid] = gx
  GridPos.gy[eid] = gy
  LayerRef.layer[eid] = layer
  Health.hp[eid] = CORE_MAX_HP
  Health.max[eid] = CORE_MAX_HP

  const sprite = createCoreSprite(world.pixi.themeInts)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  return eid
}

/** Applies the current HP ratio to the Core sprite if present. */
export function refreshCoreHp(world: EcsWorld, eid: number): void {
  const sprite = world.sprites.get(eid) as (ReturnType<typeof createCoreSprite> | undefined)
  if (!sprite) return
  sprite.setHp(Health.hp[eid] / Health.max[eid])
}
