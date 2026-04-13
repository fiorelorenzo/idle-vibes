import * as vscode from 'vscode'
import type { GameState, PrestigeData } from '@idle-vibes/shared'
import { GitHubAuth, type GitHubIdentity } from './github-auth'

const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export interface CloudSavePayload {
  colony: GameState['colony']
  prestige: PrestigeData
  totalXp: number
  awakened: boolean
  savedAt: number
}

export interface SyncStatus {
  enabled: boolean
  authenticated: boolean
  identity: GitHubIdentity | null
  lastSyncAt: number | null
  syncing: boolean
}

/**
 * Handles cloud save/load via the Cloudflare Worker API.
 * Sync is opt-in and runs on a 5-minute timer.
 */
export class CloudSyncService implements vscode.Disposable {
  readonly auth: GitHubAuth
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private lastSyncAt: number | null = null
  private syncing = false
  private apiUrl: string
  private readonly disposables: vscode.Disposable[] = []

  private readonly _onDidSync = new vscode.EventEmitter<void>()
  readonly onDidSync = this._onDidSync.event

  private readonly _onSyncError = new vscode.EventEmitter<string>()
  readonly onSyncError = this._onSyncError.event

  /** Incremented by the game engine to track sync count in perf stats */
  syncCount = 0

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
    this.auth = new GitHubAuth()
    this.disposables.push(this.auth, this._onDidSync, this._onSyncError)
  }

  /** Enable cloud sync: authenticate and start the sync timer. */
  async enable(): Promise<boolean> {
    const identity = await this.auth.tryRestore() ?? await this.auth.signIn()
    if (!identity) return false
    this.startTimer()
    return true
  }

  /** Disable cloud sync: stop timer (does not sign out). */
  disable(): void {
    this.stopTimer()
  }

  /** Upload the current game state to the cloud. */
  async save(state: GameState): Promise<boolean> {
    const token = this.auth.getToken()
    if (!token) return false

    const payload: CloudSavePayload = {
      colony: state.colony,
      prestige: state.prestige,
      totalXp: state.totalXp,
      awakened: state.awakened,
      savedAt: Date.now(),
    }

    this.syncing = true
    try {
      const res = await fetch(`${this.apiUrl}/saves`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        this._onSyncError.fire(`Cloud save failed: ${res.status}`)
        return false
      }

      this.lastSyncAt = Date.now()
      this.syncCount++
      this._onDidSync.fire()
      return true
    } catch (err) {
      this._onSyncError.fire(`Cloud save failed: ${err instanceof Error ? err.message : 'network error'}`)
      return false
    } finally {
      this.syncing = false
    }
  }

  /** Load game state from the cloud. Returns null if no save exists. */
  async load(): Promise<CloudSavePayload | null> {
    const token = this.auth.getToken()
    if (!token) return null

    try {
      const res = await fetch(`${this.apiUrl}/saves`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (res.status === 404) return null
      if (!res.ok) {
        this._onSyncError.fire(`Cloud load failed: ${res.status}`)
        return null
      }

      return (await res.json()) as CloudSavePayload
    } catch (err) {
      this._onSyncError.fire(`Cloud load failed: ${err instanceof Error ? err.message : 'network error'}`)
      return null
    }
  }

  getStatus(): SyncStatus {
    return {
      enabled: this.syncTimer !== null,
      authenticated: this.auth.isAuthenticated(),
      identity: this.auth.getIdentity(),
      lastSyncAt: this.lastSyncAt,
      syncing: this.syncing,
    }
  }

  private startTimer(): void {
    this.stopTimer()
    this.syncTimer = setInterval(() => {
      this._onDidSync.fire() // GameEngine listens and calls save()
    }, SYNC_INTERVAL_MS)
  }

  private stopTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  dispose(): void {
    this.stopTimer()
    this.disposables.forEach((d) => d.dispose())
  }
}
