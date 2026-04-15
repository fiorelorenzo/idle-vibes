<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'

  function confirmPrestige(): void {
    const snap = $worldSnapshot
    if (!snap) return
    const echoes = Math.max(1, Math.floor(snap.resources.shards / 10) + snap.run.layersCleared + snap.run.bossesKilled * 2 + 1)
    const ok = confirm(`Commit to main? +${echoes} echoes · reset colony.`)
    if (!ok) return
    bridge.send({ type: 'ui:request-prestige' })
  }
</script>

{#if $worldSnapshot && ($worldSnapshot.run.deepestLayer !== 'surface' || $worldSnapshot.run.layersCleared > 0 || $worldSnapshot.resources.shards >= 20)}
  <button class="prestige" on:click={confirmPrestige}>COMMIT TO MAIN</button>
{/if}

<style>
  .prestige {
    margin: 2px 6px;
    padding: 4px;
    background: transparent;
    border: 1px solid var(--vscode-charts-purple, #b180d7);
    color: var(--vscode-charts-purple, #b180d7);
    font-family: inherit;
    font-size: 9px;
    letter-spacing: 2px;
    cursor: pointer;
  }
  .prestige:hover {
    background: var(--vscode-charts-purple, #b180d7);
    color: var(--vscode-editor-background, #1e1e1e);
  }
</style>
