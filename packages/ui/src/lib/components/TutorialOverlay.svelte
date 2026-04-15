<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'
  import { TUTORIAL_STEPS, TUTORIAL_DONE } from '@idle-vibes/shared'

  $: step = $worldSnapshot?.tutorial.step ?? 0
  $: isFirstRun = ($worldSnapshot?.run.prestigeCount ?? 0) === 0
  $: visible = isFirstRun && step >= 0 && step < TUTORIAL_STEPS.length
  $: current = visible ? TUTORIAL_STEPS[step] : null

  function skip(): void {
    bridge.send({
      type: 'ui:world-mutation',
      mutation: { kind: 'tutorial_advance', step: TUTORIAL_DONE },
    })
  }

  function advance(): void {
    const next = step + 1 >= TUTORIAL_STEPS.length ? TUTORIAL_DONE : step + 1
    bridge.send({
      type: 'ui:world-mutation',
      mutation: { kind: 'tutorial_advance', step: next },
    })
  }
</script>

{#if visible && current}
  <aside class="tutorial">
    <div class="body">
      <div class="step">step {step + 1}/{TUTORIAL_STEPS.length}</div>
      <div class="text">{current.text}</div>
      <div class="hint">{current.hint}</div>
    </div>
    <div class="actions">
      <button on:click={advance}>got it</button>
      <button class="secondary" on:click={skip}>skip</button>
    </div>
  </aside>
{/if}

<style>
  .tutorial {
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: 8px;
    z-index: 60;
    padding: 6px 8px;
    background: var(--vscode-editor-background, #1e1e1e);
    border: 1px solid var(--vscode-focusBorder, #007fd4);
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 10px;
    color: var(--vscode-editor-foreground, #d4d4d4);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .step {
    font-size: 8px;
    letter-spacing: 1px;
    color: var(--vscode-charts-blue, #4daafc);
    text-transform: uppercase;
  }
  .text { color: var(--vscode-editor-foreground, #d4d4d4); }
  .hint {
    font-size: 9px;
    color: var(--vscode-descriptionForeground, #888);
    font-style: italic;
  }
  .actions { display: flex; flex-direction: column; gap: 2px; }
  button {
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-charts-orange, #ff8c00);
    font-family: inherit;
    font-size: 9px;
    padding: 2px 6px;
    letter-spacing: 1px;
    cursor: pointer;
  }
  button:hover { border-color: var(--vscode-charts-orange, #ff8c00); }
  button.secondary { color: var(--vscode-descriptionForeground, #888); }
</style>
