<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { ColonyRenderer } from '../engine/colony'
  import { gameState } from '../stores/game-state'
  import { bridge } from '../bridge/webview-bridge'
  import { pushEvent } from '../stores/events'
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
    const scaleX = canvasEl.width / rect.width
    const scaleY = canvasEl.height / rect.height
    const pixelX = (event.clientX - rect.left) * scaleX
    const pixelY = (event.clientY - rect.top) * scaleY
    const x = Math.floor(pixelX / 16)
    const y = Math.floor(pixelY / 16)

    // Click feedback particles
    renderer?.getEffectTriggers()?.onCanvasClick(pixelX, pixelY)

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
      pushEvent(`${glitch.type.replace(/_/g, ' ')} resolved!`, 'success')
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
    transition: transform 0.05s ease;
  }

  canvas:active {
    transform: scale(0.995);
  }
</style>
