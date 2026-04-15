<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'
  import { BUILDING_DEFS } from '@idle-vibes/shared'
  import type { BuildingKind } from '@idle-vibes/shared'

  // Reactive derived values so affordability updates as tokens change.
  $: tokens = $worldSnapshot?.resources.tokens ?? 0
  $: buildings = $worldSnapshot?.buildings ?? []

  /**
   * Ring of placement tiles around the Core (10,3). The panel auto-
   * picks the next unoccupied slot on each click. v1 has no click-on-
   * tile targeting.
   */
  const FREE_TILES: Array<[number, number]> = [
    [6, 5],  [14, 5],
    [5, 7],  [15, 7],
    [6, 9],  [14, 9],
    [7, 11], [13, 11],
    [5, 11], [15, 11],
  ]

  function nextFreeTile(): [number, number] | null {
    const occupied = new Set(buildings.map((b) => `${b.gx},${b.gy}`))
    for (const [x, y] of FREE_TILES) {
      if (!occupied.has(`${x},${y}`)) return [x, y]
    }
    return null
  }

  function build(kind: BuildingKind): void {
    const def = BUILDING_DEFS.find((b) => b.id === kind)
    if (!def) return
    if (tokens < def.cost) return
    const spot = nextFreeTile()
    if (!spot) return
    bridge.send({
      type: 'ui:world-mutation',
      mutation: {
        kind: 'place_building',
        buildingKind: kind,
        layer: 'surface',
        gx: spot[0],
        gy: spot[1],
      },
    })
  }
</script>

<section class="build-panel">
  <span
    class="label"
    title="Place new buildings to grow the colony. Each button consumes Tokens. Buildings persist for the current run."
  >BUILD</span>
  <div class="grid">
    {#each BUILDING_DEFS as def}
      {@const affordable = tokens >= def.cost}
      {@const owned = buildings.filter((b) => b.kind === def.id).length}
      <button
        type="button"
        class="bld"
        class:disabled={!affordable}
        disabled={!affordable}
        on:click={() => build(def.id)}
        title={`${def.name} — ${def.description} Cost: ${def.cost} tokens. Owned: ${owned}.`}
      >
        <span class="name">{def.name}</span>
        <span class="cost">{def.cost}◆{owned > 0 ? ` · ${owned}` : ''}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .build-panel {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 10px;
    border-top: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-editor-background, #1e1e1e);
    flex: 0 0 auto;
  }
  .label {
    font-size: var(--desc-font-xs, 11px);
    color: var(--vscode-descriptionForeground, #888);
    letter-spacing: 1px;
    font-weight: bold;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }
  .bld {
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-editor-foreground, #d4d4d4);
    font-family: inherit;
    font-size: var(--desc-font-sm, 12px);
    padding: 5px 8px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .bld:hover:not(.disabled) {
    border-color: var(--vscode-charts-green, #89d185);
  }
  .bld.disabled { opacity: 0.4; cursor: not-allowed; }
  .name { color: var(--vscode-charts-green, #89d185); font-weight: bold; }
  .cost { color: var(--vscode-charts-blue, #4daafc); font-size: var(--desc-font-xs, 11px); }
</style>
