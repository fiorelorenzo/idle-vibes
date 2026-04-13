<script lang="ts">
  import { glitches } from '../stores/game-state'
  import { GLITCH_DEFINITIONS } from '@idle-vibes/shared'
</script>

{#if $glitches.length > 0}
  <div class="glitch-list">
    <div class="section-header">GLITCHES ({$glitches.length} active)</div>
    {#each $glitches as glitch}
      {@const def = GLITCH_DEFINITIONS[glitch.type]}
      <div class="glitch-row">
        <span class="glitch-icon">[###]</span>
        <span class="glitch-name">{def?.name ?? glitch.type}</span>
        <span class="glitch-behavior">{def?.behavior ?? ''}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .glitch-list {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 10px;
    padding: 8px;
    border-bottom: 1px solid #3e1a2a;
  }

  .section-header {
    color: #ff4444;
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 11px;
  }

  .glitch-row {
    display: flex;
    gap: 6px;
    line-height: 1.8;
    color: #ff88aa;
  }

  .glitch-icon {
    color: #ff00ff;
  }

  .glitch-name {
    min-width: 100px;
  }

  .glitch-behavior {
    color: #884466;
    font-size: 9px;
  }
</style>
