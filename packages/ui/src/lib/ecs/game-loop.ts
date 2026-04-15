import type { PixiApp } from '../render/pixi-app'
import { SpriteRegistry } from '../render/sprites'
import { TileGrid } from './pathfinding/grid'
import { createEcsWorld, type EcsWorld } from './world'
import { runSimulationTick, runRenderStep } from './systems'
import { bridge } from '../bridge/webview-bridge'
import type { GameEvent } from '@idle-vibes/shared'
import { GRID_WIDTH } from '@idle-vibes/shared'

export interface GameRuntime {
  world: EcsWorld
  stop(): void
}

const SIM_STEP_MS = 50 // 20 Hz

/**
 * Boots the ECS + render loop. The simulation runs on a fixed-step timer at
 * 20Hz; rendering runs on rAF and interpolates between simulation snapshots.
 */
export function startGameLoop(pixi: PixiApp, gridHeight = 80): GameRuntime {
  const grid = new TileGrid(GRID_WIDTH, gridHeight)
  const sprites = new SpriteRegistry()
  const world = createEcsWorld(pixi, grid, sprites)

  // Route host events into the ECS queue.
  const unsubscribe = bridge.onMessage((msg) => {
    if (msg.type === 'ext:game-event') {
      world.pendingEvents.push(msg.event as GameEvent)
    }
  })

  let simAccumulator = 0
  let lastFrameTime = performance.now()
  let stopped = false

  const frame = (now: number): void => {
    if (stopped) return
    const frameDelta = Math.min(0.1, (now - lastFrameTime) / 1000)
    lastFrameTime = now
    simAccumulator += frameDelta

    while (simAccumulator >= SIM_STEP_MS / 1000) {
      runSimulationTick(world, SIM_STEP_MS / 1000)
      simAccumulator -= SIM_STEP_MS / 1000
    }

    const alpha = simAccumulator / (SIM_STEP_MS / 1000)
    runRenderStep(world, alpha)
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)

  return {
    world,
    stop(): void {
      stopped = true
      unsubscribe()
      sprites.clear()
    },
  }
}
