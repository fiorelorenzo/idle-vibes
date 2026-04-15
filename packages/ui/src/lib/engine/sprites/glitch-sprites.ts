import { Container, Graphics } from 'pixi.js'
import type { Glitch } from '@idle-vibes/shared'
import { TILE_SIZE } from '../constants'

const GLITCH_PALETTES: Record<string, { primary: number; accent: number; eyes: number }> = {
  bug_sprite:       { primary: 0xff00ff, accent: 0x44ff44, eyes: 0xffff00 },
  exception_wraith: { primary: 0xcc00ff, accent: 0x8844ff, eyes: 0xff4444 },
  corrupted_proxy:  { primary: 0xff0066, accent: 0xff4488, eyes: 0xff0000 },
  entropy_creep:    { primary: 0xaa44aa, accent: 0x888888, eyes: 0xcccccc },
}

const DEFAULT_GLITCH_PALETTE = { primary: 0xff00ff, accent: 0xff44ff, eyes: 0xffffff }

/**
 * Creates a procedural pixel-art glitch sprite with unique shape per type.
 */
export function createGlitchSprite(glitch: Glitch): Container {
  const container = new Container()
  const body = new Graphics()
  container.addChild(body)

  // Set pivot to center for scale animations
  container.pivot.set(TILE_SIZE / 2, TILE_SIZE / 2)

  drawGlitchBody(body, glitch.type)
  return container
}

function drawGlitchBody(g: Graphics, type: string): void {
  const palette = GLITCH_PALETTES[type] || DEFAULT_GLITCH_PALETTE
  const { primary, accent, eyes } = palette

  switch (type) {
    case 'bug_sprite':
      drawBugSprite(g, primary, accent, eyes)
      break
    case 'exception_wraith':
      drawExceptionWraith(g, primary, accent, eyes)
      break
    case 'corrupted_proxy':
      drawCorruptedProxy(g, primary, accent, eyes)
      break
    case 'entropy_creep':
      drawEntropyCreep(g, primary, accent, eyes)
      break
    default:
      drawDefaultGlitch(g, primary)
      break
  }
}

/** px helper — draws a 2x2 pixel block */
function px(g: Graphics, x: number, y: number, color: number, alpha = 1): void {
  g.rect(x * 2, y * 2, 2, 2)
  g.fill({ color, alpha })
}

// --- BUG SPRITE: insect-like (oval body, 6 legs, antennae) ---
function drawBugSprite(g: Graphics, primary: number, accent: number, eyes: number): void {
  // Antennae
  px(g, 2, 0, accent, 0.8)
  px(g, 5, 0, accent, 0.8)
  px(g, 3, 1, accent, 0.8)
  px(g, 4, 1, accent, 0.8)

  // Head
  px(g, 3, 2, primary)
  px(g, 4, 2, primary)
  // Eyes
  px(g, 3, 2, eyes, 0.9)
  px(g, 4, 2, eyes, 0.9)

  // Body (oval)
  px(g, 2, 3, primary); px(g, 3, 3, primary); px(g, 4, 3, primary); px(g, 5, 3, primary)
  px(g, 2, 4, primary); px(g, 3, 4, primary); px(g, 4, 4, primary); px(g, 5, 4, primary)
  px(g, 3, 5, primary); px(g, 4, 5, primary)

  // Wing pattern
  px(g, 3, 3, accent, 0.4); px(g, 4, 3, accent, 0.4)

  // 6 legs (3 per side)
  px(g, 1, 3, accent, 0.7); px(g, 6, 3, accent, 0.7) // front
  px(g, 1, 4, accent, 0.7); px(g, 6, 4, accent, 0.7) // mid
  px(g, 1, 5, accent, 0.7); px(g, 6, 5, accent, 0.7) // back
}

// --- EXCEPTION WRAITH: ghost shape (wavy bottom, hollow eyes) ---
function drawExceptionWraith(g: Graphics, primary: number, accent: number, eyes: number): void {
  // Head/hood
  px(g, 3, 0, primary); px(g, 4, 0, primary)
  px(g, 2, 1, primary); px(g, 3, 1, primary); px(g, 4, 1, primary); px(g, 5, 1, primary)

  // Eyes (hollow)
  px(g, 3, 2, 0x000000); px(g, 5, 2, 0x000000)
  px(g, 3, 2, eyes, 0.5); px(g, 5, 2, eyes, 0.5)

  // Body
  px(g, 2, 2, primary); px(g, 4, 2, primary)
  for (const x of [2, 3, 4, 5]) {
    px(g, x, 3, primary)
    px(g, x, 4, primary)
  }
  px(g, 1, 3, primary, 0.6); px(g, 6, 3, primary, 0.6) // flowing edges

  // Wavy bottom
  px(g, 2, 5, primary)
  px(g, 4, 5, primary)
  px(g, 3, 6, primary, 0.7)
  px(g, 5, 6, primary, 0.7)
  px(g, 2, 6, primary, 0.4)

  // Spectral glow
  px(g, 1, 2, accent, 0.15); px(g, 6, 2, accent, 0.15)
  px(g, 1, 4, accent, 0.15); px(g, 6, 4, accent, 0.15)
}

// --- CORRUPTED PROXY: distorted humanoid with jagged edges ---
function drawCorruptedProxy(g: Graphics, primary: number, accent: number, eyes: number): void {
  // Distorted head
  px(g, 3, 0, primary); px(g, 4, 0, primary); px(g, 5, 0, accent, 0.6)
  px(g, 2, 1, primary); px(g, 3, 1, primary); px(g, 4, 1, primary)

  // Glitched eyes
  px(g, 3, 1, eyes); px(g, 4, 1, eyes, 0.5)

  // Jagged torso (asymmetric)
  px(g, 2, 2, primary); px(g, 3, 2, primary); px(g, 4, 2, primary); px(g, 6, 2, accent, 0.4)
  px(g, 1, 3, accent, 0.5); px(g, 3, 3, primary); px(g, 4, 3, primary); px(g, 5, 3, primary)
  px(g, 2, 4, primary); px(g, 3, 4, primary); px(g, 5, 4, accent, 0.4)

  // Broken legs
  px(g, 2, 5, primary); px(g, 3, 5, primary, 0.7)
  px(g, 4, 5, primary); px(g, 5, 5, primary, 0.5)
  px(g, 2, 6, primary, 0.8)
  px(g, 5, 6, primary, 0.6)

  // Static lines
  px(g, 0, 2, 0xffffff, 0.3)
  px(g, 7, 4, 0xffffff, 0.3)
  px(g, 1, 6, 0xffffff, 0.2)
}

// --- ENTROPY CREEP: amorphous blob ---
function drawEntropyCreep(g: Graphics, primary: number, accent: number, eyes: number): void {
  // Irregular blob shape
  px(g, 3, 1, primary, 0.6)
  px(g, 4, 1, primary, 0.8)
  px(g, 2, 2, primary, 0.7); px(g, 3, 2, primary); px(g, 4, 2, primary); px(g, 5, 2, primary, 0.7)
  px(g, 1, 3, primary, 0.5); px(g, 2, 3, primary); px(g, 3, 3, primary); px(g, 4, 3, primary); px(g, 5, 3, primary); px(g, 6, 3, primary, 0.5)
  px(g, 2, 4, primary); px(g, 3, 4, primary); px(g, 4, 4, primary); px(g, 5, 4, primary)
  px(g, 3, 5, primary, 0.7); px(g, 4, 5, primary, 0.8); px(g, 5, 5, primary, 0.5)
  px(g, 3, 6, primary, 0.4); px(g, 4, 6, primary, 0.5)

  // Dull eyes
  px(g, 3, 3, eyes, 0.6); px(g, 5, 3, eyes, 0.4)

  // Surface noise
  px(g, 2, 2, accent, 0.2); px(g, 5, 4, accent, 0.2)
  px(g, 4, 2, accent, 0.15)
}

function drawDefaultGlitch(g: Graphics, primary: number): void {
  // Diamond fallback
  const cx = TILE_SIZE / 2
  const cy = TILE_SIZE / 2
  const size = TILE_SIZE / 2
  g.moveTo(cx, cy - size)
  g.lineTo(cx + size, cy)
  g.lineTo(cx, cy + size)
  g.lineTo(cx - size, cy)
  g.closePath()
  g.fill(primary)
}
