import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { Building } from '@idle-vibes/shared'
import { TILE_SIZE } from '../constants'

const SIZE = TILE_SIZE * 2
const LABEL_STYLE = new TextStyle({ fontSize: 7, fill: 0xffffff, fontFamily: 'monospace' })

const BUILDING_PALETTES: Record<string, { primary: number; accent: number; detail: number }> = {
  buffer_tank:       { primary: 0x226644, accent: 0x44cc88, detail: 0x88ffcc },
  refinery:          { primary: 0x664422, accent: 0xcc8844, detail: 0xffcc88 },
  volatile_condenser:{ primary: 0x442266, accent: 0x8844cc, detail: 0xcc88ff },
  vibe_condenser:    { primary: 0x224466, accent: 0x4488cc, detail: 0x88ccff },
  curation_pod:      { primary: 0x226644, accent: 0x44cc66, detail: 0x88ff99 },
  firewall_turret:   { primary: 0x662222, accent: 0xcc4444, detail: 0xff8888 },
  core_terminal:     { primary: 0x333366, accent: 0x6666cc, detail: 0xaaaaff },
  fragment_extractor:{ primary: 0x665522, accent: 0xccaa44, detail: 0xffdd88 },
  overclock_terminal:{ primary: 0x226666, accent: 0x44cccc, detail: 0x88ffff },
  vibe_resonator:    { primary: 0x552266, accent: 0xaa44cc, detail: 0xff88ff },
}

const DEFAULT_PALETTE = { primary: 0x226644, accent: 0x44cc88, detail: 0x88ffcc }

/**
 * Creates a procedural pixel-art building sprite (32x32).
 */
export function createBuildingSprite(building: Building): Container {
  const container = new Container()
  const body = new Graphics()
  const label = new Text({ text: building.buildingId.slice(0, 3).toUpperCase(), style: LABEL_STYLE })

  container.addChild(body)
  container.addChild(label)
  label.x = 2
  label.y = 2

  drawBuildingBody(body, building)

  return container
}

/**
 * Updates an existing building sprite's visual state.
 */
export function updateBuildingSprite(container: Container, building: Building): void {
  const body = container.getChildAt(0) as Graphics
  body.clear()
  drawBuildingBody(body, building)
}

function drawBuildingBody(g: Graphics, building: Building): void {
  const palette = BUILDING_PALETTES[building.buildingId] || DEFAULT_PALETTE
  const { primary, accent, detail } = palette

  // Base structure with outline
  // Outer shadow (1px dark border)
  g.rect(0, 0, SIZE, SIZE)
  g.fill(0x000000)

  // Main body
  g.rect(1, 1, SIZE - 2, SIZE - 2)
  g.fill(primary)

  // Top highlight
  g.rect(1, 1, SIZE - 2, 1)
  g.fill({ color: 0xffffff, alpha: 0.15 })

  // Bottom shadow
  g.rect(1, SIZE - 2, SIZE - 2, 1)
  g.fill({ color: 0x000000, alpha: 0.2 })

  // Role-specific structural details
  switch (building.buildingId) {
    case 'buffer_tank':
      drawBufferTank(g, accent, detail)
      break
    case 'refinery':
      drawRefinery(g, accent, detail)
      break
    case 'volatile_condenser':
    case 'vibe_condenser':
      drawCondenser(g, accent, detail)
      break
    case 'curation_pod':
      drawCurationPod(g, accent, detail)
      break
    case 'firewall_turret':
      drawFirewallTurret(g, accent, detail)
      break
    case 'core_terminal':
      drawCoreTerminal(g, accent, detail)
      break
    case 'fragment_extractor':
      drawFragmentExtractor(g, accent, detail)
      break
    case 'overclock_terminal':
      drawOverclockTerminal(g, accent, detail)
      break
    case 'vibe_resonator':
      drawVibeResonator(g, accent, detail)
      break
    default:
      drawDefaultBuilding(g, accent, detail)
      break
  }

  // Door (all buildings)
  g.rect(12, SIZE - 8, 6, 7)
  g.fill(0x000000)
  g.rect(13, SIZE - 7, 4, 5)
  g.fill({ color: accent, alpha: 0.3 })

  // Faulty state: red diagonal slashes
  if (building.faulty) {
    g.moveTo(2, 2); g.lineTo(SIZE - 2, SIZE - 2)
    g.stroke({ color: 0xff4444, width: 2, alpha: 0.7 })
    g.moveTo(SIZE - 2, 2); g.lineTo(2, SIZE - 2)
    g.stroke({ color: 0xff4444, width: 2, alpha: 0.7 })
  }

  // Maintenance mode: amber overlay
  if (building.maintenanceMode) {
    g.rect(0, 0, SIZE, SIZE)
    g.fill({ color: 0xffaa00, alpha: 0.2 })
  }

  // Overclocked: cyan edge glow
  if (building.overclockUntil && building.overclockUntil > Date.now()) {
    g.rect(0, 0, SIZE, 2)
    g.fill({ color: 0x44ffff, alpha: 0.4 })
    g.rect(0, SIZE - 2, SIZE, 2)
    g.fill({ color: 0x44ffff, alpha: 0.4 })
    g.rect(0, 0, 2, SIZE)
    g.fill({ color: 0x44ffff, alpha: 0.4 })
    g.rect(SIZE - 2, 0, 2, SIZE)
    g.fill({ color: 0x44ffff, alpha: 0.4 })
  }
}

// --- Building-specific drawings ---

function drawBufferTank(g: Graphics, accent: number, detail: number): void {
  // Cylindrical tank shape — rounded top and bottom lines
  g.rect(4, 6, 22, 2)
  g.fill(accent)
  // Fill level lines
  for (let y = 10; y < 26; y += 4) {
    g.rect(4, y, 22, 1)
    g.fill({ color: detail, alpha: 0.4 })
  }
  // Pipe on side
  g.rect(26, 8, 3, 2)
  g.fill(accent)
}

function drawRefinery(g: Graphics, accent: number, detail: number): void {
  // Chimney
  g.rect(6, 2, 4, 10)
  g.fill(accent)
  g.rect(7, 2, 2, 2)
  g.fill(detail)
  // Gear circle
  g.circle(20, 16, 5)
  g.fill({ color: accent, alpha: 0.6 })
  g.circle(20, 16, 2)
  g.fill(detail)
  // Base platform
  g.rect(4, 24, 24, 3)
  g.fill(accent)
}

function drawCondenser(g: Graphics, accent: number, detail: number): void {
  // Central orb
  g.circle(16, 14, 6)
  g.fill({ color: accent, alpha: 0.5 })
  g.circle(16, 14, 3)
  g.fill({ color: detail, alpha: 0.7 })
  // Pipes connecting to orb
  g.rect(4, 12, 6, 2)
  g.fill(accent)
  g.rect(22, 12, 6, 2)
  g.fill(accent)
  // Base
  g.rect(8, 22, 16, 3)
  g.fill(accent)
}

function drawCurationPod(g: Graphics, accent: number, detail: number): void {
  // Rounded pod shape
  g.roundRect(4, 4, 24, 20, 6)
  g.fill({ color: accent, alpha: 0.3 })
  // Cross/plus symbol
  g.rect(14, 8, 4, 12)
  g.fill({ color: detail, alpha: 0.6 })
  g.rect(10, 12, 12, 4)
  g.fill({ color: detail, alpha: 0.6 })
}

function drawFirewallTurret(g: Graphics, accent: number, detail: number): void {
  // Turret base
  g.rect(6, 16, 20, 10)
  g.fill(accent)
  // Barrel
  g.rect(10, 6, 4, 12)
  g.fill(accent)
  g.rect(11, 4, 2, 4)
  g.fill(detail)
  // Barrel tip (flash point)
  g.rect(10, 4, 4, 2)
  g.fill({ color: 0xff4444, alpha: 0.6 })
  // Armor plate
  g.rect(8, 18, 16, 2)
  g.fill({ color: detail, alpha: 0.4 })
}

function drawCoreTerminal(g: Graphics, accent: number, detail: number): void {
  // Screen frame
  g.rect(4, 4, 24, 16)
  g.fill(0x111122)
  g.rect(5, 5, 22, 14)
  g.fill({ color: accent, alpha: 0.3 })
  // Screen scan lines
  for (let y = 6; y < 18; y += 2) {
    g.rect(6, y, 20, 1)
    g.fill({ color: detail, alpha: 0.2 })
  }
  // Keyboard
  g.rect(6, 22, 20, 4)
  g.fill({ color: accent, alpha: 0.5 })
}

function drawFragmentExtractor(g: Graphics, accent: number, detail: number): void {
  // Drill head
  g.moveTo(16, 4); g.lineTo(20, 12); g.lineTo(12, 12); g.closePath()
  g.fill(detail)
  // Machine body
  g.rect(8, 12, 16, 12)
  g.fill(accent)
  // Conveyor
  g.rect(4, 26, 24, 2)
  g.fill({ color: detail, alpha: 0.5 })
  // Fragment glow
  g.circle(16, 18, 2)
  g.fill({ color: 0xffdd44, alpha: 0.6 })
}

function drawOverclockTerminal(g: Graphics, accent: number, detail: number): void {
  // Lightning bolt shape
  g.moveTo(14, 4); g.lineTo(18, 12); g.lineTo(14, 12); g.lineTo(18, 20); g.lineTo(14, 20); g.lineTo(12, 14); g.lineTo(16, 14); g.closePath()
  g.fill({ color: detail, alpha: 0.7 })
  // Base unit
  g.rect(6, 20, 20, 6)
  g.fill(accent)
  // Energy dots
  g.circle(10, 8, 1.5)
  g.fill({ color: 0x44ffff, alpha: 0.6 })
  g.circle(22, 8, 1.5)
  g.fill({ color: 0x44ffff, alpha: 0.6 })
}

function drawVibeResonator(g: Graphics, accent: number, detail: number): void {
  // Central resonance crystal
  g.moveTo(16, 4); g.lineTo(22, 14); g.lineTo(16, 24); g.lineTo(10, 14); g.closePath()
  g.fill({ color: detail, alpha: 0.6 })
  // Resonance rings
  g.circle(16, 14, 10)
  g.stroke({ color: accent, width: 1, alpha: 0.3 })
  g.circle(16, 14, 7)
  g.stroke({ color: accent, width: 1, alpha: 0.4 })
  g.circle(16, 14, 4)
  g.stroke({ color: detail, width: 1, alpha: 0.5 })
}

function drawDefaultBuilding(g: Graphics, accent: number, detail: number): void {
  // Simple box with window
  g.rect(4, 4, 24, 20)
  g.fill({ color: accent, alpha: 0.3 })
  // Window
  g.rect(8, 8, 8, 6)
  g.fill(0x111122)
  g.rect(9, 9, 6, 4)
  g.fill({ color: detail, alpha: 0.4 })
}
