import * as vscode from 'vscode'
import type { GameState } from '@idle-vibes/shared'

const STATE_KEY = 'idleVibes.gameState'

/**
 * Persists game state to VS Code globalState (local, unencrypted).
 * Secrets (session tokens) use SecretStorage instead.
 */
export class LocalStateStorage {
  constructor(private readonly globalState: vscode.Memento) {}

  save(state: GameState): Thenable<void> {
    return this.globalState.update(STATE_KEY, JSON.stringify(state))
  }

  load(): GameState | null {
    const raw = this.globalState.get<string>(STATE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as GameState
    } catch {
      return null
    }
  }

  clear(): Thenable<void> {
    return this.globalState.update(STATE_KEY, undefined)
  }
}
