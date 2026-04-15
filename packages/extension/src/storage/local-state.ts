import * as vscode from 'vscode'
import type { WorldSnapshot } from '@idle-vibes/shared'
import { WORLD_SCHEMA_VERSION } from '@idle-vibes/shared'

const STATE_KEY = 'idleVibes.worldSnapshot'

/**
 * Persists the authoritative WorldSnapshot to VS Code globalState.
 * The snapshot is small and JSON-serializable — everything that can be
 * reconstructed from a seed lives in the webview ECS instead.
 */
export class LocalStateStorage {
  constructor(private readonly globalState: vscode.Memento) {}

  save(snapshot: WorldSnapshot): Thenable<void> {
    return this.globalState.update(STATE_KEY, JSON.stringify(snapshot))
  }

  load(): WorldSnapshot | null {
    const raw = this.globalState.get<string>(STATE_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as WorldSnapshot
      if (parsed.schemaVersion !== WORLD_SCHEMA_VERSION) {
        // Schema mismatch: discard. A migration step would live here in the future.
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  clear(): Thenable<void> {
    return this.globalState.update(STATE_KEY, undefined)
  }
}
