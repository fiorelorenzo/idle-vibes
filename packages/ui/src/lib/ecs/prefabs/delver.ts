import { addComponent, addEntity } from 'bitecs'
import {
  Position,
  PreviousPosition,
  Velocity,
  GridPos,
  KinType,
  Kin,
  SpriteRef,
  AIState,
  PathTarget,
  PathBuffer,
  Animation,
  Home,
  Renderable,
  LayerRef,
  KIN,
  STATE,
} from '../components'
import type { EcsWorld } from '../world'
import { createKinSprite } from '../../render/sprites'
import { TILE_SIZE } from '../../render/tiles'

export function spawnDelver(world: EcsWorld, gx: number, gy: number, layer = 0): number {
  const eid = addEntity(world)
  addComponent(world, Kin, eid)
  addComponent(world, Position, eid)
  addComponent(world, PreviousPosition, eid)
  addComponent(world, Velocity, eid)
  addComponent(world, GridPos, eid)
  addComponent(world, LayerRef, eid)
  addComponent(world, KinType, eid)
  addComponent(world, SpriteRef, eid)
  addComponent(world, AIState, eid)
  addComponent(world, PathTarget, eid)
  addComponent(world, PathBuffer, eid)
  addComponent(world, Animation, eid)
  addComponent(world, Home, eid)
  addComponent(world, Renderable, eid)

  Position.x[eid] = gx * TILE_SIZE + TILE_SIZE / 2
  Position.y[eid] = gy * TILE_SIZE + TILE_SIZE / 2
  PreviousPosition.x[eid] = Position.x[eid]
  PreviousPosition.y[eid] = Position.y[eid]
  GridPos.gx[eid] = gx
  GridPos.gy[eid] = gy
  LayerRef.layer[eid] = layer
  KinType.type[eid] = KIN.delver
  Home.gx[eid] = gx
  Home.gy[eid] = gy
  AIState.state[eid] = STATE.idle
  PathTarget.active[eid] = 0
  Animation.speed[eid] = 1

  const tint = world.pixi.themeInts.chartsPurple
  SpriteRef.tint[eid] = tint

  const sprite = createKinSprite(KIN.delver, tint, world.pixi.themeInts)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  return eid
}
