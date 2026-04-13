import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { GameState, Building, Proxy, Glitch, MiningBlock } from '@idle-vibes/shared'
import { VIBE_STATES } from '@idle-vibes/shared'

const TILE_SIZE = 16
const COLONY_COLORS = {
  background: 0x0a0a1a,
  grid: 0x1a1a2e,
  surface: 0x2a2a3e,
  shallow: 0x1e3a2e,
  mid: 0x2e2a1e,
  deep: 0x3e1a2a,
  abyss: 0x2a0a2a,
  mined: 0x060612,
  proxy: 0x00aaff,
  building: 0x00ff88,
  glitch: 0xff00ff,
}

/**
 * PixiJS rendering layer for the colony view.
 * Renders the mining map, proxies, buildings, and glitches.
 */
export class ColonyRenderer {
  private app: Application | null = null
  private mapContainer = new Container()
  private entityContainer = new Container()
  private currentState: GameState | null = null

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
    this.app.stage.addChild(this.entityContainer)
  }

  updateState(state: GameState): void {
    this.currentState = state
    this.render()
  }

  setFPS(fps: number): void {
    if (this.app) {
      this.app.ticker.maxFPS = fps
    }
  }

  destroy(): void {
    this.app?.destroy(true)
    this.app = null
  }

  private render(): void {
    if (!this.currentState || !this.app) return

    this.renderMap()
    this.renderEntities()
    this.renderAmbientGlow()
  }

  private renderMap(): void {
    this.mapContainer.removeChildren()
    const state = this.currentState!
    const map = state.colony.miningMap

    const g = new Graphics()

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const block = map.grid[y]?.[x]
        const color = block ? this.getBlockColor(block) : COLONY_COLORS.mined
        g.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1)
        g.fill(color)
      }
    }

    this.mapContainer.addChild(g)
  }

  private renderEntities(): void {
    this.entityContainer.removeChildren()
    const state = this.currentState!

    // Render buildings
    for (const building of state.colony.buildings) {
      this.renderBuilding(building)
    }

    // Render proxies
    for (const proxy of state.colony.proxies) {
      this.renderProxy(proxy)
    }

    // Render glitches
    for (const glitch of state.colony.glitches) {
      this.renderGlitch(glitch)
    }
  }

  private renderBuilding(building: Building): void {
    const g = new Graphics()
    const x = building.position.x * TILE_SIZE
    const y = building.position.y * TILE_SIZE

    g.rect(x, y, TILE_SIZE * 2 - 1, TILE_SIZE * 2 - 1)
    g.fill(building.faulty ? 0xff4444 : COLONY_COLORS.building)

    if (building.maintenanceMode) {
      g.rect(x, y, TILE_SIZE * 2 - 1, TILE_SIZE * 2 - 1)
      g.fill({ color: 0xffaa00, alpha: 0.3 })
    }

    this.entityContainer.addChild(g)

    // Building label
    const style = new TextStyle({ fontSize: 7, fill: 0xffffff, fontFamily: 'monospace' })
    const label = new Text({ text: building.buildingId.slice(0, 3).toUpperCase(), style })
    label.x = x + 2
    label.y = y + 2
    this.entityContainer.addChild(label)
  }

  private renderProxy(proxy: Proxy): void {
    const g = new Graphics()
    const x = proxy.position.x * TILE_SIZE
    const y = proxy.position.y * TILE_SIZE

    let color = COLONY_COLORS.proxy
    if (proxy.state === 'glitched') color = COLONY_COLORS.glitch
    else if (proxy.isAria) color = 0xffffff

    g.circle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 2 - 1)
    g.fill(color)

    this.entityContainer.addChild(g)

    // Proxy face
    const vibeState = this.currentState!.colony.vibe.stateName
    let face = '[^_^]'
    if (proxy.state === 'standby') face = '[z z]'
    else if (proxy.state === 'glitched') face = '[###]'
    else if (proxy.energyLevel < 15) face = '[-_-]'
    else if (proxy.logicIntegrity < 20) face = '[x_x]'
    else if (vibeState === 'peak_vibe') face = '[\u2726_\u2726]'
    else if (vibeState === 'flow_state') face = '[*_*]'

    const style = new TextStyle({ fontSize: 6, fill: 0xffffff, fontFamily: 'monospace' })
    const text = new Text({ text: face, style })
    text.x = x - 4
    text.y = y - 8
    this.entityContainer.addChild(text)
  }

  private renderGlitch(glitch: Glitch): void {
    const g = new Graphics()
    const x = glitch.position.x * TILE_SIZE
    const y = glitch.position.y * TILE_SIZE

    // Glitch: flickering diamond shape
    const cx = x + TILE_SIZE / 2
    const cy = y + TILE_SIZE / 2
    const size = TILE_SIZE / 2

    g.moveTo(cx, cy - size)
    g.lineTo(cx + size, cy)
    g.lineTo(cx, cy + size)
    g.lineTo(cx - size, cy)
    g.closePath()
    g.fill(COLONY_COLORS.glitch)

    this.entityContainer.addChild(g)
  }

  private renderAmbientGlow(): void {
    if (!this.currentState || !this.app) return
    const vibeState = VIBE_STATES[this.currentState.colony.vibe.stateName]
    const color = parseInt(vibeState.ambientColor.replace('#', ''), 16)

    // Apply as a semi-transparent overlay at the edges
    const g = new Graphics()
    const w = this.app.screen.width
    const h = this.app.screen.height
    g.rect(0, 0, w, h)
    g.fill({ color, alpha: 0.15 })
    this.entityContainer.addChild(g)
  }

  private getBlockColor(block: MiningBlock): number {
    switch (block.layer) {
      case 'surface': return COLONY_COLORS.surface
      case 'shallow': return COLONY_COLORS.shallow
      case 'mid': return COLONY_COLORS.mid
      case 'deep': return COLONY_COLORS.deep
      case 'abyss': return COLONY_COLORS.abyss
    }
  }
}
