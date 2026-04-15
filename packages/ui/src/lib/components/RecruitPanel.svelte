<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'

  // Mirrors recruitCost() on the host. Keeping this in sync via a tiny
  // helper is fine for a v1; deviations just render a stale cost label.
  function recruitCost(kind: 'scribe' | 'warden' | 'delver', size: number): number {
    const base = kind === 'scribe' ? 8 : kind === 'warden' ? 20 : 35
    return Math.floor(base * Math.pow(1.12, size))
  }

  type RecruitDef = {
    id: 'scribe' | 'warden' | 'delver'
    name: string
    glyph: string
    tooltip: string
  }

  const DEFS: readonly RecruitDef[] = [
    {
      id: 'scribe',
      name: 'Scribe',
      glyph: '◆',
      tooltip: 'Scribe — collects motes and delivers them to the Core. Also helps build blueprints.',
    },
    {
      id: 'warden',
      name: 'Warden',
      glyph: '⚔',
      tooltip: 'Warden — patrols and engages glitches that reach the Core.',
    },
    {
      id: 'delver',
      name: 'Delver',
      glyph: '↓',
      tooltip: 'Delver — descends into deeper layers on Expeditions. Required to launch one.',
    },
  ]

  // We scale recruit cost by the total buildings + expeditions launched
  // this run as a proxy for colony size. Keeps it simple without forcing
  // a Kin count into the snapshot just for this.
  $: colonySize = ($worldSnapshot?.buildings.length ?? 0) +
    ($worldSnapshot?.expeditions.length ?? 0) +
    ($worldSnapshot?.run.prestigeCount ?? 0) * 2
  $: tokens = $worldSnapshot?.resources.tokens ?? 0

  function recruit(id: RecruitDef['id']): void {
    const cost = recruitCost(id, colonySize)
    if (tokens < cost) return
    bridge.send({
      type: 'ui:world-mutation',
      mutation: { kind: 'recruit_kin', kinKind: id },
    })
  }
</script>

<section class="recruit-panel">
  <span class="label" title="Spawn new Kin directly. Cost scales with colony size. Loom and Barracks also produce Kin passively once built.">RECRUIT</span>
  <div class="grid">
    {#each DEFS as def}
      {@const cost = recruitCost(def.id, colonySize)}
      {@const affordable = tokens >= cost}
      <button
        type="button"
        class="rec"
        class:disabled={!affordable}
        disabled={!affordable}
        on:click={() => recruit(def.id)}
        title={`${def.tooltip} Cost: ${cost} tokens.`}
      >
        <span class="glyph">{def.glyph}</span>
        <span class="name">{def.name}</span>
        <span class="cost">{cost}◆</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .recruit-panel {
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
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .rec {
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-editor-foreground, #d4d4d4);
    font-family: inherit;
    font-size: var(--desc-font-sm, 12px);
    padding: 5px 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .rec:hover:not(.disabled) {
    border-color: var(--vscode-charts-blue, #4daafc);
  }
  .rec.disabled { opacity: 0.4; cursor: not-allowed; }
  .glyph { color: var(--vscode-charts-blue, #4daafc); font-size: var(--desc-font-md, 13px); }
  .name { color: var(--vscode-editor-foreground, #d4d4d4); font-size: var(--desc-font-xs, 11px); }
  .cost { color: var(--vscode-charts-purple, #b180d7); font-size: var(--desc-font-xs, 11px); }
</style>
