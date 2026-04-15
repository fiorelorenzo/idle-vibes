/**
 * Re-export shared message types for the bridge layer.
 * The bridge uses VS Code's message passing API (postMessage / onDidReceiveMessage).
 */
export type {
  ExtensionMessage,
  WebviewMessage,
  BridgeMessage,
} from '@idle-vibes/shared'
