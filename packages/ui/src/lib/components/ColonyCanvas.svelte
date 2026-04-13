<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { ColonyRenderer } from '../engine/colony'
  import { gameState } from '../stores/game-state'
  import { bridge } from '../bridge/webview-bridge'
  import type { ColonyAction } from '@idle-vibes/shared'

  let canvasEl: HTMLCanvasElement
  let renderer: ColonyRenderer | null = null

  onMount(async () => {
    renderer = new ColonyRenderer()
    await renderer.init(canvasEl, canvasEl.clientWidth, canvasEl.clientHeight)

    const unsubscribe = gameState.subscribe((state) => {
      renderer?.updateState(state)
      renderer?.setFPS(state.settings.fpsLimit)
    })

    return () => {
      unsubscribe()
    }
  })

  onDestroy(() => {
    renderer?.destroy()
    renderer = null
  })

  function handleClick(event: MouseEvent) {
    const rect = canvasEl.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / 16)
    const y = Math.floor((event.clientY - rect.top) / 16)

    // Check if clicking on a glitch
    let state: import('@idle-vibes/shared').GameState | undefined
    gameState.subscribe((s) => (state = s))()

    if (!state) return

    const glitch = state.colony.glitches.find(
      (g) => g.position.x === x && g.position.y === y,
    )

    if (glitch) {
      const action: ColonyAction = { kind: 'click_glitch', glitchId: glitch.id }
      bridge.send({ type: 'ui:colony-action', action })
    }
  }
</script>

<div class="colony-canvas-container">
  <canvas
    bind:this={canvasEl}
    on:click={handleClick}
    width="384"
    height="320"
  ></canvas>
</div>

<style>
  .colony-canvas-container {
    width: 100%;
    overflow: hidden;
    image-rendering: pixelated;
  }

  canvas {
    width: 100%;
    height: auto;
    display: block;
    cursor: pointer;
  }
</style>
