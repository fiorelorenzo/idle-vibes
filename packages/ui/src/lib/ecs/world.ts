import { createWorld, removeEntity, type IWorld } from 'bitecs'
import type { Container } from 'pixi.js'
import type { GameEvent } from '@idle-vibes/shared'
import type { LogEntry } from '@idle-vibes/shared'
import type { PixiApp } from '../render/pixi-app'
import type { TileGrid } from './pathfinding/grid'
import type { SpriteRegistry } from '../render/sprites'

/**
 * The ECS world, plus references to the PixiJS renderer and queued
 * host events waiting to be processed by EventIngestSystem.
 */
export interface EcsWorld extends IWorld {
  delta: number
  time: number
  pendingEvents: GameEvent[]
  pendingMutations: WorldMutationOut[]
  pendingLogs: LogEntry[]
  /** Pixi containers we splat sprites into */
  pixi: PixiApp
  /** Sprite registry (display objects keyed by entity id) */
  sprites: SpriteRegistry
  /** Current tile grid (Phase 2: one fixed grid; Phase 5: per-layer) */
  grid: TileGrid
  /** Random seed — advanced via the seedable RNG */
  rngState: number
  /** Monotonic tick counter (simulation) */
  tick: number
}

export type WorldMutationOut = import('@idle-vibes/shared').WorldMutation

export function createEcsWorld(pixi: PixiApp, grid: TileGrid, sprites: SpriteRegistry): EcsWorld {
  const world = createWorld() as EcsWorld
  world.delta = 0
  world.time = 0
  world.pendingEvents = []
  world.pendingMutations = []
  world.pendingLogs = []
  world.pixi = pixi
  world.sprites = sprites
  world.grid = grid
  world.rngState = 0xdeadbeef
  world.tick = 0
  return world
}

export function killEntity(world: EcsWorld, eid: number): void {
  const sprite = world.sprites.get(eid)
  if (sprite) {
    const parent = sprite.parent as Container | null
    parent?.removeChild(sprite)
    sprite.destroy({ children: true })
    world.sprites.release(eid)
  }
  removeEntity(world, eid)
}
