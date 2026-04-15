<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { WorldSnapshot } from '@idle-vibes/shared'
  import { createPixiApp, VIRTUAL_WIDTH, type PixiApp } from '../render/pixi-app'
  import { createLayeredMap, type LayeredMap } from '../render/layered-map'
  import { Camera } from '../render/camera'
  import { TILE_SIZE } from '../render/tiles'
  import { startGameLoop, type GameRuntime } from '../ecs/game-loop'
  import { spawnScribe } from '../ecs/prefabs/scribe'
  import { spawnWarden } from '../ecs/prefabs/warden'
  import { spawnDelver } from '../ecs/prefabs/delver'
  import { worldSnapshot } from '../stores/world-store'
  import { cameraTarget } from '../stores/camera-store'
  import { theme } from '../theme/theme-store'

  let container: HTMLDivElement
  let canvas: HTMLCanvasElement
  let pixi: PixiApp | null = null
  let runtime: GameRuntime | null = null
  let camera: Camera | null = null
  let map: LayeredMap | null = null
  let cameraDetach: (() => void) | null = null
  let resizeObserver: ResizeObserver | null = null
  let initialized = false
  let unsubSnapshot: (() => void) | null = null
  let unsubTheme: (() => void) | null = null
  let unsubCamera: (() => void) | null = null

  function handleResize(): void {
    if (!pixi || !container) return
    const rect = container.getBoundingClientRect()
    const scale = Math.max(1, Math.floor(rect.width / VIRTUAL_WIDTH))
    const width = VIRTUAL_WIDTH * scale
    const height = Math.max(240, Math.floor(rect.height * scale))
    pixi.resize(width, height)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    if (camera && map) {
      const viewportWorld = rect.height / scale
      camera.setBounds(Math.max(0, map.totalHeight - viewportWorld))
    }
  }

  function initializeWithSnapshot(snapshot: WorldSnapshot): void {
    if (!pixi || !runtime || initialized) return
    initialized = true
    map = createLayeredMap(pixi.layers.map, snapshot)
    map.refresh(pixi.themeInts)

    // Seed a small starting colony on the Surface layer.
    spawnScribe(runtime.world, 8, 4)
    spawnScribe(runtime.world, 10, 4)
    spawnScribe(runtime.world, 12, 4)
    spawnWarden(runtime.world, 9, 6)
    spawnWarden(runtime.world, 11, 6)
    spawnDelver(runtime.world, 10, 5)

    // Configure camera bounds from the rendered map height.
    camera?.setBounds(Math.max(0, map.totalHeight - 240))
  }

  onMount(async () => {
    pixi = await createPixiApp(canvas)
    runtime = startGameLoop(pixi)
    camera = new Camera(pixi)
    cameraDetach = camera.attach(canvas)

    handleResize()
    resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(container)

    unsubSnapshot = worldSnapshot.subscribe((snap) => {
      if (snap) initializeWithSnapshot(snap)
    })
    unsubTheme = theme.subscribe(() => {
      if (pixi && map) map.refresh(pixi.themeInts)
    })
    unsubCamera = cameraTarget.subscribe((target) => {
      if (!target || !camera || !map) return
      // Find the y position of the target layer
      const snap = runtime?.world ? currentSnapshot() : null
      if (!snap) return
      let y = 0
      for (const l of snap.layers) {
        if (l.id === target) break
        y += l.rows * TILE_SIZE
      }
      camera.setY(y)
      cameraTarget.set(null)
    })
  })

  function currentSnapshot(): WorldSnapshot | null {
    let s: WorldSnapshot | null = null
    worldSnapshot.subscribe((v) => (s = v))()
    return s
  }

  onDestroy(() => {
    unsubSnapshot?.()
    unsubTheme?.()
    unsubCamera?.()
    cameraDetach?.()
    resizeObserver?.disconnect()
    runtime?.stop()
    runtime = null
    pixi?.destroy()
    pixi = null
  })
</script>

<div class="game-canvas" bind:this={container}>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .game-canvas {
    flex: 1 1 auto;
    min-height: 0;
    position: relative;
    width: 100%;
    overflow: hidden;
    touch-action: none;
  }
  canvas {
    display: block;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    position: absolute;
    inset: 0;
  }
</style>
