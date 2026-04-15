<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'
  import { LAYER_DEFS } from '@idle-vibes/shared'
  import type { LayerId } from '@idle-vibes/shared'

  let selectedLayer: LayerId = 'surface'

  function launch(): void {
    const durationMs = 60_000 + Math.random() * 120_000
    bridge.send({
      type: 'ui:world-mutation',
      mutation: {
        kind: 'expedition_start',
        delverId: `delver-${Date.now()}`,
        targetLayer: selectedLayer,
        durationMs: Math.floor(durationMs),
      },
    })
  }

  function fmtTimeRemaining(startedAt: number, durationMs: number): string {
    const remainingMs = Math.max(0, startedAt + durationMs - Date.now())
    const s = Math.ceil(remainingMs / 1000)
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
  }

  let tick = 0
  setInterval(() => {
    tick = (tick + 1) % 1000
  }, 1000)
</script>

<section class="expedition-panel">
  <div class="header">
    <span class="label">EXPEDITIONS</span>
    <div class="controls">
      <select bind:value={selectedLayer}>
        {#each LAYER_DEFS as def}
          {@const state = $worldSnapshot?.layers.find((l) => l.id === def.id)}
          <option value={def.id} disabled={!state?.unlocked}>
            {def.displayName}
          </option>
        {/each}
      </select>
      <button on:click={launch}>launch</button>
    </div>
  </div>

  <div class="list">
    {#each $worldSnapshot?.expeditions ?? [] as exp (exp.id)}
      <div class="exp-row">
        <span class="exp-layer">{exp.targetLayer}</span>
        <span class="exp-id">{exp.delverId.slice(-4)}</span>
        <span class="exp-remaining" data-tick={tick}>
          {fmtTimeRemaining(exp.startedAt, exp.durationMs)}
        </span>
      </div>
    {/each}
    {#if ($worldSnapshot?.expeditions.length ?? 0) === 0}
      <div class="exp-empty">no delvers in the stack</div>
    {/if}
  </div>
</section>

<style>
  .expedition-panel {
    flex: 0 0 auto;
    border-top: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-editor-background, #1e1e1e);
    padding: 4px 6px;
    min-height: 52px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    color: var(--vscode-descriptionForeground, #888);
  }
  .label { letter-spacing: 1px; }
  .controls { display: flex; gap: 4px; }
  select, button {
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-editor-foreground, #d4d4d4);
    font-family: inherit;
    font-size: 9px;
    padding: 1px 4px;
  }
  button {
    cursor: pointer;
    color: var(--vscode-charts-purple, #b180d7);
  }
  button:hover { border-color: var(--vscode-charts-purple, #b180d7); }

  .list { margin-top: 4px; display: flex; flex-direction: column; gap: 2px; }
  .exp-row { display: flex; gap: 6px; font-size: 9px; }
  .exp-layer { color: var(--vscode-charts-blue, #4daafc); text-transform: uppercase; flex: 0 0 60px; }
  .exp-id { color: var(--vscode-descriptionForeground, #888); flex: 0 0 40px; }
  .exp-remaining { color: var(--vscode-charts-orange, #ff8c00); }
  .exp-empty { font-size: 9px; font-style: italic; color: var(--vscode-descriptionForeground, #666); }
</style>
