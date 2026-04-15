import { Container, Graphics } from 'pixi.js'
import type { ThemeInts } from '../theme/theme-store'
import { onThemeChange } from '../theme/theme-store'
import { GRID_WIDTH } from '@idle-vibes/shared'

export const TILE_SIZE = 16

interface TilemapState {
  container: Container
  rows: number
  redraw: (ints: ThemeInts) => void
}

/**
 * Draw a simple striped platform tilemap in the map layer.
 * Columns: GRID_WIDTH; Rows: dynamic.
 *
 * In Phase 1 this is just a static demo scene so the canvas isn't empty.
 * In Phase 5 this becomes the real vertical Stack with layer boundaries.
 */
export function createStaticTilemap(parent: Container, rows = 30): TilemapState {
  const container = new Container()
  parent.addChild(container)

  const bgGfx = new Graphics()
  const gridGfx = new Graphics()
  container.addChild(bgGfx, gridGfx)

  const redraw = (ints: ThemeInts): void => {
    const bg = ints.editorBackground
    const border = ints.panelBorder
    const accent = ints.chartsBlue

    bgGfx.clear()
    gridGfx.clear()

    // Subtle band background across the full virtual width.
    for (let r = 0; r < rows; r++) {
      const y = r * TILE_SIZE
      const luminanceBump = (r % 2 === 0) ? 0x0a0a0a : 0x040404
      const shade = addRgb(bg, luminanceBump)
      bgGfx.rect(0, y, GRID_WIDTH * TILE_SIZE, TILE_SIZE)
      bgGfx.fill({ color: shade, alpha: 0.6 })
    }

    // Grid lines and layer boundary every 12 rows
    for (let r = 0; r <= rows; r++) {
      const y = r * TILE_SIZE
      const thick = r % 12 === 0
      gridGfx.rect(0, y, GRID_WIDTH * TILE_SIZE, thick ? 2 : 1)
      gridGfx.fill({ color: thick ? accent : border, alpha: thick ? 0.3 : 0.12 })
    }

    // Core platform marker near top
    gridGfx.rect(6 * TILE_SIZE, 1 * TILE_SIZE, 8 * TILE_SIZE, TILE_SIZE)
    gridGfx.fill({ color: accent, alpha: 0.18 })
  }

  onThemeChange((_c, ints) => redraw(ints))

  return { container, rows, redraw }
}

function addRgb(base: number, delta: number): number {
  const br = (base >> 16) & 0xff
  const bg = (base >> 8) & 0xff
  const bb = base & 0xff
  const dr = (delta >> 16) & 0xff
  const dg = (delta >> 8) & 0xff
  const db = delta & 0xff
  return (clamp(br + dr) << 16) | (clamp(bg + dg) << 8) | clamp(bb + db)
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}
