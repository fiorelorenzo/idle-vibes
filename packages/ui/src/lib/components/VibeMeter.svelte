<script lang="ts">
  import { vibe, vibeStateDef } from '../stores/game-state'

  const BAR_WIDTH = 20

  $: vibeValue = $vibe.value
  $: stateDef = $vibeStateDef
  $: filledBlocks = Math.round((vibeValue / 100) * BAR_WIDTH)
  $: bar = '\u2588'.repeat(filledBlocks) + '\u2591'.repeat(BAR_WIDTH - filledBlocks)
</script>

<div class="vibe-meter" style="--accent: {stateDef.hudAccent}">
  <div class="vibe-label">VIBE</div>
  <div class="vibe-bar">{bar}</div>
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
  }

  .vibe-meter > div {
    display: inline-block;
    margin-right: 8px;
  }

  .vibe-label {
    color: var(--accent);
    font-weight: bold;
  }

  .vibe-bar {
    color: var(--accent);
    letter-spacing: -1px;
  }

  .vibe-value {
    color: #ffffff;
    min-width: 24px;
    text-align: right;
  }

  .vibe-state {
    color: var(--accent);
    opacity: 0.8;
  }

  .vibe-message, .flow-event {
    display: block !important;
    color: var(--accent);
    opacity: 0.6;
    margin-top: 4px;
    font-style: italic;
  }
</style>
