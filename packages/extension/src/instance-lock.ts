import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * Coordinates multiple idle_vibes instances across VS Code windows.
 *
 * Problem: if the user has 3 VS Code windows open, each runs its own
 * extension instance with its own parser. Without coordination:
 * - Each instance writes to the same colony state → corruption
 * - The same git commit is counted 3 times
 * - AI activity in one window inflates the other colonies
 *
 * Solution: file-based leader election using a lock directory.
 *
 * - Each instance registers itself with a unique ID and its workspace paths
 * - One instance is the "leader" — it owns the colony state and processes
 *   all game logic
 * - Non-leader instances still run the parser, but forward signals to the
 *   leader via a shared signal file instead of processing them locally
 * - If the leader dies (stale heartbeat), another instance takes over
 *
 * The lock dir lives at ~/.idle-vibes/instances/
 */

const IDLE_VIBES_DIR = path.join(os.homedir(), '.idle-vibes')
const INSTANCES_DIR = path.join(IDLE_VIBES_DIR, 'instances')
const LEADER_FILE = path.join(IDLE_VIBES_DIR, 'leader')
const HEARTBEAT_INTERVAL_MS = 30_000
const HEARTBEAT_STALE_MS = 90_000

export interface InstanceInfo {
  id: string
  pid: number
  workspaceFolders: string[]
  startedAt: number
  heartbeat: number
}

export class InstanceLock {
  readonly instanceId: string
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private _isLeader = false

  constructor() {
    this.instanceId = `${process.pid}-${Date.now()}`
  }

  get isLeader(): boolean {
    return this._isLeader
  }

  /**
   * Register this instance and attempt to become leader.
   */
  start(): vscode.Disposable {
    this.ensureDir()
    this.register()
    this.tryBecomeLeader()

    this.heartbeatTimer = setInterval(() => {
      this.heartbeat()
      this.checkLeaderHealth()
    }, HEARTBEAT_INTERVAL_MS)

    return new vscode.Disposable(() => this.stop())
  }

  /**
   * Get all workspace paths monitored across ALL active instances.
   * Useful to detect if another instance is already monitoring a folder.
   */
  getActiveWorkspaces(): string[] {
    const instances = this.readAllInstances()
    const folders: string[] = []
    for (const inst of instances) {
      folders.push(...inst.workspaceFolders)
    }
    return [...new Set(folders)]
  }

  /**
   * Check if a specific workspace path is already monitored by another instance.
   */
  isWorkspaceMonitoredElsewhere(folderPath: string): boolean {
    const instances = this.readAllInstances()
    for (const inst of instances) {
      if (inst.id === this.instanceId) continue
      if (inst.workspaceFolders.includes(folderPath)) return true
    }
    return false
  }

  private ensureDir(): void {
    fs.mkdirSync(INSTANCES_DIR, { recursive: true })
  }

  private register(): void {
    const info: InstanceInfo = {
      id: this.instanceId,
      pid: process.pid,
      workspaceFolders: (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath),
      startedAt: Date.now(),
      heartbeat: Date.now(),
    }
    const filePath = path.join(INSTANCES_DIR, `${this.instanceId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(info, null, 2))
  }

  private heartbeat(): void {
    const filePath = path.join(INSTANCES_DIR, `${this.instanceId}.json`)
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const info: InstanceInfo = JSON.parse(raw)
      info.heartbeat = Date.now()
      info.workspaceFolders = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath)
      fs.writeFileSync(filePath, JSON.stringify(info, null, 2))
    } catch {
      this.register()
    }
  }

  private tryBecomeLeader(): void {
    try {
      const leaderId = this.readLeader()
      if (leaderId) {
        const leaderInfo = this.readInstance(leaderId)
        if (leaderInfo && !this.isStale(leaderInfo)) {
          this._isLeader = false
          return
        }
      }
    } catch {
      // No leader file or corrupted — take over
    }

    fs.writeFileSync(LEADER_FILE, this.instanceId)
    this._isLeader = true
    console.log(`[idle_vibes] This instance is now the colony leader (${this.instanceId})`)
  }

  private readInstance(instanceId: string): InstanceInfo | null {
    try {
      const raw = fs.readFileSync(path.join(INSTANCES_DIR, `${instanceId}.json`), 'utf-8')
      return JSON.parse(raw) as InstanceInfo
    } catch {
      return null
    }
  }

  private checkLeaderHealth(): void {
    if (this._isLeader) return

    const leaderId = this.readLeader()
    if (!leaderId) {
      this.tryBecomeLeader()
      return
    }

    // Check if the leader is still alive
    const leaderFile = path.join(INSTANCES_DIR, `${leaderId}.json`)
    try {
      const raw = fs.readFileSync(leaderFile, 'utf-8')
      const info: InstanceInfo = JSON.parse(raw)
      if (this.isStale(info)) {
        console.log(`[idle_vibes] Leader ${leaderId} is stale, taking over`)
        this.cleanupStaleInstance(leaderId)
        this.tryBecomeLeader()
      }
    } catch {
      this.tryBecomeLeader()
    }
  }

  private readLeader(): string | null {
    try {
      return fs.readFileSync(LEADER_FILE, 'utf-8').trim()
    } catch {
      return null
    }
  }

  private readAllInstances(): InstanceInfo[] {
    try {
      const files = fs.readdirSync(INSTANCES_DIR).filter((f) => f.endsWith('.json'))
      const instances: InstanceInfo[] = []
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(INSTANCES_DIR, file), 'utf-8')
          const info: InstanceInfo = JSON.parse(raw)
          if (!this.isStale(info)) {
            instances.push(info)
          } else {
            this.cleanupStaleInstance(info.id)
          }
        } catch {
          // Skip corrupted files
        }
      }
      return instances
    } catch {
      return []
    }
  }

  private isStale(info: InstanceInfo): boolean {
    return Date.now() - info.heartbeat > HEARTBEAT_STALE_MS
  }

  private cleanupStaleInstance(instanceId: string): void {
    try {
      fs.unlinkSync(path.join(INSTANCES_DIR, `${instanceId}.json`))
    } catch {
      // Already cleaned up
    }
  }

  private stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    // Unregister
    try {
      fs.unlinkSync(path.join(INSTANCES_DIR, `${this.instanceId}.json`))
    } catch {
      // ok
    }

    // If we were the leader, remove the leader file so another instance can take over
    if (this._isLeader) {
      try {
        const current = fs.readFileSync(LEADER_FILE, 'utf-8').trim()
        if (current === this.instanceId) {
          fs.unlinkSync(LEADER_FILE)
        }
      } catch {
        // ok
      }
    }
  }
}
