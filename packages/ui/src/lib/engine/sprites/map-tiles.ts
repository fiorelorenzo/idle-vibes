import { Graphics } from 'pixi.js'
import type { MiningMap, MiningBlock } from '@idle-vibes/shared'
import { TILE_SIZE, COLONY_COLORS } from '../constants'

const LAYER_COLORS: Record<string, number> = {
  surface: COLONY_COLORS.surface,
  shallow: COLONY_COLORS.shallow,
  mid: COLONY_COLORS.mid,
  deep: COLONY_COLORS.deep,
  abyss: COLONY_COLORS.abyss,
}

/**
 * Deterministic hash for tile variation.
 * Returns 0-15 for consistent per-tile noise.
 */
function tileHash(x: number, y: number): number {
  return ((x * 374761) ^ (y * 668265)) & 0xf
}

/**
 * Adjust a hex color's brightness by a signed offset (-16 to +16).
 */
function adjustBrightness(color: number, offset: number): number {
  let r = (color >> 16) & 0xff
  let g = (color >> 8) & 0xff
  let b = color & 0xff
  r = Math.max(0, Math.min(255, r + offset))
  g = Math.max(0, Math.min(255, g + offset))
  b = Math.max(0, Math.min(255, b + offset))
  return (r << 16) | (g << 8) | b
}

/**
 * Renders the full mining map with tile variation, depth details, and fragment indicators.
 */
export function renderMapTiles(map: MiningMap): Graphics {
  const g = new Graphics()

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const block = map.grid[y]?.[x]
      const px = x * TILE_SIZE
      const py = y * TILE_SIZE

      if (!block) {
        // Mined tile — very dark with subtle grid pattern
        g.rect(px, py, TILE_SIZE, TILE_SIZE)
        g.fill(COLONY_COLORS.mined)
        // Subtle dot pattern on mined tiles
        const hash = tileHash(x, y)
        if (hash % 4 === 0) {
          g.rect(px + 6, py + 6, 1, 1)
          g.fill({ color: 0x111133, alpha: 0.5 })
        }
        continue
      }

      // Base tile color with per-tile brightness variation
      const baseColor = LAYER_COLORS[block.layer] || COLONY_COLORS.surface
      const hash = tileHash(x, y)
      const brightnessOffset = (hash - 8) * 2 // -16 to +14
      const tileColor = adjustBrightness(baseColor, brightnessOffset)

      // Fill tile (full TILE_SIZE, no gap for grid)
      g.rect(px, py, TILE_SIZE, TILE_SIZE)
      g.fill(tileColor)

      // Subtle grid: 1px darker border on bottom and right edges
      g.rect(px + TILE_SIZE - 1, py, 1, TILE_SIZE)
      g.fill({ color: 0x000000, alpha: 0.08 })
      g.rect(px, py + TILE_SIZE - 1, TILE_SIZE, 1)
      g.fill({ color: 0x000000, alpha: 0.08 })

      // Layer-specific decorations
      drawLayerDecoration(g, block, px, py, hash)

      // Fragment deposit indicator
      if (block.hasFragment) {
        drawFragmentDeposit(g, px, py, hash)
      }

      // Scanned indicator
      if (block.scanned) {
        drawScannedBorder(g, px, py)
      }

      // Depth-based darkening (deeper rows are darker)
      const depthAlpha = y * 0.003
      if (depthAlpha > 0.001) {
        g.rect(px, py, TILE_SIZE, TILE_SIZE)
        g.fill({ color: 0x000000, alpha: depthAlpha })
      }
    }
  }

  // Edge blending between layers
  drawLayerEdges(g, map)

  return g
}

function drawLayerDecoration(g: Graphics, block: MiningBlock, px: number, py: number, hash: number): void {
  switch (block.layer) {
    case 'surface':
      // Occasional small green dots (grass-like)
      if (hash % 5 === 0) {
        g.rect(px + (hash % 12) + 2, py + 12, 1, 2)
        g.fill({ color: 0x44aa44, alpha: 0.4 })
      }
      if (hash % 7 === 0) {
        g.rect(px + ((hash * 3) % 10) + 3, py + 11, 1, 3)
        g.fill({ color: 0x338833, alpha: 0.3 })
      }
      break

    case 'shallow':
      // Horizontal sediment lines
      if (hash % 3 === 0) {
        const lineY = py + 4 + (hash % 8)
        g.rect(px + 2, lineY, TILE_SIZE - 4, 1)
        g.fill({ color: 0x000000, alpha: 0.1 })
      }
      break

    case 'mid':
      // Ore speckles
      if (hash % 4 === 0) {
        g.rect(px + (hash % 10) + 3, py + (hash % 8) + 4, 2, 1)
        g.fill({ color: 0xccaa66, alpha: 0.35 })
      }
      if (hash % 6 === 0) {
        g.rect(px + ((hash * 2) % 12) + 2, py + ((hash * 3) % 10) + 3, 1, 2)
        g.fill({ color: 0xaa8844, alpha: 0.3 })
      }
      break

    case 'deep':
      // Crystal shapes (small chevrons)
      if (hash % 5 === 0) {
        const cx = px + (hash % 10) + 3
        const cy = py + (hash % 8) + 4
        g.moveTo(cx, cy - 2)
        g.lineTo(cx + 2, cy)
        g.lineTo(cx, cy + 2)
        g.closePath()
        g.fill({ color: 0xff88cc, alpha: 0.3 })
      }
      break

    case 'abyss':
      // Purple sparkle dots
      if (hash % 3 === 0) {
        g.rect(px + (hash % 12) + 2, py + ((hash * 5) % 12) + 2, 1, 1)
        g.fill({ color: 0xcc66ff, alpha: 0.25 + (hash % 4) * 0.1 })
      }
      break
  }
}

function drawFragmentDeposit(g: Graphics, px: number, py: number, hash: number): void {
  // 2-3 bright dots in gold/cyan
  const color1 = hash % 2 === 0 ? 0xffdd44 : 0x44ddff
  const color2 = hash % 2 === 0 ? 0x44ddff : 0xffdd44

  g.rect(px + 4 + (hash % 4), py + 3 + (hash % 5), 2, 2)
  g.fill({ color: color1, alpha: 0.7 })

  g.rect(px + 8 + (hash % 3), py + 7 + (hash % 4), 2, 2)
  g.fill({ color: color2, alpha: 0.6 })

  if (hash % 3 === 0) {
    g.rect(px + 6 + (hash % 5), py + 10 + (hash % 3), 1, 1)
    g.fill({ color: 0xffffff, alpha: 0.5 })
  }
}

function drawScannedBorder(g: Graphics, px: number, py: number): void {
  // Dotted border (every other pixel on edge)
  for (let i = 0; i < TILE_SIZE; i += 3) {
    g.rect(px + i, py, 1, 1)
    g.fill({ color: 0x44ddff, alpha: 0.3 })
    g.rect(px + i, py + TILE_SIZE - 1, 1, 1)
    g.fill({ color: 0x44ddff, alpha: 0.3 })
    g.rect(px, py + i, 1, 1)
    g.fill({ color: 0x44ddff, alpha: 0.3 })
    g.rect(px + TILE_SIZE - 1, py + i, 1, 1)
    g.fill({ color: 0x44ddff, alpha: 0.3 })
  }
}

function drawLayerEdges(g: Graphics, map: MiningMap): void {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const block = map.grid[y]?.[x]
      if (!block) continue

      // Check right neighbor
      const rightBlock = map.grid[y]?.[x + 1]
      if (rightBlock && rightBlock.layer !== block.layer) {
        const blendColor = LAYER_COLORS[rightBlock.layer] || 0
        g.rect((x + 1) * TILE_SIZE - 1, y * TILE_SIZE, 2, TILE_SIZE)
        g.fill({ color: blendColor, alpha: 0.2 })
      }

      // Check bottom neighbor
      const bottomBlock = map.grid[y + 1]?.[x]
      if (bottomBlock && bottomBlock.layer !== block.layer) {
        const blendColor = LAYER_COLORS[bottomBlock.layer] || 0
        g.rect(x * TILE_SIZE, (y + 1) * TILE_SIZE - 1, TILE_SIZE, 2)
        g.fill({ color: blendColor, alpha: 0.2 })
      }
    }
  }
}
