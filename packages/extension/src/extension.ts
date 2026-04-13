import * as vscode from 'vscode'
import * as path from 'path'
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

  if (devMode) {
    console.log('[idle_vibes] Running in development mode')
  }

  // ── Instance coordination ──────────────────────────────────
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
  const provider = new ColonyViewProvider(context.extensionUri, bridge)
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
    vscode.commands.registerCommand('idleVibes.reloadWebview', () => {
      provider.reload()
      vscode.window.showInformationMessage('[idle_vibes] Webview reloaded')
    }),
  )

  // ── Parser + game engine ───────────────────────────────────
  context.subscriptions.push(parser.start())
  context.subscriptions.push(gameEngine.start())

  context.subscriptions.push(
    parser.onSignal((signal) => {
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

  // ── Dev mode: auto-reload webview on UI rebuild ────────────
  if (devMode) {
    const mediaPath = path.join(context.extensionUri.fsPath, 'media', 'assets')
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(mediaPath, '*.{js,css}'),
    )
    watcher.onDidChange(() => {
      console.log('[idle_vibes] UI assets changed, reloading webview...')
      provider.reload()
    })
    watcher.onDidCreate(() => provider.reload())
    context.subscriptions.push(watcher)

    // Dev simulator
    console.log('[idle_vibes] Simulator commands available in command palette')
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
