<script lang="ts">
  import { resources } from '../stores/game-state'
  import { PROXY_ROLES } from '@idle-vibes/shared'
  import { bridge } from '../bridge/webview-bridge'
  import type { ProxyRole } from '@idle-vibes/shared'

  const RECRUIT_COST = 50

  const roles = Object.keys(PROXY_ROLES) as ProxyRole[]

  function recruit(role: ProxyRole) {
    bridge.send({
      type: 'ui:colony-action',
      action: { kind: 'recruit_proxy', role },
    })
  }
</script>

<div class="recruit-panel">
  <div class="section-header">RECRUIT</div>
  <div class="recruit-list">
    {#each roles as role}
      {@const def = PROXY_ROLES[role]}
      <button
        class="recruit-item"
        disabled={$resources.stabilized_energy < RECRUIT_COST}
        on:click={() => recruit(role)}
      >
        <span class="role-name">{role}</span>
        <span class="role-stat">{def.uniqueStatName}</span>
        <span class="role-cost">{RECRUIT_COST} stab.</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .recruit-panel {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 10px;
    padding: 8px;
    border-bottom: 1px solid #1a1a2e;
  }

  .section-header {
    color: #00aaff;
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 11px;
  }

  .recruit-list {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .recruit-item {
    background: #0a0a1a;
    border: 1px solid #1a1a2e;
    color: #ccc;
    font-family: inherit;
    font-size: 9px;
    padding: 3px 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
  }

  .recruit-item:hover:not(:disabled) {
    border-color: #00aaff;
  }

  .recruit-item:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .role-name {
    text-transform: uppercase;
    font-weight: bold;
    font-size: 10px;
  }

  .role-stat {
    color: #666;
  }

  .role-cost {
    color: #444;
  }
</style>
