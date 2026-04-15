<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'
  import { ECHO_NODE_DEFS } from '@idle-vibes/shared'

  export let open = false

  function costFor(nodeId: string): number {
    const def = ECHO_NODE_DEFS.find((n) => n.id === nodeId)
    if (!def) return 0
    const rank = $worldSnapshot?.meta.echoNodes[nodeId] ?? 0
    return def.baseCost * (rank + 1)
  }

  function canBuy(nodeId: string): boolean {
    const def = ECHO_NODE_DEFS.find((n) => n.id === nodeId)
    if (!def) return false
    const rank = $worldSnapshot?.meta.echoNodes[nodeId] ?? 0
    if (rank >= def.maxRank) return false
    return (($worldSnapshot?.meta.echoes ?? 0) >= costFor(nodeId))
  }

  function buy(nodeId: string): void {
    bridge.send({
      type: 'ui:world-mutation',
      mutation: { kind: 'buy_echo_node', nodeId, cost: costFor(nodeId) },
    })
  }

  $: foundations = ECHO_NODE_DEFS.filter((n) => n.category === 'foundations')
  $: unlocks = ECHO_NODE_DEFS.filter((n) => n.category === 'unlocks')
  $: mutations = ECHO_NODE_DEFS.filter((n) => n.category === 'mutations')

  function onKeydown(e: KeyboardEvent): void {
    if (open && e.key === 'Escape') open = false
  }

  function onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) open = false
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Echo Tree"
    tabindex="-1"
    on:click={onBackdropClick}
  >
    <div class="panel">
      <header>
        <span>ECHO TREE · {$worldSnapshot?.meta.echoes ?? 0} echoes</span>
        <button class="close" on:click={() => (open = false)}>×</button>
      </header>

      {#each [['FOUNDATIONS', foundations], ['UNLOCKS', unlocks], ['MUTATIONS', mutations]] as [label, list]}
        <h3>{label}</h3>
        <div class="branch">
          {#each list as node}
            {@const rank = $worldSnapshot?.meta.echoNodes[node.id] ?? 0}
            {@const maxed = rank >= node.maxRank}
            <button
              class="node"
              class:maxed
              class:disabled={!canBuy(node.id) && !maxed}
              on:click={() => buy(node.id)}
              disabled={maxed || !canBuy(node.id)}
            >
              <span class="name">{node.name}</span>
              <span class="rank">{rank}/{node.maxRank}</span>
              <span class="desc">{node.description}</span>
              <span class="cost">{maxed ? 'MAX' : `${costFor(node.id)} echo`}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    z-index: 100;
  }
  .panel {
    flex: 1;
    margin: 20px;
    border: 1px solid var(--vscode-focusBorder, #007fd4);
    background: var(--vscode-editor-background, #1e1e1e);
    padding: 10px;
    overflow-y: auto;
    font-size: 10px;
  }
  header {
    display: flex;
    justify-content: space-between;
    color: var(--vscode-charts-purple, #b180d7);
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .close {
    background: transparent;
    border: none;
    color: var(--vscode-descriptionForeground, #888);
    font-size: 16px;
    cursor: pointer;
  }
  h3 {
    font-size: 9px;
    margin: 8px 0 4px 0;
    color: var(--vscode-charts-blue, #4daafc);
    letter-spacing: 1px;
  }
  .branch {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .node {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 2px 6px;
    padding: 4px 6px;
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-editor-foreground, #d4d4d4);
    font-family: inherit;
    font-size: 9px;
    text-align: left;
    cursor: pointer;
  }
  .node .name { color: var(--vscode-charts-orange, #ff8c00); }
  .node .rank { justify-self: end; color: var(--vscode-descriptionForeground, #888); }
  .node .desc { grid-column: 1 / -1; color: var(--vscode-descriptionForeground, #888); font-size: 8px; }
  .node .cost { grid-column: 1 / -1; justify-self: end; color: var(--vscode-charts-purple, #b180d7); }
  .node:hover:not(.disabled):not(.maxed) {
    border-color: var(--vscode-charts-orange, #ff8c00);
  }
  .node.maxed { opacity: 0.6; }
  .node.disabled { opacity: 0.4; cursor: not-allowed; }
</style>
