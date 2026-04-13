/**
 * Re-export shared message types and provide bridge utilities.
 * The bridge uses VS Code's message passing API (postMessage / onDidReceiveMessage).
 */
export type {
  ExtensionMessage,
  WebviewMessage,
  BridgeMessage,
  ColonyAction,
} from '@idle-vibes/shared'
