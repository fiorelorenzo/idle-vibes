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
  <button
    class="prestige"
    on:click={confirmPrestige}
    title="End this run and earn Commit Echoes. Resets colony, unlocks, and Relics equipped; keeps Echo Tree and owned relics. Payout scales with layers cleared and bosses killed."
  >COMMIT TO MAIN</button>
{/if}

<style>
  .prestige {
    margin: 4px 10px;
    padding: 7px;
    background: transparent;
    border: 1px solid var(--vscode-charts-purple, #b180d7);
    color: var(--vscode-charts-purple, #b180d7);
    font-family: inherit;
    font-size: var(--desc-font-sm, 12px);
    letter-spacing: 2px;
    cursor: pointer;
    font-weight: bold;
  }
  .prestige:hover {
    background: var(--vscode-charts-purple, #b180d7);
    color: var(--vscode-editor-background, #1e1e1e);
  }
</style>
