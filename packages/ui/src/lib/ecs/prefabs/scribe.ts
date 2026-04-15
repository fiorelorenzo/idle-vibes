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
  Renderable,
  KIN,
  STATE,
  LayerRef,
  Home,
} from '../components'
import type { EcsWorld } from '../world'
import { createKinSprite } from '../../render/sprites'
import { TILE_SIZE } from '../../render/tiles'

export function spawnScribe(world: EcsWorld, gx: number, gy: number, layer = 0): number {
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
  KinType.type[eid] = KIN.scribe
  Home.gx[eid] = gx
  Home.gy[eid] = gy

  AIState.state[eid] = STATE.idle
  AIState.ticks[eid] = 0
  AIState.nextThinkAt[eid] = 0
  PathTarget.active[eid] = 0
  PathTarget.nodeIdx[eid] = 0
  PathBuffer.length[eid] = 0

  Animation.clipId[eid] = 0
  Animation.frame[eid] = 0
  Animation.elapsed[eid] = 0
  Animation.speed[eid] = 1

  const tint = world.pixi.themeInts.chartsBlue
  SpriteRef.tint[eid] = tint
  SpriteRef.frame[eid] = 0
  SpriteRef.dir[eid] = 0

  const sprite = createKinSprite(KIN.scribe, tint, world.pixi.themeInts)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  return eid
}
