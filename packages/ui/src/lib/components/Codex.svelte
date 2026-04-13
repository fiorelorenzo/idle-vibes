<script lang="ts">
  import { codexOpen, selectedCategory, unlockedEntries } from '../stores/codex'
  import { CODEX_ENTRIES } from '../../codex-data'
  import type { CodexCategory } from '@idle-vibes/shared'

  const categories: CodexCategory[] = ['resources', 'proxies', 'buildings', 'vibe', 'enemies', 'lore']

  $: filteredEntries = CODEX_ENTRIES.filter((e) => e.category === $selectedCategory)

  function isUnlocked(entryId: string): boolean {
    return $unlockedEntries.has(entryId)
  }
</script>

{#if $codexOpen}
  <div class="codex-overlay">
    <div class="codex-header">
      <span class="codex-title">[CODEX]</span>
      <button class="codex-close" on:click={() => codexOpen.set(false)}>[X]</button>
    </div>

    <div class="codex-body">
      <div class="codex-categories">
        {#each categories as cat}
          <button
            class="cat-btn"
            class:active={$selectedCategory === cat}
            on:click={() => selectedCategory.set(cat)}
          >
            {cat.toUpperCase()}
          </button>
        {/each}
      </div>

      <div class="codex-entries">
        {#each filteredEntries as entry}
          <div class="codex-entry" class:locked={!isUnlocked(entry.id)}>
            <div class="entry-title">{entry.title}</div>
            <pre class="entry-content">{isUnlocked(entry.id) ? entry.content : (entry.lockedPreview ?? '???')}</pre>
          </div>
        {/each}

        {#if filteredEntries.length === 0}
          <div class="empty">No entries in this category yet.</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .codex-overlay {
    position: fixed;
    inset: 0;
    background: #0a0a1a;
    z-index: 100;
    display: flex;
    flex-direction: column;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
  }

  .codex-header {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    border-bottom: 1px solid #1a1a2e;
  }

  .codex-title {
    color: #00aaff;
    font-weight: bold;
  }

  .codex-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
  }

  .codex-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .codex-categories {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #1a1a2e;
    padding: 4px;
    min-width: 90px;
  }

  .cat-btn {
    background: none;
    border: none;
    color: #666;
    font-family: inherit;
    font-size: 10px;
    padding: 4px 8px;
    text-align: left;
    cursor: pointer;
  }

  .cat-btn.active {
    color: #00aaff;
    background: #0a1a2a;
  }

  .codex-entries {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .codex-entry {
    margin-bottom: 16px;
    border: 1px solid #1a1a2e;
    padding: 8px;
  }

  .codex-entry.locked {
    opacity: 0.4;
  }

  .entry-title {
    color: #00aaff;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .entry-content {
    color: #aaa;
    white-space: pre-wrap;
    font-size: 10px;
    line-height: 1.5;
    margin: 0;
  }

  .empty {
    color: #444;
    padding: 16px;
  }
</style>
