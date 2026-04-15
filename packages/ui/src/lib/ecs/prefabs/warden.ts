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
  Home,
  KIN,
  STATE,
  LayerRef,
  Health,
  Attack,
  Aggro,
} from '../components'
import type { EcsWorld } from '../world'
import { createKinSprite } from '../../render/sprites'
import { TILE_SIZE } from '../../render/tiles'

export function spawnWarden(world: EcsWorld, gx: number, gy: number, layer = 0): number {
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
  addComponent(world, Health, eid)
  addComponent(world, Attack, eid)
  addComponent(world, Aggro, eid)

  Position.x[eid] = gx * TILE_SIZE + TILE_SIZE / 2
  Position.y[eid] = gy * TILE_SIZE + TILE_SIZE / 2
  PreviousPosition.x[eid] = Position.x[eid]
  PreviousPosition.y[eid] = Position.y[eid]
  GridPos.gx[eid] = gx
  GridPos.gy[eid] = gy
  LayerRef.layer[eid] = layer
  KinType.type[eid] = KIN.warden
  Home.gx[eid] = gx
  Home.gy[eid] = gy

  AIState.state[eid] = STATE.idle
  AIState.nextThinkAt[eid] = 0
  PathTarget.active[eid] = 0
  PathBuffer.length[eid] = 0

  Animation.speed[eid] = 1
  Health.hp[eid] = 25
  Health.max[eid] = 25
  Attack.dmg[eid] = 5
  Attack.range[eid] = 20 // pixels
  Attack.cooldown[eid] = 0.8
  Attack.timer[eid] = 0
  Aggro.target[eid] = 0

  const tint = world.pixi.themeInts.chartsOrange
  SpriteRef.tint[eid] = tint
  SpriteRef.frame[eid] = 0
  SpriteRef.dir[eid] = 0

  const sprite = createKinSprite(KIN.warden, tint, world.pixi.themeInts)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  return eid
}
