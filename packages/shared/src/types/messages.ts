import type { ParserSignal } from './parser.js'
import type { ColonyState, GameSettings, GameState } from './game-state.js'

/**
 * Messages passed between the VS Code extension host and the webview.
 *
 * Extension → Webview: prefixed with 'ext:'
 * Webview → Extension: prefixed with 'ui:'
 */
export type ExtensionMessage =
  | { type: 'ext:parser-signal'; signal: ParserSignal }
  | { type: 'ext:state-sync'; state: GameState }
  | { type: 'ext:standby-enter' }
  | { type: 'ext:standby-exit' }
  | { type: 'ext:auth-status'; authenticated: boolean; username?: string; avatarUrl?: string }
  | { type: 'ext:sync-status'; syncing: boolean; lastSyncAt: number | null }

export type WebviewMessage =
  | { type: 'ui:ready' }
  | { type: 'ui:request-state' }
  | { type: 'ui:colony-action'; action: ColonyAction }
  | { type: 'ui:update-settings'; settings: Partial<GameSettings> }
  | { type: 'ui:prestige' }
  | { type: 'ui:enable-cloud-sync' }

export type ColonyAction =
  | { kind: 'place_building'; buildingId: string; position: { x: number; y: number } }
  | { kind: 'recruit_proxy'; role: string }
  | { kind: 'assign_proxy'; proxyId: string; targetId: string }
  | { kind: 'click_glitch'; glitchId: string }
  | { kind: 'start_job'; jobType: string; proxyId: string }
  | { kind: 'mine_block'; x: number; y: number; proxyId: string }

export type BridgeMessage = ExtensionMessage | WebviewMessage
