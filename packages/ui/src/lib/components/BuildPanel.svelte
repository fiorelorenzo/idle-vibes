<script lang="ts">
  import { resources } from '../stores/game-state'
  import { BUILDINGS } from '@idle-vibes/shared'
  import { bridge } from '../bridge/webview-bridge'
  import type { ResourceId, BuildingId } from '@idle-vibes/shared'

  let expanded = false

  const buildableIds = Object.keys(BUILDINGS).filter(
    (id) => !BUILDINGS[id].autoSpawn,
  ) as BuildingId[]

  function canAfford(buildingId: BuildingId): boolean {
    const def = BUILDINGS[buildingId]
    for (const [resourceId, cost] of Object.entries(def.cost)) {
      if ($resources[resourceId as ResourceId] < cost) return false
    }
    return true
  }

  function build(buildingId: BuildingId) {
    // Place at a random open position (simplified — a real implementation
    // would let the player pick a spot on the map)
    const x = Math.floor(Math.random() * 10) + 2
    const y = Math.floor(Math.random() * 8) + 2
    bridge.send({
      type: 'ui:colony-action',
      action: { kind: 'place_building', buildingId, position: { x, y } },
    })
  }

  function formatCost(cost: Record<string, number>): string {
    return Object.entries(cost)
      .map(([id, amount]) => `${amount} ${id.replace(/_/g, ' ')}`)
      .join(', ')
  }
</script>

<div class="build-panel">
  <button class="section-toggle" on:click={() => (expanded = !expanded)}>
    {expanded ? '[-]' : '[+]'} BUILD
  </button>

  {#if expanded}
    <div class="build-list">
      {#each buildableIds as id}
        {@const def = BUILDINGS[id]}
        <button
          class="build-item"
          disabled={!canAfford(id)}
          on:click={() => build(id)}
        >
          <span class="build-name">{def.name}</span>
          <span class="build-cost">{formatCost(def.cost)}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .build-panel {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 10px;
    padding: 8px;
    border-bottom: 1px solid #1a1a2e;
  }

  .section-toggle {
    background: none;
    border: none;
    color: #00ff88;
    font-family: inherit;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
  }

  .build-list {
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .build-item {
    background: #0a0a1a;
    border: 1px solid #1a1a2e;
    color: #ccc;
    font-family: inherit;
    font-size: 10px;
    padding: 4px 6px;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
  }

  .build-item:hover:not(:disabled) {
    border-color: #00ff88;
  }

  .build-item:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .build-cost {
    color: #666;
    font-size: 9px;
  }
</style>
