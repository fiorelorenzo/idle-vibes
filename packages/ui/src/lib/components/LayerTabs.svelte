<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { jumpToLayer } from '../stores/camera-store'
  import { LAYER_DEFS } from '@idle-vibes/shared'
</script>

<aside class="layer-tabs">
  {#each LAYER_DEFS as def}
    {@const state = $worldSnapshot?.layers.find((l) => l.id === def.id)}
    <button
      class="tab"
      class:unlocked={state?.unlocked}
      class:locked={!state?.unlocked}
      on:click={() => jumpToLayer(def.id)}
      title={state?.unlocked
        ? `${def.displayName} — jump camera to this layer. Boss: ${def.bossId.replace(/_/g, ' ')}.`
        : `${def.displayName} — locked. Unlock cost: ${def.unlockCostShards} shards (◈).`}
    >
      <span class="letter">{def.displayName[0]}</span>
      {#if state && !state.unlocked}
        <span class="cost">{def.unlockCostShards}◈</span>
      {/if}
    </button>
  {/each}
</aside>

<style>
  .layer-tabs {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px 5px;
    border-left: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-editor-background, #1e1e1e);
  }
  .tab {
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-descriptionForeground, #888);
    font-family: inherit;
    font-size: var(--desc-font-xs, 11px);
    padding: 6px 7px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    min-width: 32px;
  }
  .tab.unlocked {
    color: var(--vscode-charts-blue, #4daafc);
    border-color: var(--vscode-focusBorder, #007fd4);
  }
  .tab.locked {
    opacity: 0.5;
  }
  .tab:hover:not(.locked) {
    background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.05));
  }
  .letter { font-weight: bold; font-size: var(--desc-font-md, 13px); }
  .cost { font-size: 9px; color: var(--vscode-charts-purple, #b180d7); }
</style>
