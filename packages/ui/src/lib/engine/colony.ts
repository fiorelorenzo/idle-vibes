import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { GameState, Building, Proxy, Glitch, MiningBlock } from '@idle-vibes/shared'
import { VIBE_STATES } from '@idle-vibes/shared'
import { TILE_SIZE, COLONY_COLORS } from './constants'
import { createProxySprite, updateProxySprite } from './sprites/proxy-sprites'
import { createBuildingSprite, updateBuildingSprite } from './sprites/building-sprites'
import { createGlitchSprite } from './sprites/glitch-sprites'
import { renderMapTiles } from './sprites/map-tiles'
import { renderMapDecorations } from './sprites/map-decorations'
import { AnimationManager } from './animation/animation-manager'
import { registerProxyAnimations, registerGlitchAnimations, registerBuildingAnimations } from './animation/entity-animations'
import { ParticlePool } from './effects/particle-system'
import { ScreenEffects } from './effects/screen-effects'
import { EffectTriggers } from './effects/effect-triggers'

/**
 * PixiJS rendering layer for the colony view.
 * Uses entity pooling for persistent display objects + animations.
 */
export class ColonyRenderer {
  private app: Application | null = null
  private mapContainer = new Container()
  private mapDecoContainer = new Container()
  private entityContainer = new Container()
  private ambientOverlay = new Graphics()
  private particleContainer = new Container()

  // Entity pools — persistent display objects keyed by entity ID
  private proxyPool = new Map<string, Container>()
  private buildingPool = new Map<string, Container>()
  private glitchPool = new Map<string, Container>()

  // State tracking for diffing
  private currentState: GameState | null = null
  private previousState: GameState | null = null
  private lastMapRef: unknown = null

  // Systems
  private animationManager: AnimationManager | null = null
  private particlePool: ParticlePool | null = null
  private screenEffects: ScreenEffects | null = null
  private effectTriggers: EffectTriggers | null = null

  async init(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    this.app = new Application()
    await this.app.init({
      canvas,
      width,
      height,
      backgroundColor: COLONY_COLORS.background,
      antialias: false,
      resolution: 1,
    })

    this.app.stage.addChild(this.mapContainer)
    this.app.stage.addChild(this.mapDecoContainer)
    this.app.stage.addChild(this.entityContainer)
    this.app.stage.addChild(this.ambientOverlay)
    this.app.stage.addChild(this.particleContainer)

    // Init animation system
    this.animationManager = new AnimationManager()
    this.app.ticker.add((ticker) => {
      this.animationManager!.update(ticker.deltaMS)
      this.particlePool?.update(ticker.deltaMS)
    })

    // Init effects
    this.particlePool = new ParticlePool(this.particleContainer, 64)
    this.screenEffects = new ScreenEffects(this.app)
    this.effectTriggers = new EffectTriggers(
      this.particlePool,
      this.screenEffects,
      this.animationManager,
    )
  }

  updateState(state: GameState): void {
    this.previousState = this.currentState
    this.currentState = state
    this.render()
  }

  setFPS(fps: number): void {
    if (this.app) {
      this.app.ticker.maxFPS = fps
    }
  }

  getEffectTriggers(): EffectTriggers | null {
    return this.effectTriggers
  }

  destroy(): void {
    this.animationManager?.destroy()
    this.proxyPool.clear()
    this.buildingPool.clear()
    this.glitchPool.clear()
    this.app?.destroy(true)
    this.app = null
  }

  private render(): void {
    if (!this.currentState || !this.app) return

    this.renderMap()
    this.syncEntities()
    this.renderAmbientGlow()
    this.detectAndTriggerEffects()
  }

  // --- Map rendering (only re-renders when map reference changes) ---

  private renderMap(): void {
    const state = this.currentState!
    const map = state.colony.miningMap

    if (map === this.lastMapRef) return
    this.lastMapRef = map

    this.mapContainer.removeChildren()
    this.mapDecoContainer.removeChildren()

    const mapGraphics = renderMapTiles(map)
    this.mapContainer.addChild(mapGraphics)

    const decoGraphics = renderMapDecorations(map)
    this.mapDecoContainer.addChild(decoGraphics)
  }

  // --- Entity syncing with pooling ---

  private syncEntities(): void {
    const state = this.currentState!
    const vibeState = state.colony.vibe.stateName

    // Sync buildings
    const activeBuildingIds = new Set<string>()
    for (const building of state.colony.buildings) {
      activeBuildingIds.add(building.instanceId)
      let container = this.buildingPool.get(building.instanceId)

      if (!container) {
        container = createBuildingSprite(building)
        this.buildingPool.set(building.instanceId, container)
        this.entityContainer.addChild(container)
        registerBuildingAnimations(building, container, this.animationManager!)
      } else {
        updateBuildingSprite(container, building)
      }

      container.x = building.position.x * TILE_SIZE
      container.y = building.position.y * TILE_SIZE
    }
    // Remove destroyed buildings
    for (const [id, container] of this.buildingPool) {
      if (!activeBuildingIds.has(id)) {
        this.animationManager?.stopAll(id)
        this.entityContainer.removeChild(container)
        container.destroy()
        this.buildingPool.delete(id)
      }
    }

    // Sync proxies
    const activeProxyIds = new Set<string>()
    for (const proxy of state.colony.proxies) {
      activeProxyIds.add(proxy.id)
      let container = this.proxyPool.get(proxy.id)

      if (!container) {
        container = createProxySprite(proxy, vibeState)
        this.proxyPool.set(proxy.id, container)
        this.entityContainer.addChild(container)
        registerProxyAnimations(proxy, container, this.animationManager!)
      } else {
        updateProxySprite(container, proxy, vibeState)
      }

      // Tween position if moved (animation handles the actual movement)
      const targetX = proxy.position.x * TILE_SIZE
      const targetY = proxy.position.y * TILE_SIZE
      if (container.x !== targetX || container.y !== targetY) {
        if (container.x === 0 && container.y === 0) {
          // First placement — snap
          container.x = targetX
          container.y = targetY
        } else {
          // Walk tween
          this.animationManager?.animate(`${proxy.id}_walk`, {
            duration: 300,
            easing: 'easeInOut',
            onUpdate: (progress) => {
              const startX = container!.x
              const startY = container!.y
              // Store start positions on first frame
              if (progress === 0) {
                (container as any)._walkStartX = startX;
                (container as any)._walkStartY = startY
              }
              const sx = (container as any)._walkStartX ?? startX
              const sy = (container as any)._walkStartY ?? startY
              container!.x = sx + (targetX - sx) * progress
              container!.y = sy + (targetY - sy) * progress
            },
          })
        }
      }
    }
    // Remove destroyed proxies
    for (const [id, container] of this.proxyPool) {
      if (!activeProxyIds.has(id)) {
        this.animationManager?.stopAll(id)
        this.entityContainer.removeChild(container)
        container.destroy()
        this.proxyPool.delete(id)
      }
    }

    // Sync glitches
    const activeGlitchIds = new Set<string>()
    for (const glitch of state.colony.glitches) {
      activeGlitchIds.add(glitch.id)
      let container = this.glitchPool.get(glitch.id)

      if (!container) {
        container = createGlitchSprite(glitch)
        this.glitchPool.set(glitch.id, container)
        this.entityContainer.addChild(container)
        registerGlitchAnimations(glitch, container, this.animationManager!)
      }

      container.x = glitch.position.x * TILE_SIZE
      container.y = glitch.position.y * TILE_SIZE
    }
    // Remove destroyed glitches
    for (const [id, container] of this.glitchPool) {
      if (!activeGlitchIds.has(id)) {
        this.animationManager?.stopAll(id)
        this.entityContainer.removeChild(container)
        container.destroy()
        this.glitchPool.delete(id)
      }
    }
  }

  // --- Ambient glow (persistent overlay, transitions smoothly) ---

  private renderAmbientGlow(): void {
    if (!this.currentState || !this.app) return
    const vibeState = VIBE_STATES[this.currentState.colony.vibe.stateName]
    const color = parseInt(vibeState.ambientColor.replace('#', ''), 16)

    this.ambientOverlay.clear()
    const w = this.app.screen.width
    const h = this.app.screen.height
    this.ambientOverlay.rect(0, 0, w, h)
    this.ambientOverlay.fill({ color, alpha: 0.15 })
  }

  // --- Detect game events and trigger effects ---

  private detectAndTriggerEffects(): void {
    if (!this.previousState || !this.currentState || !this.effectTriggers) return

    const prev = this.previousState
    const curr = this.currentState

    // Vibe state change
    if (prev.colony.vibe.stateName !== curr.colony.vibe.stateName) {
      const fromColor = parseInt(VIBE_STATES[prev.colony.vibe.stateName].ambientColor.replace('#', ''), 16)
      const toColor = parseInt(VIBE_STATES[curr.colony.vibe.stateName].ambientColor.replace('#', ''), 16)
      this.effectTriggers.onVibeStateChange(curr.colony.vibe.stateName, fromColor, toColor)
    }

    // New glitches spawned
    const prevGlitchIds = new Set(prev.colony.glitches.map(g => g.id))
    for (const glitch of curr.colony.glitches) {
      if (!prevGlitchIds.has(glitch.id)) {
        this.effectTriggers.onGlitchSpawn(glitch)
      }
    }

    // Glitches removed
    const currGlitchIds = new Set(curr.colony.glitches.map(g => g.id))
    for (const glitch of prev.colony.glitches) {
      if (!currGlitchIds.has(glitch.id)) {
        this.effectTriggers.onGlitchRemoved(glitch)
      }
    }

    // New buildings placed
    const prevBuildingIds = new Set(prev.colony.buildings.map(b => b.instanceId))
    for (const building of curr.colony.buildings) {
      if (!prevBuildingIds.has(building.instanceId)) {
        this.effectTriggers.onBuildingPlaced(building)
      }
    }

    // Proxy became glitched
    const prevProxyStates = new Map(prev.colony.proxies.map(p => [p.id, p.state]))
    for (const proxy of curr.colony.proxies) {
      const prevState = prevProxyStates.get(proxy.id)
      if (prevState && prevState !== 'glitched' && proxy.state === 'glitched') {
        this.effectTriggers.onProxyGlitched(proxy)
      }
    }
  }
}
