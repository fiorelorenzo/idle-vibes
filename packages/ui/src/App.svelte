<script lang="ts">
  import { onMount } from 'svelte'
  import { bridge } from './lib/bridge/webview-bridge'
  import { initWorldStore, worldSnapshot } from './lib/stores/world-store'
  import { initCloudSyncStore } from './lib/stores/cloud-sync'
  import { initThemeStore } from './lib/theme/theme-store'
  import GameCanvas from './lib/components/GameCanvas.svelte'
  import LayerTabs from './lib/components/LayerTabs.svelte'
  import EventFeed from './lib/components/EventFeed.svelte'
  import ExpeditionPanel from './lib/components/ExpeditionPanel.svelte'

  onMount(() => {
    initThemeStore()
    bridge.init()
    initWorldStore()
    initCloudSyncStore()
  })
</script>

<main class="descent">
  <header class="top">
    <span class="title">IDLE_VIBES :: DESCENT</span>
    {#if $worldSnapshot}
      <span class="phase">{$worldSnapshot.drama.phase}</span>
      <span class="run">run #{$worldSnapshot.run.prestigeCount + 1}</span>
    {:else}
      <span class="run muted">booting…</span>
    {/if}
  </header>

  {#if $worldSnapshot}
    <section class="hud">
      <span class="res res-tokens">◆ {$worldSnapshot.resources.tokens}</span>
      <span class="res res-focus">✦ {$worldSnapshot.resources.focus}</span>
      <span class="res res-shards">◈ {$worldSnapshot.resources.shards}</span>
    </section>
  {/if}

  <div class="stage">
    <GameCanvas />
    <LayerTabs />
  </div>

  <div class="feed">
    <EventFeed />
  </div>

  <ExpeditionPanel />
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

  :global(*) { box-sizing: border-box; }

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
    padding: 4px 8px;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
    font-size: 10px;
    color: var(--vscode-descriptionForeground, #888);
    flex: 0 0 auto;
  }
  .title { letter-spacing: 1px; color: var(--vscode-editor-foreground, #d4d4d4); }
  .phase {
    text-transform: uppercase;
    color: var(--vscode-charts-orange, #ff8c00);
    font-size: 9px;
  }
  .run { font-size: 9px; }
  .muted { opacity: 0.5; }

  .hud {
    display: flex;
    justify-content: space-around;
    padding: 4px 8px;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
    font-size: 11px;
    flex: 0 0 auto;
  }
  .res-tokens { color: var(--vscode-charts-blue, #4daafc); }
  .res-focus  { color: var(--vscode-charts-orange, #ff8c00); }
  .res-shards { color: var(--vscode-charts-purple, #b180d7); }

  .stage {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
  }

  .feed {
    flex: 0 0 120px;
    display: flex;
    flex-direction: column;
  }
</style>
