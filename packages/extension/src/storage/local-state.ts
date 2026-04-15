import * as vscode from 'vscode'
import type { WorldSnapshot } from '@idle-vibes/shared'
import { WORLD_SCHEMA_VERSION } from '@idle-vibes/shared'

const STATE_KEY = 'idleVibes.worldSnapshot'

/**
 * Legacy globalState keys used by earlier versions of idle_vibes. These
 * hold the old colony/proxies/buildings/vibe schema that The Descent
 * rewrite no longer understands. Cleaned on activation.
 */
const LEGACY_KEYS = ['idleVibes.gameState'] as const

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
      // Defensive: ensure optional collections exist even if the persisted
      // blob predates a schema field.
      if (!parsed.buildings) parsed.buildings = []
      if (!parsed.expeditions) parsed.expeditions = []
      return parsed
    } catch {
      return null
    }
  }

  clear(): Thenable<void> {
    return this.globalState.update(STATE_KEY, undefined)
  }

  /**
   * Wipes any legacy keys from prior versions of the extension. One-shot
   * idempotent cleanup — safe to call on every activation.
   */
  async cleanLegacy(): Promise<void> {
    for (const key of LEGACY_KEYS) {
      const existing = this.globalState.get(key)
      if (existing !== undefined) {
        await this.globalState.update(key, undefined)
        console.log(`[idle_vibes] dropped legacy globalState key: ${key}`)
      }
    }
  }
}
