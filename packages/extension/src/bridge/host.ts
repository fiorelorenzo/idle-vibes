import * as vscode from 'vscode'
import type { ExtensionMessage, WebviewMessage } from './messages'

export type MessageHandler = (message: WebviewMessage) => void

/**
 * Extension-side bridge for communicating with the webview.
 * Wraps VS Code's postMessage/onDidReceiveMessage APIs.
 */
export class ExtensionBridge {
  private handlers: MessageHandler[] = []
  private webview: vscode.Webview | null = null

  attach(webview: vscode.Webview): void {
    this.webview = webview
    webview.onDidReceiveMessage((msg: WebviewMessage) => {
      for (const handler of this.handlers) {
        handler(msg)
      }
    })
  }

  onMessage(handler: MessageHandler): vscode.Disposable {
    this.handlers.push(handler)
    return new vscode.Disposable(() => {
      const idx = this.handlers.indexOf(handler)
      if (idx >= 0) this.handlers.splice(idx, 1)
    })
  }

  send(message: ExtensionMessage): void {
    this.webview?.postMessage(message)
  }
}
