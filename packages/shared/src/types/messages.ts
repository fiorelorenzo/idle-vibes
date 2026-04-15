import type { WorldSnapshot, WorldMutation } from './world.js'
import type { GameEvent, LogEntry } from './events.js'
import type { ThemeColors } from './theme.js'
import type { ParserSignal } from './parser.js'

/**
 * Messages passed between the VS Code extension host and the webview.
 *
 * Extension → Webview: prefixed with 'ext:'
 * Webview → Extension: prefixed with 'ui:'
 *
 * Guiding rules:
 * - The host streams events, NOT full state. After an initial snapshot,
 *   all gameplay changes are represented as GameEvents or WorldMutations.
 * - Parser signals are still exposed raw for dev tooling / logs, but the
 *   GameCoordinator is the only subsystem that should consume them in prod.
 */
export type ExtensionMessage =
  | { type: 'ext:world-snapshot'; snapshot: WorldSnapshot; tick: number }
  | { type: 'ext:game-event'; event: GameEvent; tick: number }
  | { type: 'ext:theme'; colors: ThemeColors }
  | { type: 'ext:parser-signal'; signal: ParserSignal }
  | { type: 'ext:auth-status'; authenticated: boolean; username?: string; avatarUrl?: string }
  | { type: 'ext:sync-status'; syncing: boolean; lastSyncAt: number | null }

export type WebviewMessage =
  | { type: 'ui:ready' }
  | { type: 'ui:request-snapshot' }
  | { type: 'ui:world-mutation'; mutation: WorldMutation }
  | { type: 'ui:log-event'; entry: LogEntry }
  | { type: 'ui:request-prestige' }
  | { type: 'ui:enable-cloud-sync' }

export type BridgeMessage = ExtensionMessage | WebviewMessage
