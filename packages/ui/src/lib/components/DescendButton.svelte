<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'
  import { LAYER_DEFS, LAYER_INDEX } from '@idle-vibes/shared'

  $: currentLayer = $worldSnapshot?.run.deepestLayer ?? 'surface'
  $: currentIdx = LAYER_INDEX[currentLayer]
  $: nextIdx = Math.min(currentIdx + 1, LAYER_DEFS.length - 1)
  $: nextLayer = LAYER_DEFS[nextIdx]
  $: cost = nextIdx * 10 + 10
  $: canAfford = ($worldSnapshot?.resources.shards ?? 0) >= cost
  $: visible = $worldSnapshot !== null

  function descend(): void {
    bridge.send({
      type: 'ui:world-mutation',
      mutation: { kind: 'request_boss_spawn', layer: nextLayer.id },
    })
  }
</script>

{#if visible}
  <button class="descend" class:disabled={!canAfford} on:click={descend} disabled={!canAfford}>
    DESCEND → {nextLayer.displayName} · {cost}◈
  </button>
{/if}

<style>
  .descend {
    margin: 2px 6px;
    padding: 4px;
    background: transparent;
    border: 1px solid var(--vscode-errorForeground, #f48771);
    color: var(--vscode-errorForeground, #f48771);
    font-family: inherit;
    font-size: 9px;
    letter-spacing: 2px;
    cursor: pointer;
  }
  .descend:hover:not(.disabled) {
    background: var(--vscode-errorForeground, #f48771);
    color: var(--vscode-editor-background, #1e1e1e);
  }
  .descend.disabled { opacity: 0.35; cursor: not-allowed; }
</style>
