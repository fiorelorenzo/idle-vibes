<script lang="ts">
  import { resources } from '../stores/game-state'
  import { RESOURCES } from '@idle-vibes/shared'
  import type { ResourceId } from '@idle-vibes/shared'

  const BAR_WIDTH = 20
  const DISPLAY_RESOURCES: ResourceId[] = [
    'raw_data', 'volatile_energy', 'stabilized_energy',
    'pure_energy', 'vibe_charge',
  ]

  function formatBar(current: number, cap: number | null): string {
    if (cap === null) return `${Math.floor(current)}`
    const filled = Math.round((current / cap) * BAR_WIDTH)
    const bar = '\u2588'.repeat(Math.min(filled, BAR_WIDTH)) +
      '\u2591'.repeat(Math.max(0, BAR_WIDTH - filled))
    return `${bar}  ${Math.floor(current)} / ${cap}`
  }

  function resourceLabel(id: ResourceId): string {
    return id.toUpperCase().replace(/_/g, '_').padEnd(12)
  }
</script>

<div class="resource-bar">
  {#each DISPLAY_RESOURCES as id}
    {@const def = RESOURCES[id]}
    {@const value = $resources[id]}
    <div class="resource-row">
      <span class="resource-name">{resourceLabel(id)}</span>
      <span class="resource-value">{formatBar(value, def.baseCap)}</span>
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
    line-height: 1.6;
  }

  .resource-name {
    color: #888;
    min-width: 96px;
  }

  .resource-value {
    color: #ccc;
    letter-spacing: -0.5px;
  }

  .persistent .resource-name {
    color: #aa88ff;
  }

  .persistent .resource-value {
    color: #aa88ff;
  }
</style>
