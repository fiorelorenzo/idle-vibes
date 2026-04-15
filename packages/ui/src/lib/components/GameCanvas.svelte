<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { createPixiApp, VIRTUAL_WIDTH, type PixiApp } from '../render/pixi-app'
  import { createStaticTilemap } from '../render/tiles'

  let container: HTMLDivElement
  let canvas: HTMLCanvasElement
  let pixi: PixiApp | null = null
  let resizeObserver: ResizeObserver | null = null

  function handleResize(): void {
    if (!pixi || !container) return
    const rect = container.getBoundingClientRect()
    const scale = Math.max(1, Math.floor(rect.width / VIRTUAL_WIDTH))
    const width = VIRTUAL_WIDTH * scale
    const height = Math.max(240, Math.floor(rect.height * scale))
    pixi.resize(width, height)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
  }

  onMount(async () => {
    pixi = await createPixiApp(canvas)
    createStaticTilemap(pixi.layers.map, 40)
    handleResize()
    resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(container)
  })

  onDestroy(() => {
    resizeObserver?.disconnect()
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
  }
  canvas {
    display: block;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    position: absolute;
    inset: 0;
  }
</style>
