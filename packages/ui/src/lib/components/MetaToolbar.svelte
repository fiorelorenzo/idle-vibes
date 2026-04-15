<script lang="ts">
  import EchoTree from './EchoTree.svelte'
  import { worldSnapshot } from '../stores/world-store'
  import { setSfxEnabled, isSfxEnabled } from '../audio/synth'

  let echoOpen = false
  let sfxOn = isSfxEnabled()

  function toggleSfx(): void {
    sfxOn = !sfxOn
    setSfxEnabled(sfxOn)
  }
</script>

<nav class="meta-toolbar">
  <button on:click={() => (echoOpen = true)}>
    ECHO TREE · {$worldSnapshot?.meta.echoes ?? 0}
  </button>
  <button class="sfx-toggle" class:on={sfxOn} on:click={toggleSfx} title="toggle sfx">
    {sfxOn ? '♪' : '·'}
  </button>
  <span class="stats">
    {$worldSnapshot?.meta.totalPrestiges ?? 0} runs ·
    {$worldSnapshot?.meta.ownedRelics.length ?? 0} relics
  </span>
</nav>

<EchoTree bind:open={echoOpen} />

<style>
  .meta-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 8px;
    border-top: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-editor-background, #1e1e1e);
    font-size: 9px;
    color: var(--vscode-descriptionForeground, #888);
    flex: 0 0 auto;
  }
  button {
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-charts-purple, #b180d7);
    font-family: inherit;
    font-size: 9px;
    padding: 1px 6px;
    letter-spacing: 1px;
    cursor: pointer;
  }
  button:hover { border-color: var(--vscode-charts-purple, #b180d7); }
  .sfx-toggle {
    color: var(--vscode-descriptionForeground, #888);
    min-width: 22px;
    text-align: center;
  }
  .sfx-toggle.on {
    color: var(--vscode-charts-orange, #ff8c00);
    border-color: var(--vscode-charts-orange, #ff8c00);
  }
</style>
