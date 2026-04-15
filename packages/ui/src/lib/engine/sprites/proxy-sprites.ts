import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { Proxy } from '@idle-vibes/shared'
import type { VibeStateName } from '@idle-vibes/shared'
import { TILE_SIZE } from '../constants'

const PROXY_COLORS = {
  miner: { body: 0x4488cc, accent: 0x88ccff, tool: 0xccaa44 },
  constructor: { body: 0xcc8844, accent: 0xffcc88, tool: 0x888888 },
  guard: { body: 0x44cc66, accent: 0x88ff99, tool: 0x4466cc },
  operator: { body: 0x8844cc, accent: 0xcc88ff, tool: 0x44cccc },
}

const GLITCH_BODY = 0xff00ff
const ARIA_GLOW = 0xffffff
const STANDBY_TINT = 0.5

/**
 * Draw a pixel (2x2 block) within the 16x16 sprite grid.
 * px/py are in pixel-art coordinates (0-7 for an 8x8 logical grid mapped to 16x16).
 */
function px(g: Graphics, x: number, y: number, color: number, alpha = 1): void {
  g.rect(x * 2, y * 2, 2, 2)
  g.fill({ color, alpha })
}

/**
 * Creates a procedural pixel-art proxy sprite.
 * Each role has a distinct humanoid silhouette.
 */
export function createProxySprite(proxy: Proxy, vibeState: VibeStateName): Container {
  const container = new Container()
  const body = new Graphics()
  const face = new Text({ text: '', style: new TextStyle({ fontSize: 6, fill: 0xffffff, fontFamily: 'monospace' }) })

  container.addChild(body)
  container.addChild(face)
  face.y = -9
  face.x = -2

  drawProxyBody(body, proxy, vibeState)
  updateFace(face, proxy, vibeState)

  return container
}

/**
 * Updates an existing proxy sprite's appearance without recreating it.
 */
export function updateProxySprite(container: Container, proxy: Proxy, vibeState: VibeStateName): void {
  const body = container.getChildAt(0) as Graphics
  const face = container.getChildAt(1) as Text

  body.clear()
  drawProxyBody(body, proxy, vibeState)
  updateFace(face, proxy, vibeState)
}

function drawProxyBody(g: Graphics, proxy: Proxy, vibeState: VibeStateName): void {
  const isGlitched = proxy.state === 'glitched'
  const isStandby = proxy.state === 'standby'
  const colors = PROXY_COLORS[proxy.role] || PROXY_COLORS.miner
  const bodyColor = isGlitched ? GLITCH_BODY : colors.body
  const accentColor = isGlitched ? 0xff44ff : colors.accent
  const toolColor = isGlitched ? 0xcc00cc : colors.tool
  const alpha = isStandby ? STANDBY_TINT : 1

  // ARIA glow outline
  if (proxy.isAria && !isGlitched) {
    for (const [ox, oy] of [[2, 0], [5, 0], [1, 1], [6, 1], [1, 2], [6, 2], [1, 3], [6, 3], [1, 5], [6, 5], [2, 7], [5, 7]]) {
      px(g, ox, oy, ARIA_GLOW, 0.25)
    }
  }

  // Head (all roles: 4x2 block)
  for (const x of [2, 3, 4, 5]) {
    px(g, x, 0, accentColor, alpha)
    px(g, x, 1, bodyColor, alpha)
  }

  // Role-specific body
  switch (proxy.role) {
    case 'miner':
      drawMinerBody(g, bodyColor, accentColor, toolColor, alpha)
      break
    case 'constructor':
      drawConstructorBody(g, bodyColor, accentColor, toolColor, alpha)
      break
    case 'guard':
      drawGuardBody(g, bodyColor, accentColor, toolColor, alpha)
      break
    case 'operator':
      drawOperatorBody(g, bodyColor, accentColor, toolColor, alpha)
      break
  }

  // Glitch static lines
  if (isGlitched) {
    for (let row = 0; row < 8; row += 2) {
      const offset = (row * 3 + 1) % 3
      px(g, offset + 2, row, 0xff00ff, 0.4)
      px(g, offset + 4, row, 0xffffff, 0.3)
    }
  }

  // Standby "zzz" dots
  if (isStandby) {
    px(g, 6, 0, 0xaaaaff, 0.6)
    px(g, 7, 0, 0xaaaaff, 0.4)
  }
}

// --- MINER: stocky body, pickaxe, headlamp ---
function drawMinerBody(g: Graphics, body: number, accent: number, tool: number, a: number): void {
  // Headlamp
  px(g, 3, 0, 0xffff44, a)
  // Torso (wide/stocky: 6 wide)
  for (const x of [1, 2, 3, 4, 5, 6]) {
    px(g, x, 2, body, a)
    px(g, x, 3, body, a)
  }
  // Belt
  for (const x of [2, 3, 4, 5]) px(g, x, 4, accent, a)
  // Legs (wide)
  for (const y of [5, 6]) {
    px(g, 2, y, body, a)
    px(g, 3, y, body, a)
    px(g, 5, y, body, a)
    px(g, 6, y, body, a)
  }
  // Boots
  px(g, 2, 7, accent, a); px(g, 3, 7, accent, a)
  px(g, 5, 7, accent, a); px(g, 6, 7, accent, a)
  // Pickaxe (right side)
  px(g, 7, 2, tool, a)
  px(g, 7, 3, tool, a)
  px(g, 6, 1, tool, a)
}

// --- CONSTRUCTOR: angular body, wrench, hard hat ---
function drawConstructorBody(g: Graphics, body: number, accent: number, tool: number, a: number): void {
  // Hard hat brim
  px(g, 1, 0, accent, a); px(g, 6, 0, accent, a)
  // Torso (angular/medium)
  for (const x of [2, 3, 4, 5]) {
    px(g, x, 2, body, a)
    px(g, x, 3, body, a)
  }
  // Shoulder pads
  px(g, 1, 2, accent, a); px(g, 6, 2, accent, a)
  // Belt with gear
  px(g, 2, 4, accent, a); px(g, 3, 4, tool, a)
  px(g, 4, 4, tool, a); px(g, 5, 4, accent, a)
  // Legs
  for (const y of [5, 6]) {
    px(g, 2, y, body, a); px(g, 3, y, body, a)
    px(g, 4, y, body, a); px(g, 5, y, body, a)
  }
  // Boots
  px(g, 2, 7, accent, a); px(g, 3, 7, accent, a)
  px(g, 4, 7, accent, a); px(g, 5, 7, accent, a)
  // Wrench (left side)
  px(g, 0, 3, tool, a)
  px(g, 0, 4, tool, a)
  px(g, 1, 3, tool, a)
}

// --- GUARD: tall, shield, pointed visor ---
function drawGuardBody(g: Graphics, body: number, accent: number, tool: number, a: number): void {
  // Visor point
  px(g, 3, 0, 0xff4444, a)
  // Torso (narrow but tall)
  for (const x of [3, 4]) {
    px(g, x, 2, body, a)
    px(g, x, 3, body, a)
    px(g, x, 4, body, a)
  }
  // Armor highlights
  px(g, 2, 2, accent, a); px(g, 5, 2, accent, a)
  px(g, 2, 3, accent, a); px(g, 5, 3, accent, a)
  // Shield (left side)
  for (const y of [2, 3, 4, 5]) {
    px(g, 0, y, tool, a)
    px(g, 1, y, tool, a)
  }
  // Shield highlight
  px(g, 1, 3, accent, a)
  // Legs (narrow, tall)
  for (const y of [5, 6]) {
    px(g, 3, y, body, a)
    px(g, 4, y, body, a)
  }
  // Boots
  px(g, 2, 7, accent, a); px(g, 3, 7, accent, a)
  px(g, 4, 7, accent, a); px(g, 5, 7, accent, a)
}

// --- OPERATOR: slim, antenna, screen glow ---
function drawOperatorBody(g: Graphics, body: number, accent: number, tool: number, a: number): void {
  // Antenna
  px(g, 4, 0, 0x44ffff, a)
  // Slim torso
  for (const x of [3, 4]) {
    px(g, x, 2, body, a)
    px(g, x, 3, body, a)
  }
  // Chest screen
  px(g, 3, 3, 0x00ff88, a * 0.8)
  px(g, 4, 3, 0x00ff88, a * 0.8)
  // Arms (thin)
  px(g, 2, 2, body, a); px(g, 5, 2, body, a)
  px(g, 2, 3, body, a); px(g, 5, 3, body, a)
  // Waist
  px(g, 3, 4, accent, a); px(g, 4, 4, accent, a)
  // Slim legs
  for (const y of [5, 6]) {
    px(g, 3, y, body, a)
    px(g, 4, y, body, a)
  }
  // Boots
  px(g, 3, 7, accent, a); px(g, 4, 7, accent, a)
  // Data pad (right hand)
  px(g, 6, 3, tool, a)
  px(g, 6, 4, tool, a)
}

function updateFace(text: Text, proxy: Proxy, vibeState: VibeStateName): void {
  let face = '[^_^]'
  if (proxy.state === 'standby') face = '[z z]'
  else if (proxy.state === 'glitched') face = '[###]'
  else if (proxy.energyLevel < 15) face = '[-_-]'
  else if (proxy.logicIntegrity < 20) face = '[x_x]'
  else if (vibeState === 'peak_vibe') face = '[\u2726_\u2726]'
  else if (vibeState === 'flow_state') face = '[*_*]'
  text.text = face
}
