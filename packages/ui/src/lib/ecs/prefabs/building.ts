import { addComponent, addEntity } from 'bitecs'
import type { BuildingKind } from '@idle-vibes/shared'
import {
  Position,
  PreviousPosition,
  GridPos,
  SpriteRef,
  Renderable,
  BuildingTag,
  BuildingType,
  BlueprintTag,
  BuildingProgress,
  LayerRef,
  BUILDING,
} from '../components'
import type { EcsWorld } from '../world'
import { createBuildingSprite } from '../../render/building-sprite'
import { createBlueprintSprite } from '../../render/blueprint-sprite'
import { TILE_SIZE } from '../../render/tiles'

const KIND_ID: Record<BuildingKind, number> = {
  loom: BUILDING.loom,
  barracks: BUILDING.barracks,
  well: BUILDING.well,
  gate: BUILDING.gate,
}

/**
 * Keep track of building entity per host-side building id so we can
 * upgrade a blueprint to active in place when the host signals completion.
 */
const buildingEntityByServerId = new Map<string, number>()

export function spawnActiveBuilding(
  world: EcsWorld,
  kind: BuildingKind,
  gx: number,
  gy: number,
  serverId: string,
  layer = 0,
): number {
  const eid = addEntity(world)
  addComponent(world, BuildingTag, eid)
  addComponent(world, BuildingType, eid)
  addComponent(world, Position, eid)
  addComponent(world, PreviousPosition, eid)
  addComponent(world, GridPos, eid)
  addComponent(world, LayerRef, eid)
  addComponent(world, SpriteRef, eid)
  addComponent(world, Renderable, eid)

  Position.x[eid] = gx * TILE_SIZE + TILE_SIZE / 2
  Position.y[eid] = gy * TILE_SIZE + TILE_SIZE / 2
  PreviousPosition.x[eid] = Position.x[eid]
  PreviousPosition.y[eid] = Position.y[eid]
  GridPos.gx[eid] = gx
  GridPos.gy[eid] = gy
  LayerRef.layer[eid] = layer
  BuildingType.type[eid] = KIND_ID[kind]

  const sprite = createBuildingSprite(kind, world.pixi.themeInts)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  buildingEntityByServerId.set(serverId, eid)
  return eid
}

export function spawnBlueprint(
  world: EcsWorld,
  kind: BuildingKind,
  gx: number,
  gy: number,
  serverId: string,
  layer = 0,
): number {
  const eid = addEntity(world)
  addComponent(world, BuildingTag, eid)
  addComponent(world, BuildingType, eid)
  addComponent(world, BlueprintTag, eid)
  addComponent(world, BuildingProgress, eid)
  addComponent(world, Position, eid)
  addComponent(world, PreviousPosition, eid)
  addComponent(world, GridPos, eid)
  addComponent(world, LayerRef, eid)
  addComponent(world, SpriteRef, eid)
  addComponent(world, Renderable, eid)

  Position.x[eid] = gx * TILE_SIZE + TILE_SIZE / 2
  Position.y[eid] = gy * TILE_SIZE + TILE_SIZE / 2
  PreviousPosition.x[eid] = Position.x[eid]
  PreviousPosition.y[eid] = Position.y[eid]
  GridPos.gx[eid] = gx
  GridPos.gy[eid] = gy
  LayerRef.layer[eid] = layer
  BuildingType.type[eid] = KIND_ID[kind]
  BuildingProgress.progress[eid] = 0
  BuildingProgress.workers[eid] = 0

  const sprite = createBlueprintSprite(kind, world.pixi.themeInts)
  sprite.x = Position.x[eid]
  sprite.y = Position.y[eid]
  world.pixi.layers.entities.addChild(sprite)
  world.sprites.register(eid, sprite)

  buildingEntityByServerId.set(serverId, eid)
  return eid
}

export function findBuildingEntity(serverId: string): number | undefined {
  return buildingEntityByServerId.get(serverId)
}

export function forgetBuildingEntity(serverId: string): void {
  buildingEntityByServerId.delete(serverId)
}

/** Back-compat alias — callers that still want an "active" spawn from a snapshot replay. */
export function spawnBuilding(
  world: EcsWorld,
  kind: BuildingKind,
  gx: number,
  gy: number,
  serverId: string,
  layer = 0,
): number {
  return spawnActiveBuilding(world, kind, gx, gy, serverId, layer)
}
