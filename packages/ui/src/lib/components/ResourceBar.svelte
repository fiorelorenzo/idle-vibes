<script lang="ts">
  import { resources } from '../stores/game-state'
  import { RESOURCES } from '@idle-vibes/shared'
  import type { ResourceId } from '@idle-vibes/shared'

  const DISPLAY_RESOURCES: ResourceId[] = [
    'raw_data', 'volatile_energy', 'stabilized_energy',
    'pure_energy', 'vibe_charge',
  ]

  // Track previous values for change highlighting
  let prevValues: Record<string, number> = {}
  let flashStates: Record<string, 'up' | 'down' | null> = {}

  $: {
    for (const id of DISPLAY_RESOURCES) {
      const current = Math.floor($resources[id])
      const prev = prevValues[id]
      if (prev !== undefined && current !== prev) {
        flashStates[id] = current > prev ? 'up' : 'down'
        // Clear flash after animation
        const capturedId = id
        setTimeout(() => {
          flashStates[capturedId] = null
          flashStates = flashStates // trigger reactivity
        }, 400)
      }
      prevValues[id] = current
    }
  }

  function fillPercent(current: number, cap: number | null): number {
    if (cap === null || cap === 0) return 0
    return Math.min(100, (current / cap) * 100)
  }

  function resourceLabel(id: ResourceId): string {
    return id.toUpperCase().replace(/_/g, '_').padEnd(12)
  }
</script>

<div class="resource-bar">
  {#each DISPLAY_RESOURCES as id}
    {@const def = RESOURCES[id]}
    {@const value = $resources[id]}
    {@const flash = flashStates[id]}
    <div class="resource-row" class:flash-up={flash === 'up'} class:flash-down={flash === 'down'}>
      <span class="resource-name">{resourceLabel(id)}</span>
      <div class="bar-container">
        <div class="bar-fill" style="width: {fillPercent(value, def.baseCap)}%"></div>
      </div>
      <span class="resource-value">{Math.floor(value)}{def.baseCap ? ` / ${def.baseCap}` : ''}</span>
    </div>
  {/each}

  <div class="resource-row persistent">
    <span class="resource-name">ARCH_PTS</span>
    <span class="resource-value">{Math.floor($resources.clean_arch_points)}</span>
  </div>
  <div class="resource-row persistent">
    <span class="resource-name">FRAGMENTS</span>
    <span class="resource-value">{Math.floor($resources.logic_fragments)}</span>
  </div>
  <div class="resource-row persistent">
    <span class="resource-name">ARIA_SHRD</span>
    <span class="resource-value">{Math.floor($resources.aria_shards)}</span>
  </div>
</div>

<style>
  .resource-bar {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 10px;
    padding: 8px;
    border-bottom: 1px solid #1a1a2e;
  }

  .resource-row {
    display: flex;
    gap: 8px;
    align-items: center;
    line-height: 1.6;
    transition: background-color 0.3s ease;
  }

  .resource-row.flash-up {
    animation: flash-green 0.4s ease-out;
  }

  .resource-row.flash-down {
    animation: flash-red 0.4s ease-out;
  }

  .resource-name {
    color: #888;
    min-width: 96px;
  }

  .bar-container {
    width: 80px;
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .bar-fill {
    height: 100%;
    background: #888;
    transition: width 0.4s ease-out;
  }

  .resource-value {
    color: #ccc;
    font-size: 9px;
  }

  .persistent .resource-name {
    color: #aa88ff;
  }

  .persistent .resource-value {
    color: #aa88ff;
  }

  @keyframes flash-green {
    0% { background-color: rgba(0, 255, 136, 0.15); }
    100% { background-color: transparent; }
  }

  @keyframes flash-red {
    0% { background-color: rgba(255, 68, 68, 0.15); }
    100% { background-color: transparent; }
  }
</style>
