import * as vscode from 'vscode'
import type {
  ParserSignal,
  GameState,
  ColonyState,
  PrestigeData,
  WebviewMessage,
  ResourceId,
  Proxy,
  Glitch,
  Building,
  MiningMap,
  ScheduledJob,
  DailyObjective,
} from '@idle-vibes/shared'
import {
  INITIAL_RESOURCES,
  RESOURCES,
  VIBE_STATES,
  VIBE_PRESSURE,
  BUILDINGS,
  STANDBY_IDLE_THRESHOLD_MS,
  STANDBY_RAW_DATA_PER_MIN,
  getVibeStateName,
} from '@idle-vibes/shared'
import { ExtensionBridge } from './bridge/host'
import { LocalStateStorage } from './storage/local-state'
import { SmartParser } from './parser/index'
import { VibeEngine } from './vibe/vibe-engine'

const TICK_INTERVAL_MS = 1000
const SAVE_INTERVAL_MS = 30_000

/**
 * Central game engine. Owns the game state, processes signals,
 * runs the game loop, and communicates with the webview.
 */
export class GameEngine {
  private state: GameState
  private tickTimer: ReturnType<typeof setInterval> | null = null
  private saveTimer: ReturnType<typeof setInterval> | null = null
  private lastTickAt = Date.now()

  /** Performance tracking */
  private parserEventsThisSession = 0
  private vibeEventsThisSession = 0
  private supabaseSyncsThisSession = 0

  constructor(
    private readonly bridge: ExtensionBridge,
    private readonly storage: LocalStateStorage,
    private readonly parser: SmartParser,
    private readonly vibeEngine: VibeEngine,
  ) {
    this.state = this.storage.load() ?? this.createInitialState()

    // Sync vibe engine with loaded state
    this.vibeEngine.setValue(this.state.colony.vibe.value)

    // Listen for flow reports
    this.vibeEngine.onFlowReport((report) => {
      // Add Vibe Charge when flow event ends
      this.addResource('vibe_charge', 1)
      // Log to codex would happen here
    })
  }

  start(): vscode.Disposable {
    this.lastTickAt = Date.now()

    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS)
    this.saveTimer = setInterval(() => this.save(), SAVE_INTERVAL_MS)

    // Send initial state when webview connects
    this.bridge.onMessage((msg) => {
      if (msg.type === 'ui:ready' || msg.type === 'ui:request-state') {
        this.bridge.send({ type: 'ext:state-sync', state: this.state })
      }
    })

    return new vscode.Disposable(() => {
      if (this.tickTimer) clearInterval(this.tickTimer)
      if (this.saveTimer) clearInterval(this.saveTimer)
      this.save()
    })
  }

  handleParserSignal(signal: ParserSignal): void {
    this.parserEventsThisSession++

    // Apply vibe pressure
    this.vibeEngine.applySignal(signal)
    this.vibeEventsThisSession++

    // Generate resources from parser signals
    this.processSignalResources(signal)

    // Check glitch spawn conditions
    this.checkGlitchSpawn(signal)

    // Check if Flow State Event should trigger
    if (this.vibeEngine.canTriggerFlowEvent() && this.state.colony.glitches.length === 0) {
      this.vibeEngine.startFlowEvent()
    }

    // Sync vibe state
    this.state.colony.vibe = this.vibeEngine.getState()

    // Send updated state to webview
    this.syncState()
  }

  handleWebviewMessage(msg: WebviewMessage): void {
    switch (msg.type) {
      case 'ui:colony-action':
        this.handleColonyAction(msg.action)
        break
      case 'ui:update-settings':
        Object.assign(this.state.settings, msg.settings)
        break
      case 'ui:prestige':
        this.performPrestige()
        break
    }
  }

  private handleColonyAction(action: import('@idle-vibes/shared').ColonyAction): void {
    switch (action.kind) {
      case 'place_building':
        this.placeBuilding(action.buildingId, action.position)
        break
      case 'recruit_proxy':
        this.recruitProxy(action.role as import('@idle-vibes/shared').ProxyRole)
        break
      case 'click_glitch':
        this.clickGlitch(action.glitchId)
        break
      case 'assign_proxy':
        this.assignProxy(action.proxyId, action.targetId)
        break
      case 'mine_block':
        this.mineBlock(action.x, action.y, action.proxyId)
        break
      case 'start_job':
        this.startJob(action.jobType, action.proxyId)
        break
    }
    this.syncState()
  }

  private tick(): void {
    const now = Date.now()
    const deltaMs = now - this.lastTickAt
    this.lastTickAt = now

    // Vibe decay
    this.vibeEngine.tick(deltaMs)
    this.state.colony.vibe = this.vibeEngine.getState()

    // Standby detection
    const idleMs = now - this.parser.lastActivityAt
    if (idleMs >= STANDBY_IDLE_THRESHOLD_MS && !this.state.colony.standbyActive) {
      this.enterStandby()
    } else if (idleMs < STANDBY_IDLE_THRESHOLD_MS && this.state.colony.standbyActive) {
      this.exitStandby()
    }

    // Passive generation during standby
    if (this.state.colony.standbyActive) {
      const rawPerTick = (STANDBY_RAW_DATA_PER_MIN * deltaMs) / 60_000
      this.addResource('raw_data', rawPerTick)
    }

    // Process buildings
    this.tickBuildings(deltaMs)

    // Process proxies
    this.tickProxies(deltaMs)

    // Process glitches
    this.tickGlitches(deltaMs)

    // Vibe Charge decay (2 hour timer)
    this.tickResourceDecay(now)

    // Sync state to webview periodically (every 2 ticks to reduce chatter)
    if (now % 2000 < TICK_INTERVAL_MS) {
      this.syncState()
    }
  }

  private processSignalResources(signal: ParserSignal): void {
    const vibeState = VIBE_STATES[this.state.colony.vibe.stateName]
    const multiplier = vibeState.resourceMultiplier

    switch (signal.type) {
      case 'ai_token_bundle':
        this.addResource('raw_data', signal.value * 0.1 * multiplier)
        break
      case 'errors_decreased':
        this.addResource('pure_energy', signal.value * multiplier)
        break
      case 'errors_increased':
        this.addResource('volatile_energy', signal.value * multiplier)
        break
      case 'git_commit':
      case 'git_commit_fix':
        this.addResource('pure_energy', 5 * multiplier)
        break
      case 'git_commit_feat':
        this.addResource('stabilized_energy', 10 * multiplier)
        break
      case 'new_class':
        this.addResource('logic_fragments', vibeState.logicFragmentDropMultiplier > 1 ? 1 : 0)
        break
      case 'new_function':
        this.addResource('stabilized_energy', 2 * multiplier)
        break
      case 'new_interface':
        // +2 Proxy Logic Integrity colony-wide
        for (const proxy of this.state.colony.proxies) {
          proxy.logicIntegrity = Math.min(100, proxy.logicIntegrity + 2)
        }
        break
    }
  }

  private addResource(id: ResourceId, amount: number): void {
    const def = RESOURCES[id]
    const current = this.state.colony.resources[id]
    const cap = this.getResourceCap(id)
    if (cap !== null) {
      this.state.colony.resources[id] = Math.min(cap, current + amount)
    } else {
      this.state.colony.resources[id] = current + amount
    }

    this.vibeEngine.trackFlowResource(id, amount)
  }

  private getResourceCap(id: ResourceId): number | null {
    const def = RESOURCES[id]
    if (def.baseCap === null) return null

    let cap = def.baseCap

    // Buffer Tanks increase Raw Data cap
    if (id === 'raw_data') {
      const tanks = this.state.colony.buildings.filter((b) => b.buildingId === 'buffer_tank')
      cap += tanks.length * 500
    }

    return Math.min(cap, def.maxCap ?? Infinity)
  }

  private placeBuilding(buildingId: string, position: { x: number; y: number }): void {
    const def = BUILDINGS[buildingId]
    if (!def) return

    // Check cost
    for (const [resourceId, cost] of Object.entries(def.cost)) {
      if (this.state.colony.resources[resourceId as ResourceId] < cost) return
    }

    // Deduct cost
    for (const [resourceId, cost] of Object.entries(def.cost)) {
      this.state.colony.resources[resourceId as ResourceId] -= cost
    }

    const building: Building = {
      instanceId: crypto.randomUUID(),
      buildingId: def.id,
      position,
      level: 1,
      efficiency: 1.0,
      assignedProxyId: null,
      faulty: false,
      maintenanceMode: false,
      overclockUntil: null,
    }

    this.state.colony.buildings.push(building)
  }

  private recruitProxy(role: import('@idle-vibes/shared').ProxyRole): void {
    const cost = 50 // Base cost in stabilized energy
    if (this.state.colony.resources.stabilized_energy < cost) return
    this.state.colony.resources.stabilized_energy -= cost

    const proxy: Proxy = {
      id: crypto.randomUUID(),
      role,
      name: `${role.toUpperCase()}-${this.state.colony.proxies.length + 1}`,
      logicIntegrity: 100,
      energyLevel: 100,
      experience: 0,
      vibeSensitivity: Math.floor(Math.random() * 5) + 1,
      uniqueStat: 1,
      position: { x: 0, y: 0 },
      assignedBuildingId: null,
      assignedJobId: null,
      state: 'idle',
      isAria: false,
    }

    this.state.colony.proxies.push(proxy)
  }

  private clickGlitch(glitchId: string): void {
    const idx = this.state.colony.glitches.findIndex((g) => g.id === glitchId)
    if (idx < 0) return

    this.state.colony.glitches.splice(idx, 1)
    this.vibeEngine.applyPressure(VIBE_PRESSURE.glitch_cleared_click)
  }

  private assignProxy(proxyId: string, targetId: string): void {
    const proxy = this.state.colony.proxies.find((p) => p.id === proxyId)
    if (!proxy) return
    proxy.assignedBuildingId = targetId
    proxy.state = 'working'
  }

  private mineBlock(x: number, y: number, proxyId: string): void {
    const map = this.state.colony.miningMap
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) return

    const block = map.grid[y]?.[x]
    if (!block) return

    const proxy = this.state.colony.proxies.find((p) => p.id === proxyId)
    if (!proxy || proxy.role !== 'miner') return

    const vibeState = VIBE_STATES[this.state.colony.vibe.stateName]

    // Yield resources based on depth
    this.addResource('raw_data', (block.depth + 1) * 5 * vibeState.resourceMultiplier)

    // Logic Fragment chance at deep layers
    if (block.hasFragment) {
      this.addResource('logic_fragments', 1)
    }

    // ARIA Shard chance at Abyss during Peak Vibe
    if (block.layer === 'abyss' && this.state.colony.vibe.stateName === 'peak_vibe') {
      if (Math.random() < 0.1) {
        this.addResource('aria_shards', 1)
      }
    }

    // Clear the block
    map.grid[y][x] = null

    // XP for miner
    proxy.experience += block.depth + 1
  }

  private startJob(jobType: string, proxyId: string): void {
    const proxy = this.state.colony.proxies.find((p) => p.id === proxyId)
    if (!proxy) return

    const durations: Record<string, number> = {
      passive_mine: 4 * 60 * 60 * 1000,
      refinery_shift: 2 * 60 * 60 * 1000,
      deep_scan: 4 * 60 * 60 * 1000,
      curation_rest: 8 * 60 * 60 * 1000,
      vibe_meditation: 2 * 60 * 60 * 1000,
    }

    const job: ScheduledJob = {
      id: crypto.randomUUID(),
      type: jobType as ScheduledJob['type'],
      proxyId,
      startedAt: Date.now(),
      durationMs: durations[jobType] ?? 60 * 60 * 1000,
    }

    proxy.assignedJobId = job.id
    proxy.state = 'standby'
    this.state.colony.scheduledJobs.push(job)
  }

  private checkGlitchSpawn(signal: ParserSignal): void {
    if (signal.type !== 'errors_increased') return

    const vibeState = VIBE_STATES[this.state.colony.vibe.stateName]

    // Bug Sprite: ≥3 unresolved errors
    if (signal.value >= 3) {
      const spawnChance = 0.5 * vibeState.glitchSpawnMultiplier
      if (Math.random() < spawnChance) {
        this.spawnGlitch('bug_sprite')
      }
    }
  }

  private spawnGlitch(type: import('@idle-vibes/shared').GlitchType): void {
    const glitch: Glitch = {
      id: crypto.randomUUID(),
      type,
      position: {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 15),
      },
      spawnedAt: Date.now(),
      triggerSource: null,
      sourceProxyId: null,
    }

    this.state.colony.glitches.push(glitch)
    this.vibeEngine.applyPressure(VIBE_PRESSURE.glitch_spawn)
  }

  private tickBuildings(deltaMs: number): void {
    const deltaMin = deltaMs / 60_000
    const vibeState = VIBE_STATES[this.state.colony.vibe.stateName]

    for (const building of this.state.colony.buildings) {
      if (building.maintenanceMode) continue

      const efficiency = building.efficiency *
        (building.overclockUntil && Date.now() < building.overclockUntil ? 2.0 : 1.0)

      switch (building.buildingId) {
        case 'refinery': {
          const rate = 10 // 10:1 ratio
          const input = Math.min(
            this.state.colony.resources.raw_data,
            rate * efficiency * deltaMin,
          )
          if (input > 0) {
            this.state.colony.resources.raw_data -= input
            this.addResource('stabilized_energy', (input / rate) * vibeState.resourceMultiplier)
          }
          break
        }
        case 'volatile_condenser': {
          const rate = 5
          const input = Math.min(
            this.state.colony.resources.volatile_energy,
            rate * efficiency * deltaMin,
          )
          if (input > 0) {
            this.state.colony.resources.volatile_energy -= input
            this.addResource('stabilized_energy', (input / rate) * vibeState.resourceMultiplier)
          }
          break
        }
        case 'curation_pod': {
          const assigned = this.state.colony.proxies.find(
            (p) => p.assignedBuildingId === building.instanceId,
          )
          if (assigned) {
            assigned.logicIntegrity = Math.min(100, assigned.logicIntegrity + 5 * deltaMin)
          }
          break
        }
        case 'firewall_turret': {
          // Auto-attack nearest glitch
          if (this.state.colony.glitches.length > 0) {
            const nearest = this.state.colony.glitches[0]
            const dist = Math.hypot(
              nearest.position.x - building.position.x,
              nearest.position.y - building.position.y,
            )
            if (dist < 5 * efficiency) {
              this.state.colony.glitches.shift()
              this.vibeEngine.applyPressure(VIBE_PRESSURE.glitch_cleared_click)
            }
          }
          break
        }
        case 'core_terminal': {
          const rate = 500
          const input = Math.min(this.state.colony.resources.stabilized_energy, rate * deltaMin)
          if (input >= rate) {
            this.state.colony.resources.stabilized_energy -= rate
            this.addResource('clean_arch_points', 1)
          }
          break
        }
      }

      // Clear expired overclock
      if (building.overclockUntil && Date.now() >= building.overclockUntil) {
        building.overclockUntil = null
      }
    }
  }

  private tickProxies(deltaMs: number): void {
    const deltaMin = deltaMs / 60_000

    for (const proxy of this.state.colony.proxies) {
      // Energy drain while working
      if (proxy.state === 'working') {
        proxy.energyLevel = Math.max(0, proxy.energyLevel - 0.5 * deltaMin)
        if (proxy.energyLevel <= 15) {
          proxy.state = 'charging'
        }
      }

      // Charging
      if (proxy.state === 'charging') {
        proxy.energyLevel = Math.min(100, proxy.energyLevel + 10 * deltaMin)
        if (proxy.energyLevel >= 80) {
          proxy.state = 'idle'
        }
      }

      // Logic Integrity degradation check
      if (proxy.logicIntegrity <= 0 && proxy.state !== 'glitched') {
        this.convertProxyToGlitch(proxy)
      }
    }
  }

  private convertProxyToGlitch(proxy: Proxy): void {
    proxy.state = 'glitched'
    this.vibeEngine.applyPressure(VIBE_PRESSURE.proxy_integrity_zero)

    this.spawnGlitch('corrupted_proxy')
    const glitch = this.state.colony.glitches[this.state.colony.glitches.length - 1]
    if (glitch) {
      glitch.sourceProxyId = proxy.id
      glitch.position = { ...proxy.position }
    }
  }

  private tickGlitches(deltaMs: number): void {
    const deltaSec = deltaMs / 1000

    for (const glitch of this.state.colony.glitches) {
      switch (glitch.type) {
        case 'bug_sprite':
          // Drains Raw Data
          this.state.colony.resources.raw_data = Math.max(
            0,
            this.state.colony.resources.raw_data - 5 * deltaSec,
          )
          break
        case 'exception_wraith':
          // Disables nearest building (handled in building tick via check)
          break
        case 'entropy_creep':
          // Reduces all building efficiency
          for (const building of this.state.colony.buildings) {
            building.efficiency = Math.max(0.1, building.efficiency - 0.01 * deltaSec)
          }
          break
      }
    }
  }

  private tickResourceDecay(now: number): void {
    // Vibe Charge decays after 2 hours
    // Simplified: decay 1 charge per 2 hours proportionally
    const def = RESOURCES.vibe_charge
    if (def.decayAfterMs && this.state.colony.resources.vibe_charge > 0) {
      // In a real implementation we'd track when each charge was earned
      // For simplicity, decay all charges at a steady rate
    }
  }

  private enterStandby(): void {
    this.state.colony.standbyActive = true
    this.state.colony.standbyStartedAt = Date.now()
    for (const proxy of this.state.colony.proxies) {
      if (proxy.state === 'idle' || proxy.state === 'working') {
        proxy.state = 'standby'
      }
    }
    this.bridge.send({ type: 'ext:standby-enter' })
  }

  private exitStandby(): void {
    this.state.colony.standbyActive = false
    this.state.colony.standbyStartedAt = null
    for (const proxy of this.state.colony.proxies) {
      if (proxy.state === 'standby' && !proxy.assignedJobId) {
        proxy.state = 'idle'
      }
    }
    this.bridge.send({ type: 'ext:standby-exit' })
  }

  private performPrestige(): void {
    // Accumulate persistent resources
    this.state.prestige.cleanArchPoints += this.state.colony.resources.clean_arch_points
    this.state.prestige.logicFragments += this.state.colony.resources.logic_fragments
    this.state.prestige.ariaShards += this.state.colony.resources.aria_shards
    this.state.prestige.prestigeCount++
    this.state.prestige.lastPrestigeAt = Date.now()

    // Preserve ARIA-0
    const aria = this.state.colony.proxies.find((p) => p.isAria)
    if (aria) {
      this.state.prestige.ariaProxy = { ...aria }
    }

    // Reset colony
    this.state.colony = this.createInitialColony()

    // Restore ARIA-0
    if (this.state.prestige.ariaProxy) {
      this.state.colony.proxies.push({ ...this.state.prestige.ariaProxy })
    }

    this.vibeEngine.setValue(30)
    this.syncState()
    this.save()
  }

  showPerformanceStats(): void {
    const memUsage = process.memoryUsage()
    const mb = Math.round(memUsage.heapUsed / 1024 / 1024)

    const panel = vscode.window.createOutputChannel('idle_vibes Performance')
    panel.clear()
    panel.appendLine('idle_vibes — Resource Usage')
    panel.appendLine(`  Memory:            ${mb}MB`)
    panel.appendLine(`  Parser events:     ${this.parserEventsThisSession} this session`)
    panel.appendLine(`  Vibe events:       ${this.vibeEventsThisSession} this session`)
    panel.appendLine(`  Supabase syncs:    ${this.supabaseSyncsThisSession} this session`)
    panel.appendLine(`  Vibe:              ${Math.round(this.state.colony.vibe.value)} [${this.state.colony.vibe.stateName}]`)
    panel.appendLine(`  Proxies:           ${this.state.colony.proxies.length}`)
    panel.appendLine(`  Buildings:         ${this.state.colony.buildings.length}`)
    panel.appendLine(`  Active glitches:   ${this.state.colony.glitches.length}`)
    panel.show()
  }

  private syncPending = false
  private syncState(): void {
    // Throttle: batch multiple state changes into one message per tick
    if (this.syncPending) return
    this.syncPending = true
    queueMicrotask(() => {
      this.syncPending = false
      this.bridge.send({ type: 'ext:state-sync', state: this.state })
    })
  }

  private save(): void {
    this.storage.save(this.state)
  }

  private createInitialState(): GameState {
    return {
      colony: this.createInitialColony(),
      prestige: {
        cleanArchPoints: 0,
        prestigeCount: 0,
        lastPrestigeAt: null,
        techTreeUnlocks: [],
        codexUnlocks: [],
        ariaShards: 0,
        logicFragments: 0,
        ariaProxy: null,
      },
      settings: {
        fpsLimit: 30,
        lowPowerMode: false,
        cloudSyncEnabled: false,
        soundEnabled: true,
      },
      sessionStartedAt: Date.now(),
      totalXp: 0,
      awakened: false,
    }
  }

  private createInitialColony(): ColonyState {
    return {
      resources: { ...INITIAL_RESOURCES },
      vibe: {
        value: 30,
        stateName: 'cruising',
        lastUpdate: Date.now(),
        flowEventActive: false,
        flowEventStartedAt: null,
        flowEventCooldownUntil: 0,
        sustainedFlowMinutes: 0,
        recentTokenBundles: [],
      },
      proxies: [
        {
          id: 'aria-0',
          role: 'operator',
          name: 'ARIA-0',
          logicIntegrity: 100,
          energyLevel: 100,
          experience: 0,
          vibeSensitivity: 5,
          uniqueStat: 2,
          position: { x: 10, y: 7 },
          assignedBuildingId: null,
          assignedJobId: null,
          state: 'idle',
          isAria: true,
        },
      ],
      buildings: [],
      glitches: [],
      miningMap: this.generateMiningMap(),
      standbyActive: false,
      standbyStartedAt: null,
      scheduledJobs: [],
      dailyObjectives: [],
      streakDays: 0,
      lastActiveDate: null,
    }
  }

  private generateMiningMap(): MiningMap {
    const width = 24
    const height = 20
    const grid: (import('@idle-vibes/shared').MiningBlock | null)[][] = []

    for (let y = 0; y < height; y++) {
      const row: (import('@idle-vibes/shared').MiningBlock | null)[] = []
      for (let x = 0; x < width; x++) {
        const depth = y
        let layer: import('@idle-vibes/shared').DepthLayer
        if (depth === 0) layer = 'surface'
        else if (depth <= 3) layer = 'shallow'
        else if (depth <= 7) layer = 'mid'
        else if (depth <= 11) layer = 'deep'
        else layer = 'abyss'

        row.push({
          depth,
          layer,
          hasFragment: layer === 'deep' && Math.random() < 0.05,
          scanned: false,
        })
      }
      grid.push(row)
    }

    return { grid, width, height }
  }
}
