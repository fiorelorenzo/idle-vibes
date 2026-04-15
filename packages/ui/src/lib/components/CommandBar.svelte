<script lang="ts">
  import { worldSnapshot } from '../stores/world-store'
  import { bridge } from '../bridge/webview-bridge'
  import { pushLog } from '../stores/event-log-store'

  const ABILITIES = [
    { id: 'lance', label: 'LANCE', cost: 3, desc: 'aoe line strike' },
    { id: 'shield', label: 'SHIELD', cost: 2, desc: 'stun pulse' },
    { id: 'heal', label: 'HEAL', cost: 2, desc: 'kin recover' },
  ] as const

  const cooldowns: Record<string, number> = {}

  function cast(ab: (typeof ABILITIES)[number]): void {
    const focus = $worldSnapshot?.resources.focus ?? 0
    if (focus < ab.cost) {
      pushLog({
        id: `deny-${Date.now()}`,
        ts: Date.now(),
        severity: 'warning',
        text: `not enough focus for ${ab.label}`,
      })
      return
    }
    const now = Date.now()
    if (cooldowns[ab.id] && now < cooldowns[ab.id]) return
    cooldowns[ab.id] = now + 5_000
    bridge.send({
      type: 'ui:world-mutation',
      mutation: { kind: 'resource_delta', resource: 'focus', delta: -ab.cost },
    })
    pushLog({
      id: `cast-${ab.id}-${now}`,
      ts: now,
      severity: 'success',
      text: `// cast ${ab.label}`,
    })
  }

  function onCooldown(id: string): boolean {
    return cooldowns[id] !== undefined && Date.now() < cooldowns[id]
  }
</script>

<section class="command-bar">
  {#each ABILITIES as ab}
    {@const affordable = ($worldSnapshot?.resources.focus ?? 0) >= ab.cost}
    <button
      class="cmd"
      class:disabled={!affordable || onCooldown(ab.id)}
      title={ab.desc}
      on:click={() => cast(ab)}
    >
      <span class="label">{ab.label}</span>
      <span class="cost">{ab.cost}✦</span>
    </button>
  {/each}
</section>

<style>
  .command-bar {
    display: flex;
    gap: 4px;
    padding: 4px 8px;
    border-top: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-editor-background, #1e1e1e);
    flex: 0 0 auto;
  }
  .cmd {
    flex: 1;
    background: transparent;
    border: 1px solid var(--vscode-panel-border, #333);
    color: var(--vscode-editor-foreground, #d4d4d4);
    font-family: inherit;
    font-size: 9px;
    padding: 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }
  .cmd:hover:not(.disabled) {
    border-color: var(--vscode-charts-orange, #ff8c00);
  }
  .cmd.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .label { letter-spacing: 1px; color: var(--vscode-charts-orange, #ff8c00); }
  .cost { color: var(--vscode-descriptionForeground, #888); }
</style>
