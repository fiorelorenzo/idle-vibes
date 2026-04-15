import * as vscode from 'vscode'
import * as path from 'path'
import { ColonyViewProvider } from './webview-provider'
// path import is retained for the dev-mode webview watcher below.
import { ExtensionBridge } from './bridge/host'
import { LocalStateStorage } from './storage/local-state'
import { SmartParser } from './parser/index'
import { GameCoordinator } from './game-coordinator'
import { ThemeBridge } from './theme/theme-bridge'
import { InstanceLock } from './instance-lock'
import { DevSimulator } from './parser/dev-simulator'
import { CloudSyncService } from './cloud/sync-service'

export function activate(context: vscode.ExtensionContext): void {
  const devMode = context.extensionMode === vscode.ExtensionMode.Development
  vscode.commands.executeCommand('setContext', 'idle_vibes:devMode', devMode)

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
  void storage.cleanLegacy()
  const parser = new SmartParser()
  const coordinator = new GameCoordinator(bridge, storage)
  const theme = new ThemeBridge(bridge)

  // ── Cloud sync (wire-up happens in Phase 7 with the new prestige flow) ──
  const apiUrl = process.env.VITE_API_URL ?? 'http://127.0.0.1:8787'
  const cloudSync = new CloudSyncService(apiUrl)
  context.subscriptions.push(cloudSync)
  coordinator.setCloudSync(cloudSync)

  cloudSync.enable().catch(() => {
    // If user declines or network fails, keep going offline
  })

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
      const snapshot = coordinator.getSnapshot()
      vscode.window.showInformationMessage(
        `[idle_vibes] run ${snapshot.run.prestigeCount + 1}, ` +
        `tokens=${snapshot.resources.tokens}, ` +
        `focus=${snapshot.resources.focus}, ` +
        `shards=${snapshot.resources.shards}, ` +
        `echoes=${snapshot.meta.echoes}, ` +
        `phase=${snapshot.drama.phase}`,
      )
    }),
    vscode.commands.registerCommand('idleVibes.dev.grantEchoes', () => {
      const snap = coordinator.getSnapshot()
      snap.meta.echoes += 20
      coordinator.handleWebviewMessage({ type: 'ui:request-snapshot' })
      vscode.window.showInformationMessage('[idle_vibes] +20 echoes granted')
    }),
    vscode.commands.registerCommand('idleVibes.dev.forcePrestige', () => {
      coordinator.handleWebviewMessage({ type: 'ui:request-prestige' })
      vscode.window.showInformationMessage('[idle_vibes] prestige forced')
    }),
    vscode.commands.registerCommand('idleVibes.dev.wipeLocalSave', async () => {
      const pick = await vscode.window.showWarningMessage(
        'Wipe the local idle_vibes save? This will reset the colony, Echoes, and owned relics. Cloud saves are not touched.',
        { modal: true },
        'Wipe',
      )
      if (pick !== 'Wipe') return
      await storage.clear()
      await storage.cleanLegacy()
      coordinator.resetLocalState()
      vscode.window.showInformationMessage('[idle_vibes] local save wiped')
    }),
    vscode.commands.registerCommand('idleVibes.reloadWebview', () => {
      provider.reload()
      vscode.window.showInformationMessage('[idle_vibes] Webview reloaded')
    }),
    vscode.commands.registerCommand('idleVibes.signIn', async () => {
      const identity = await cloudSync.auth.signIn()
      if (identity) {
        await cloudSync.enable()
        vscode.window.showInformationMessage(`[idle_vibes] Signed in as ${identity.username}`)
      }
    }),
    vscode.commands.registerCommand('idleVibes.signOut', () => {
      cloudSync.disable()
      cloudSync.auth.signOut()
      vscode.window.showInformationMessage('[idle_vibes] Signed out from cloud sync')
    }),
  )

  // ── Parser + coordinator ───────────────────────────────────
  context.subscriptions.push(parser.start())
  context.subscriptions.push(coordinator.start())
  context.subscriptions.push(theme.start())

  context.subscriptions.push(
    parser.onSignal((signal) => {
      if (lock.isLeader) {
        coordinator.handleParserSignal(signal)
      }
      bridge.send({ type: 'ext:parser-signal', signal })
    }),
  )

  context.subscriptions.push(
    bridge.onMessage((msg) => {
      if (msg.type === 'ui:ready') {
        // Re-push theme colors on webview ready so it gets them even before
        // first onDidChangeActiveColorTheme fires.
        theme.push()
      }
      if (lock.isLeader) {
        coordinator.handleWebviewMessage(msg)
      }
    }),
  )

  // ── Dev mode: auto-reload webview on UI rebuild ────────────
  if (devMode) {
    const mediaPath = path.join(context.extensionUri.fsPath, 'media', 'assets')
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(mediaPath, '*.{js,css}'),
    )
    let reloadTimer: ReturnType<typeof setTimeout> | undefined
    const debouncedReload = () => {
      clearTimeout(reloadTimer)
      reloadTimer = setTimeout(() => {
        console.log('[idle_vibes] UI assets changed, reloading webview...')
        provider.reload()
      }, 500)
    }
    watcher.onDidChange(debouncedReload)
    watcher.onDidCreate(debouncedReload)
    context.subscriptions.push(watcher)

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
