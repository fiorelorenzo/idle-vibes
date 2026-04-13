<script lang="ts">
  import { onMount } from 'svelte'
  import { bridge } from './lib/bridge/webview-bridge'
  import { initGameStore, colony } from './lib/stores/game-state'
  import { codexOpen } from './lib/stores/codex'
  import { cloudSync, initCloudSyncStore } from './lib/stores/cloud-sync'
  import VibeMeter from './lib/components/VibeMeter.svelte'
  import ResourceBar from './lib/components/ResourceBar.svelte'
  import ColonyCanvas from './lib/components/ColonyCanvas.svelte'
  import ProxyList from './lib/components/ProxyList.svelte'
  import GlitchList from './lib/components/GlitchList.svelte'
  import BuildPanel from './lib/components/BuildPanel.svelte'
  import RecruitPanel from './lib/components/RecruitPanel.svelte'
  import Codex from './lib/components/Codex.svelte'

  function handleCloudSync() {
    bridge.send({ type: 'ui:enable-cloud-sync' })
  }

  onMount(() => {
    bridge.init()
    initGameStore()
    initCloudSyncStore()
  })
</script>

<main class="idle-vibes">
  <VibeMeter />
  <ResourceBar />
  <ColonyCanvas />

  <div class="controls">
    <ProxyList />
    <GlitchList />
    <BuildPanel />
    <RecruitPanel />
  </div>

  <div class="toolbar">
    <button class="toolbar-btn" on:click={() => codexOpen.set(true)}>[CODEX]</button>
    {#if $cloudSync.authenticated}
      <span class="cloud-status" title="Signed in as {$cloudSync.username}">[SYNC: {$cloudSync.username}]</span>
    {:else}
      <button class="toolbar-btn cloud-btn" on:click={handleCloudSync}>[CLOUD SYNC]</button>
    {/if}
    {#if $colony.standbyActive}
      <span class="standby-indicator">[STANDBY]</span>
    {/if}
  </div>

  <Codex />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #0a0a1a;
    color: #cccccc;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    overflow-x: hidden;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .idle-vibes {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow-y: auto;
  }

  .controls {
    flex: 1;
  }

  .toolbar {
    display: flex;
    gap: 8px;
    padding: 6px 8px;
    border-top: 1px solid #1a1a2e;
    align-items: center;
  }

  .toolbar-btn {
    background: none;
    border: 1px solid #1a1a2e;
    color: #00aaff;
    font-family: inherit;
    font-size: 10px;
    padding: 3px 8px;
    cursor: pointer;
  }

  .toolbar-btn:hover {
    border-color: #00aaff;
  }

  .cloud-status {
    color: #00cc66;
    font-size: 10px;
  }

  .cloud-btn {
    color: #aa88ff;
  }

  .cloud-btn:hover {
    border-color: #aa88ff;
  }

  .standby-indicator {
    color: #666;
    font-size: 10px;
    animation: blink 2s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
