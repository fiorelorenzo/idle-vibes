<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'
  import { RELIC_DEFS, MAX_EQUIPPED_RELICS_BASE } from '@idle-vibes/shared'

  $: owned = $worldSnapshot?.meta.ownedRelics ?? []
  $: equipped = $worldSnapshot?.meta.equippedRelics ?? []
  $: slots = MAX_EQUIPPED_RELICS_BASE

  function toggleEquip(relicId: string): void {
    const already = equipped.includes(relicId)
    if (already) {
      const slot = equipped.indexOf(relicId)
      bridge.send({
        type: 'ui:world-mutation',
        mutation: { kind: 'equip_relic', relicId: '', slot },
      })
    } else {
      const slot = equipped.length < slots ? equipped.length : 0
      bridge.send({
        type: 'ui:world-mutation',
        mutation: { kind: 'equip_relic', relicId, slot },
      })
    }
  }

  function relicDef(id: string) {
    return RELIC_DEFS.find((r) => r.id === id)
  }
</script>

<section class="relic-tray">
  <div class="slots">
    <span class="label">RELICS</span>
    {#each Array(slots) as _, i}
      {@const id = equipped[i]}
      {@const def = id ? relicDef(id) : undefined}
      <div class="slot" title={def?.description ?? 'empty slot'}>
        {#if def}
          <span class="rarity rarity-{def.rarity}">◈</span>
          <span class="name">{def.name}</span>
        {:else}
          <span class="empty">—</span>
        {/if}
      </div>
    {/each}
  </div>
  {#if owned.length > 0}
    <div class="inventory">
      {#each owned as id}
        {@const def = relicDef(id)}
        {#if def}
          <button
            class="inv-item"
            class:active={equipped.includes(id)}
            on:click={() => toggleEquip(id)}
            title={def.description}
          >
            {def.name}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</section>

<style>
  .relic-tray {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 6px;
    border-top: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-editor-background, #1e1e1e);
    font-size: 9px;
    flex: 0 0 auto;
  }
  .slots { display: flex; gap: 4px; align-items: center; }
  .label {
    color: var(--vscode-descriptionForeground, #888);
    letter-spacing: 1px;
    flex: 0 0 42px;
  }
  .slot {
    flex: 1;
    border: 1px solid var(--vscode-panel-border, #333);
    padding: 2px 4px;
    display: flex;
    gap: 3px;
    align-items: center;
    min-height: 16px;
  }
  .empty { color: var(--vscode-descriptionForeground, #666); }
  .name { color: var(--vscode-charts-orange, #ff8c00); font-size: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rarity { font-size: 8px; }
  .rarity-common { color: var(--vscode-editor-foreground, #d4d4d4); }
  .rarity-rare { color: var(--vscode-charts-blue, #4daafc); }
  .rarity-legendary { color: var(--vscode-charts-purple, #b180d7); }
  .inventory { display: flex; flex-wrap: wrap; gap: 2px; }
  .inv-item {
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-descriptionForeground, #888);
    font-family: inherit;
    font-size: 8px;
    padding: 1px 4px;
    cursor: pointer;
  }
  .inv-item.active {
    border-color: var(--vscode-charts-orange, #ff8c00);
    color: var(--vscode-charts-orange, #ff8c00);
  }
</style>
