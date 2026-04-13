import * as vscode from 'vscode'
import { ExtensionBridge } from './bridge/host'

export class ColonyViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'idleVibes.colonyView'
  private webviewView: vscode.WebviewView | null = null

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly bridge: ExtensionBridge,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.webviewView = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
    }

    this.bridge.attach(webviewView.webview)
    webviewView.webview.html = this.getHtml(webviewView.webview)
  }

  /**
   * Reload the webview contents. Called after vite rebuilds in dev mode.
   */
  reload(): void {
    if (this.webviewView) {
      this.webviewView.webview.html = this.getHtml(this.webviewView.webview)
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce()

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'assets', 'index.js'),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'assets', 'index.css'),
    )

    // CSP notes:
    // - script-src needs cspSource for dynamic imports (PixiJS code-split chunks)
    //   and 'unsafe-eval' for WebGL shader compilation
    // - worker-src for PixiJS web workers
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src ${webview.cspSource} 'unsafe-eval';
      worker-src ${webview.cspSource} blob:;
      img-src ${webview.cspSource} data:;
      font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>idle_vibes</title>
</head>
<body>
  <div id="app"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let nonce = ''
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return nonce
}
