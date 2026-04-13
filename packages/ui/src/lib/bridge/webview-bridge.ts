import type { ExtensionMessage, WebviewMessage } from '@idle-vibes/shared'

type MessageHandler = (message: ExtensionMessage) => void

/**
 * Webview-side bridge for communicating with the VS Code extension host.
 * Uses the acquireVsCodeApi() function injected by VS Code.
 */
class WebviewBridge {
  private vscode: { postMessage: (msg: unknown) => void } | null = null
  private handlers: MessageHandler[] = []
  private ready = false

  init(): void {
    // acquireVsCodeApi is injected by VS Code when the webview loads
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.vscode = (window as any).acquireVsCodeApi()
    } catch {
      // Running outside VS Code (dev mode) — use mock
      console.warn('[idle_vibes] Running outside VS Code, using mock bridge')
      this.vscode = { postMessage: (msg) => console.log('[bridge:mock]', msg) }
    }

    window.addEventListener('message', (event: MessageEvent) => {
      const msg = event.data as ExtensionMessage
      for (const handler of this.handlers) {
        handler(msg)
      }
    })

    this.ready = true
    this.send({ type: 'ui:ready' })
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.push(handler)
    return () => {
      const idx = this.handlers.indexOf(handler)
      if (idx >= 0) this.handlers.splice(idx, 1)
    }
  }

  send(message: WebviewMessage): void {
    this.vscode?.postMessage(message)
  }

  isReady(): boolean {
    return this.ready
  }
}

export const bridge = new WebviewBridge()
