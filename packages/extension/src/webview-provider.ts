import * as vscode from 'vscode'
import { ExtensionBridge } from './bridge/host'

const DEV_SERVER_URL = 'http://localhost:5175'

export class ColonyViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'idleVibes.colonyView'

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly bridge: ExtensionBridge,
    private readonly devMode: boolean = false,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: this.devMode
        ? undefined // allow all origins in dev
        : [vscode.Uri.joinPath(this.extensionUri, 'media')],
    }

    this.bridge.attach(webviewView.webview)
    webviewView.webview.html = this.devMode
      ? this.getDevHtml()
      : this.getProdHtml(webviewView.webview)
  }

  /**
   * Dev mode: loads from the Vite dev server at localhost:5173.
   * HMR works out of the box — edits to Svelte components reflect instantly.
   *
   * CSP is relaxed to allow connections to the dev server and inline styles
   * injected by Vite/HMR.
   */
  private getDevHtml(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src 'unsafe-inline';
      script-src 'unsafe-inline' ${DEV_SERVER_URL};
      connect-src ${DEV_SERVER_URL} ws://localhost:5175;
      img-src data: ${DEV_SERVER_URL};
      font-src ${DEV_SERVER_URL};">
  <title>idle_vibes [DEV]</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="${DEV_SERVER_URL}/@vite/client"></script>
  <script type="module" src="${DEV_SERVER_URL}/src/main.ts"></script>
</body>
</html>`
  }

  /**
   * Production mode: loads pre-built assets from media/.
   * Strict CSP with nonce-based script loading.
   */
  private getProdHtml(webview: vscode.Webview): string {
    const nonce = getNonce()

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
