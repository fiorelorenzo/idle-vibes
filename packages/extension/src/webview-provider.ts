import * as vscode from 'vscode'
import { ExtensionBridge } from './bridge/host'

export class ColonyViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'idleVibes.colonyView'

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly bridge: ExtensionBridge,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
    }

    this.bridge.attach(webviewView.webview)
    webviewView.webview.html = this.getHtml(webviewView.webview)
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce()

    // In production, the UI is built by Vite and copied to media/
    // During development, the Svelte dev server is used
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'assets', 'index.js'),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'assets', 'index.css'),
    )

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src 'nonce-${nonce}';
      img-src ${webview.cspSource} data:;
      font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>idle_vibes</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
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
