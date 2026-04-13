import * as vscode from 'vscode'
import { ColonyViewProvider } from './webview-provider'
import { ExtensionBridge } from './bridge/host'
import { LocalStateStorage } from './storage/local-state'
import { SmartParser } from './parser/index'
import { VibeEngine } from './vibe/vibe-engine'
import { GameEngine } from './game-engine'
import { InstanceLock } from './instance-lock'
import { DevSimulator } from './parser/dev-simulator'

export function activate(context: vscode.ExtensionContext): void {
  const devMode = context.extensionMode === vscode.ExtensionMode.Development

  // ── Instance coordination ──────────────────────────────────
  // Multiple VS Code windows may each run idle_vibes. Only the leader
  // instance owns the colony state. Non-leaders still parse but their
  // signals are discarded (they see the colony in read-only mode).
  const lock = new InstanceLock()
  context.subscriptions.push(lock.start())

  if (!lock.isLeader) {
    console.log(
      `[idle_vibes] Another instance is leading the colony. ` +
      `This instance (${lock.instanceId}) runs in observer mode.`,
    )
  }

  const bridge = new ExtensionBridge()
  const storage = new LocalStateStorage(context.globalState)
  const parser = new SmartParser()
  const vibeEngine = new VibeEngine()
  const gameEngine = new GameEngine(bridge, storage, parser, vibeEngine)

  // ── Webview ────────────────────────────────────────────────
  const provider = new ColonyViewProvider(context.extensionUri, bridge, devMode)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ColonyViewProvider.viewType, provider),
  )

  // ── Commands ───────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('idleVibes.openColony', () => {
      vscode.commands.executeCommand('idleVibes.colonyView.focus')
    }),
    vscode.commands.registerCommand('idleVibes.showPerformanceStats', () => {
      gameEngine.showPerformanceStats()
    }),
  )

  // ── Parser + game engine ───────────────────────────────────
  context.subscriptions.push(parser.start())
  context.subscriptions.push(gameEngine.start())

  context.subscriptions.push(
    parser.onSignal((signal) => {
      // Only the leader processes game logic.
      // All instances forward signals to the webview for visual feedback.
      if (lock.isLeader) {
        gameEngine.handleParserSignal(signal)
      }
      bridge.send({ type: 'ext:parser-signal', signal })
    }),
  )

  context.subscriptions.push(
    bridge.onMessage((msg) => {
      if (lock.isLeader) {
        gameEngine.handleWebviewMessage(msg)
      }
    }),
  )

  // ── Dev simulator (only in Extension Development Host) ─────
  if (devMode) {
    console.log('[idle_vibes] Dev mode — simulator commands available in command palette')
    const simulator = new DevSimulator((signal) => {
      parser.inject(signal)
    })
    simulator.register(context)
    context.subscriptions.push(new vscode.Disposable(() => simulator.dispose()))
  }
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
