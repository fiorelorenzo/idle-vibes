import { addComponent, addEntity } from 'bitecs'
import {
  Position,
  PreviousPosition,
  Velocity,
  GridPos,
  SpriteRef,
  GlitchTag,
  GlitchKind,
  Health,
  AIState,
  PathTarget,
  PathBuffer,
  Renderable,
  STATE,
  LayerRef,
  BossTag,
} from '../components'
import type { EcsWorld } from '../world'
import { createBossSprite } from '../../render/boss-sprite'
import { TILE_SIZE } from '../../render/tiles'

/**
 * Boss entity — a super-glitch with high HP and a dedicated sprite.
 * Shares the same path-toward-Core loop as regular glitches, so the
 * combat system can engage it without special casing.
 */
export function spawnBoss(world: EcsWorld, gx: number, gy: number, hp = 200): number {
  const eid = addEntity(world)
  addComponent(world, BossTag, eid)
  addComponent(world, GlitchTag, eid)
  addComponent(world, Position, eid)
  addComponent(world, PreviousPosition, eid)
  addComponent(world, Velocity, eid)
  addComponent(world, GridPos, eid)
  addComponent(world, LayerRef, eid)
  addComponent(world, SpriteRef, eid)
  addComponent(world, GlitchKind, eid)
  addComponent(world, Health, eid)
  addComponent(world, AIState, eid)
  addComponent(world, PathTarget, eid)
  addComponent(world, PathBuffer, eid)
  addComponent(world, Renderable, eid)

  Position.x[eid] = gx * TILE_SIZE + TILE_SIZE / 2
  Position.y[eid] = gy * TILE_SIZE + TILE_SIZE / 2
  PreviousPosition.x[eid] = Position.x[eid]
  PreviousPosition.y[eid] = Position.y[eid]
  GridPos.gx[eid] = gx
  GridPos.gy[eid] = gy
  GlitchKind.type[eid] = 99 // dedicated boss id
  Health.hp[eid] = hp
  Health.max[eid] = hp
  AIState.state[eid] = STATE.walking
  PathTarget.active[eid] = 0
  SpriteRef.tint[eid] = world.pixi.themeInts.errorForeground

  const sprite = createBossSprite(world.pixi.themeInts)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  return eid
}
