<script lang="ts">
  import { eventQueue } from '../stores/events'

  const TYPE_COLORS: Record<string, string> = {
    info: '#00aaff',
    warning: '#ffaa00',
    success: '#00ff88',
    danger: '#ff4444',
  }
</script>

{#if $eventQueue.length > 0}
  <div class="toast-container">
    {#each $eventQueue as event (event.id)}
      <div
        class="toast toast-enter"
        style="--toast-color: {TYPE_COLORS[event.type] || '#00aaff'}"
      >
        <span class="toast-marker">//</span>
        <span class="toast-text">{event.text}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    top: 8px;
    right: 8px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: none;
  }

  .toast {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 9px;
    padding: 3px 8px;
    background: rgba(10, 10, 26, 0.9);
    border-left: 2px solid var(--toast-color);
    color: var(--toast-color);
    white-space: nowrap;
    opacity: 0;
    transform: translateX(20px);
    animation: toast-slide 2.8s ease-out forwards;
  }

  .toast-marker {
    opacity: 0.5;
    margin-right: 4px;
  }

  @keyframes toast-slide {
    0% {
      opacity: 0;
      transform: translateX(20px);
    }
    10% {
      opacity: 1;
      transform: translateX(0);
    }
    75% {
      opacity: 1;
      transform: translateX(0);
    }
    100% {
      opacity: 0;
      transform: translateX(10px);
    }
  }
</style>
