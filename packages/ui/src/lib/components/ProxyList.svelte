<script lang="ts">
  import { proxies, vibe } from '../stores/game-state'
  import { PROXY_FACES } from '@idle-vibes/shared'
  import type { Proxy } from '@idle-vibes/shared'

  function getFace(proxy: Proxy, vibeState: string): string {
    if (proxy.state === 'standby') return PROXY_FACES.standby
    if (proxy.state === 'glitched') return PROXY_FACES.glitched
    if (proxy.energyLevel < 15) return PROXY_FACES.low_energy
    if (proxy.logicIntegrity < 20) return PROXY_FACES.low_integrity
    if (vibeState === 'peak_vibe') return PROXY_FACES.peak_vibe
    if (vibeState === 'flow_state') return PROXY_FACES.flow_state
    return PROXY_FACES.working
  }

  function integrityColor(value: number): string {
    if (value > 60) return '#00ff88'
    if (value > 30) return '#ffaa00'
    return '#ff4444'
  }
</script>

<div class="proxy-list">
  <div class="section-header">PROXIES ({$proxies.length})</div>
  {#each $proxies as proxy}
    <div class="proxy-row" class:aria={proxy.isAria}>
      <span class="proxy-face">{getFace(proxy, $vibe.stateName)}</span>
      <span class="proxy-name">{proxy.name}</span>
      <span class="proxy-role">{proxy.role}</span>
      <span class="proxy-integrity" style="color: {integrityColor(proxy.logicIntegrity)}">
        {Math.round(proxy.logicIntegrity)}%
      </span>
      <span class="proxy-state">{proxy.state}</span>
    </div>
  {/each}
</div>

<style>
  .proxy-list {
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

  .proxy-row {
    display: flex;
    gap: 6px;
    line-height: 1.8;
    align-items: center;
  }

  .proxy-row.aria {
    color: #ffffff;
  }

  .proxy-face {
    font-size: 9px;
    min-width: 36px;
  }

  .proxy-name {
    color: #ccc;
    min-width: 72px;
  }

  .proxy-role {
    color: #666;
    min-width: 64px;
  }

  .proxy-integrity {
    min-width: 32px;
    text-align: right;
  }

  .proxy-state {
    color: #555;
    font-size: 9px;
  }
</style>
