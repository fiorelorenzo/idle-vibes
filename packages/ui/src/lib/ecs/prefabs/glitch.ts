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
} from '../components'
import type { EcsWorld } from '../world'
import { createGlitchSprite } from '../../render/sprites'
import { TILE_SIZE } from '../../render/tiles'

const GLITCH_KIND_ID: Record<string, number> = {
  bug_sprite: 0,
  null_wraith: 1,
  runner: 2,
  bomber: 3,
  leech: 4,
  tank: 5,
}

export function spawnGlitch(world: EcsWorld, gx: number, gy: number, kind: string, layer = 0): number {
  const eid = addEntity(world)
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
  LayerRef.layer[eid] = layer
  GlitchKind.type[eid] = GLITCH_KIND_ID[kind] ?? 0

  const hp = kind === 'tank' ? 30 : kind === 'runner' ? 8 : 15
  Health.hp[eid] = hp
  Health.max[eid] = hp

  AIState.state[eid] = STATE.walking
  PathTarget.active[eid] = 0
  SpriteRef.tint[eid] = world.pixi.themeInts.errorForeground

  const sprite = createGlitchSprite(world.pixi.themeInts)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  return eid
}
