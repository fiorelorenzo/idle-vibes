<script lang="ts">
  import { eventLog } from '../stores/event-log-store'

  function severityClass(sev: string): string {
    return `feed-${sev}`
  }
</script>

<aside class="event-feed">
  {#each [...$eventLog].reverse() as entry (entry.id)}
    <div class="line {severityClass(entry.severity)}">
      <span class="ts">{new Date(entry.ts).toISOString().slice(11, 19)}</span>
      <span class="txt">{entry.text}</span>
    </div>
  {/each}
  {#if $eventLog.length === 0}
    <div class="line feed-muted">// the stack is listening</div>
  {/if}
</aside>

<style>
  .event-feed {
    flex: 1 1 auto;
    min-height: 0;
    max-height: 100%;
    overflow-y: auto;
    padding: 6px 8px;
    font-size: var(--desc-font-sm, 12px);
    line-height: 1.4;
    border-top: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-editor-background, #1e1e1e);
  }
  .line {
    display: flex;
    gap: 8px;
    padding: 1px 0;
    color: var(--vscode-editor-foreground, #d4d4d4);
  }
  .ts {
    flex: 0 0 56px;
    color: var(--vscode-descriptionForeground, #888);
    font-size: var(--desc-font-xs, 11px);
  }
  .txt { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .feed-info    { color: var(--vscode-charts-blue, #4daafc); }
  .feed-success { color: var(--vscode-charts-green, #89d185); }
  .feed-warning { color: var(--vscode-charts-yellow, #dcdcaa); }
  .feed-danger  { color: var(--vscode-errorForeground, #f48771); }
  .feed-lore    { color: var(--vscode-charts-purple, #b180d7); font-style: italic; }
  .feed-muted   { color: var(--vscode-descriptionForeground, #888); font-style: italic; }
</style>
