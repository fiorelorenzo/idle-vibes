<script lang="ts">
  import { vibe, vibeStateDef } from '../stores/game-state'
  import { pushEvent } from '../stores/events'

  let prevStateName = ''

  $: vibeValue = $vibe.value
  $: stateDef = $vibeStateDef
  $: fillPercent = (vibeValue / 100) * 100

  // Detect vibe state changes and push events
  $: {
    if (prevStateName && stateDef.label && prevStateName !== stateDef.name) {
      const eventType = stateDef.name === 'peak_vibe' ? 'success' as const
        : stateDef.name === 'dead_zone' ? 'danger' as const
        : stateDef.name === 'flow_state' ? 'success' as const
        : 'info' as const
      pushEvent(`${stateDef.label} entered`, eventType)
    }
    prevStateName = stateDef.name
  }
</script>

<div class="vibe-meter" style="--accent: {stateDef.hudAccent}">
  <div class="vibe-label">VIBE</div>
  <div class="vibe-bar-container">
    <div class="vibe-bar-fill" style="width: {fillPercent}%"></div>
  </div>
  <div class="vibe-value">{Math.round(vibeValue)}</div>
  <div class="vibe-state">[{stateDef.label}]</div>
  {#if stateDef.hudMessage}
    <div class="vibe-message">{stateDef.hudMessage}</div>
  {/if}
  {#if $vibe.flowEventActive}
    <div class="flow-event">// flow_state_detected() → colony responding</div>
  {/if}
</div>

<style>
  .vibe-meter {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    padding: 8px;
    border-bottom: 1px solid var(--accent);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 8px;
    transition: border-color 0.3s ease;
  }

  .vibe-label {
    color: var(--accent);
    font-weight: bold;
    transition: color 0.3s ease;
  }

  .vibe-bar-container {
    width: 120px;
    height: 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
  }

  .vibe-bar-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.5s ease-out, background-color 0.3s ease;
    position: relative;
  }

  .vibe-bar-fill::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 4px;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
  }

  .vibe-value {
    color: #ffffff;
    min-width: 24px;
    text-align: right;
  }

  .vibe-state {
    color: var(--accent);
    opacity: 0.8;
    transition: color 0.3s ease;
  }

  .vibe-message, .flow-event {
    width: 100%;
    color: var(--accent);
    opacity: 0.6;
    margin-top: 4px;
    font-style: italic;
    transition: color 0.3s ease;
  }
</style>
