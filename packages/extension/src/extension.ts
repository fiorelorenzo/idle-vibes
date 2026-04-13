import * as vscode from 'vscode'
import { ColonyViewProvider } from './webview-provider'
import { ExtensionBridge } from './bridge/host'
import { LocalStateStorage } from './storage/local-state'
import { SmartParser } from './parser/index'
import { VibeEngine } from './vibe/vibe-engine'
import { GameEngine } from './game-engine'

export function activate(context: vscode.ExtensionContext): void {
  // Dev mode is enabled when running in the Extension Development Host
  // (VS Code sets this automatically when launched via F5 / launch.json)
  const devMode = context.extensionMode === vscode.ExtensionMode.Development

  if (devMode) {
    console.log('[idle_vibes] Running in development mode — webview loads from Vite dev server')
  }

  const bridge = new ExtensionBridge()
  const storage = new LocalStateStorage(context.globalState)
  const parser = new SmartParser()
  const vibeEngine = new VibeEngine()
  const gameEngine = new GameEngine(bridge, storage, parser, vibeEngine)

  // Register the sidebar webview
  const provider = new ColonyViewProvider(context.extensionUri, bridge, devMode)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ColonyViewProvider.viewType, provider),
  )

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('idleVibes.openColony', () => {
      vscode.commands.executeCommand('idleVibes.colonyView.focus')
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('idleVibes.showPerformanceStats', () => {
      gameEngine.showPerformanceStats()
    }),
  )

  // Start the parser and game engine
  context.subscriptions.push(parser.start())
  context.subscriptions.push(gameEngine.start())

  // Listen for parser signals → forward to game engine
  context.subscriptions.push(
    parser.onSignal((signal) => {
      gameEngine.handleParserSignal(signal)
      bridge.send({ type: 'ext:parser-signal', signal })
    }),
  )

  // Listen for webview messages
  context.subscriptions.push(
    bridge.onMessage((msg) => {
      gameEngine.handleWebviewMessage(msg)
    }),
  )
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
