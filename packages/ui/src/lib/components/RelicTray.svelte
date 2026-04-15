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
    <span class="label" title="Equipped relics — permanent passives active this run. Drop from bosses and rare expedition events.">RELICS</span>
    {#each Array(slots) as _, i}
      {@const id = equipped[i]}
      {@const def = id ? relicDef(id) : undefined}
      <div
        class="slot"
        title={def ? `${def.name} (${def.rarity}) — ${def.description}` : 'empty slot — click an owned relic below to equip it here'}
      >
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
            title={`${def.name} (${def.rarity}) — ${def.description}${equipped.includes(id) ? ' · click to unequip' : ' · click to equip'}`}
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
    gap: 4px;
    padding: 6px 10px;
    border-top: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-editor-background, #1e1e1e);
    font-size: var(--desc-font-sm, 12px);
    flex: 0 0 auto;
  }
  .slots { display: flex; gap: 6px; align-items: center; }
  .label {
    color: var(--vscode-descriptionForeground, #888);
    letter-spacing: 1px;
    font-weight: bold;
    flex: 0 0 52px;
    font-size: var(--desc-font-xs, 11px);
  }
  .slot {
    flex: 1;
    border: 1px solid var(--vscode-panel-border, #333);
    padding: 4px 6px;
    display: flex;
    gap: 4px;
    align-items: center;
    min-height: 22px;
  }
  .empty { color: var(--vscode-descriptionForeground, #666); }
  .name {
    color: var(--vscode-charts-orange, #ff8c00);
    font-size: var(--desc-font-xs, 11px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rarity { font-size: var(--desc-font-sm, 12px); }
  .rarity-common { color: var(--vscode-editor-foreground, #d4d4d4); }
  .rarity-rare { color: var(--vscode-charts-blue, #4daafc); }
  .rarity-legendary { color: var(--vscode-charts-purple, #b180d7); }
  .inventory { display: flex; flex-wrap: wrap; gap: 4px; }
  .inv-item {
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-descriptionForeground, #888);
    font-family: inherit;
    font-size: var(--desc-font-xs, 11px);
    padding: 3px 8px;
    cursor: pointer;
  }
  .inv-item.active {
    border-color: var(--vscode-charts-orange, #ff8c00);
    color: var(--vscode-charts-orange, #ff8c00);
  }
</style>
