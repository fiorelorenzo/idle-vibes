import type { EcsWorld } from '../world'
import { pathfindingSystem } from './pathfinding'
import { constructionSystem } from './construction'
import { expeditionVisualSystem } from './expedition-visuals'
import { movementSystem } from './movement'
import { animationSystem } from './animation'
import { lifetimeSystem } from './lifetime'
import { particleSystem } from './particle'
import { floatingTextSystem } from './floating-text'
import { carrySystem } from './carry'
import { combatSystem } from './combat'
import { aiBehaviorSystem } from './ai-behavior'
import { eventIngestSystem } from './event-ingest'
import { moteFallSystem } from './mote-fall'
import { mutationFlushSystem } from './mutation-flush'
import { pixiRenderSystem } from './pixi-render'
import { ambientSystem } from './ambient'
import { dayNightSystem } from './day-night'

/**
 * Fixed simulation-tick systems. Runs at ~20Hz.
 */
export function runSimulationTick(world: EcsWorld, dt: number): void {
  world.delta = dt
  world.time += dt
  world.tick++

  eventIngestSystem(world)
  aiBehaviorSystem(world)
  carrySystem(world)
  constructionSystem(world)
  expeditionVisualSystem(world)
  pathfindingSystem(world)
  movementSystem(world)
  moteFallSystem(world)
  combatSystem(world)
  animationSystem(world)
  ambientSystem(world)
  dayNightSystem(world)
  particleSystem(world)
  floatingTextSystem(world)
  lifetimeSystem(world)
  mutationFlushSystem(world)
}

/**
 * Render-only step. Runs on rAF at the browser's native rate.
 * `alpha` in [0,1] interpolates between PreviousPosition and Position.
 */
export function runRenderStep(world: EcsWorld, alpha: number): void {
  pixiRenderSystem(world, alpha)
}
