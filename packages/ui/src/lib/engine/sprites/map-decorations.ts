import { Graphics } from 'pixi.js'
import type { MiningMap } from '@idle-vibes/shared'
import { TILE_SIZE } from '../constants'

/**
 * Deterministic hash for decoration placement.
 */
function decoHash(x: number, y: number, seed: number): number {
  return ((x * 374761 + seed) ^ (y * 668265 + seed * 3)) & 0xff
}

/**
 * Renders ambient decorations as an overlay on the map.
 * Generated once per map change.
 */
export function renderMapDecorations(map: MiningMap): Graphics {
  const g = new Graphics()

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const block = map.grid[y]?.[x]
      if (!block) continue

      const px = x * TILE_SIZE
      const py = y * TILE_SIZE
      const hash = decoHash(x, y, 42)

      switch (block.layer) {
        case 'surface':
          // Grass tufts
          if (hash % 8 === 0) {
            const gx = px + (hash % 10) + 3
            g.moveTo(gx, py + 13)
            g.lineTo(gx - 1, py + 10)
            g.stroke({ color: 0x448844, width: 1, alpha: 0.35 })
            g.moveTo(gx + 2, py + 13)
            g.lineTo(gx + 3, py + 11)
            g.stroke({ color: 0x336633, width: 1, alpha: 0.3 })
          }
          // Small pebbles
          if (hash % 11 === 0) {
            g.circle(px + (hash % 12) + 2, py + 14, 1)
            g.fill({ color: 0x444455, alpha: 0.3 })
          }
          break

        case 'deep':
        case 'abyss':
          // Sparkle dots (will be animated later via animation system)
          if (hash % 6 === 0) {
            const sx = px + (hash % 12) + 2
            const sy = py + ((hash * 7) % 12) + 2
            g.circle(sx, sy, 0.5)
            g.fill({ color: block.layer === 'abyss' ? 0xcc66ff : 0xff88cc, alpha: 0.3 })
          }
          break
      }

      // Fragment ore veins — connect adjacent fragment tiles
      if (block.hasFragment) {
        const rightBlock = map.grid[y]?.[x + 1]
        if (rightBlock?.hasFragment) {
          // Horizontal vein connecting to right neighbor
          const veinY = py + 6 + (hash % 6)
          g.moveTo(px + 10, veinY)
          g.lineTo(px + TILE_SIZE + 6, veinY)
          g.stroke({ color: 0xffdd44, width: 1, alpha: 0.25 })
        }

        const bottomBlock = map.grid[y + 1]?.[x]
        if (bottomBlock?.hasFragment) {
          // Vertical vein connecting to bottom neighbor
          const veinX = px + 5 + (hash % 6)
          g.moveTo(veinX, py + 10)
          g.lineTo(veinX, py + TILE_SIZE + 6)
          g.stroke({ color: 0xffdd44, width: 1, alpha: 0.25 })
        }
      }
    }
  }

  return g
}
