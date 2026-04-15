<script lang="ts">
  import { onMount } from 'svelte'
  import { bridge } from './lib/bridge/webview-bridge'
  import { initWorldStore, worldSnapshot } from './lib/stores/world-store'
  import { initCloudSyncStore } from './lib/stores/cloud-sync'
  import { initThemeStore, theme } from './lib/theme/theme-store'
  import GameCanvas from './lib/components/GameCanvas.svelte'

  onMount(() => {
    initThemeStore()
    bridge.init()
    initWorldStore()
    initCloudSyncStore()
  })
</script>

<main class="descent" data-theme-kind={$theme.kind}>
  <header class="top">
    <span class="title">IDLE_VIBES: THE DESCENT</span>
    {#if $worldSnapshot}
      <span class="build">run #{$worldSnapshot.run.prestigeCount + 1}</span>
    {:else}
      <span class="build muted">booting…</span>
    {/if}
  </header>

  {#if $worldSnapshot}
    <section class="hud">
      <span class="res res-tokens">◆ {$worldSnapshot.resources.tokens}</span>
      <span class="res res-focus">✦ {$worldSnapshot.resources.focus}</span>
      <span class="res res-shards">◈ {$worldSnapshot.resources.shards}</span>
    </section>
  {/if}

  <GameCanvas />

  <footer class="bottom">
    <span>the stack grows beneath you</span>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--vscode-editor-background, #1e1e1e);
    color: var(--vscode-editor-foreground, #d4d4d4);
    font-family: var(--vscode-editor-font-family, 'JetBrains Mono', 'Fira Code', monospace);
    font-size: var(--vscode-editor-font-size, 12px);
    overflow: hidden;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .descent {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--vscode-editor-background, #1e1e1e);
    color: var(--vscode-editor-foreground, #d4d4d4);
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
    font-size: 10px;
    color: var(--vscode-descriptionForeground, #888);
    flex: 0 0 auto;
  }

  .title {
    letter-spacing: 1px;
    color: var(--vscode-editor-foreground, #d4d4d4);
  }

  .muted {
    opacity: 0.5;
  }

  .hud {
    display: flex;
    justify-content: space-around;
    padding: 4px 10px;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
    font-size: 11px;
    flex: 0 0 auto;
  }

  .res-tokens { color: var(--vscode-charts-blue, #4daafc); }
  .res-focus { color: var(--vscode-charts-orange, #ff8c00); }
  .res-shards { color: var(--vscode-charts-purple, #b180d7); }

  .bottom {
    padding: 6px 10px;
    border-top: 1px solid var(--vscode-panel-border, #333);
    font-size: 9px;
    color: var(--vscode-descriptionForeground, #666);
    text-align: center;
    flex: 0 0 auto;
  }
</style>
