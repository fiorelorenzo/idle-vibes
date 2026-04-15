import { Container, Graphics, Text } from 'pixi.js'
import type { LayerId, WorldSnapshot } from '@idle-vibes/shared'
import { GRID_WIDTH, LAYER_DEFS } from '@idle-vibes/shared'
import { TILE_SIZE } from './tiles'
import type { ThemeInts } from '../theme/theme-store'
import { onThemeChange } from '../theme/theme-store'

interface LayerVisual {
  id: LayerId
  container: Container
  worldY: number
  rows: number
  unlocked: boolean
}

export interface LayeredMap {
  container: Container
  totalHeight: number
  layerByY(worldY: number): LayerId | null
  setLayerRows(id: LayerId, rows: number): void
  setLayerUnlocked(id: LayerId, unlocked: boolean): void
  refresh(ints: ThemeInts): void
}

/**
 * Renders the whole vertical Stack: 5 layers stacked, each with a solid
 * band background, tile grid, and a big label. Fog-of-war is a dark
 * overlay on locked layers that fades on unlock.
 */
export function createLayeredMap(parent: Container, snapshot: WorldSnapshot): LayeredMap {
  const container = new Container()
  parent.addChild(container)

  const layers: LayerVisual[] = []
  let y = 0
  for (let i = 0; i < LAYER_DEFS.length; i++) {
    const def = LAYER_DEFS[i]
    const state = snapshot.layers.find((l) => l.id === def.id)
    const rows = state?.rows ?? 16
    const layerContainer = new Container()
    layerContainer.y = y
    container.addChild(layerContainer)
    layers.push({
      id: def.id,
      container: layerContainer,
      worldY: y,
      rows,
      unlocked: state?.unlocked ?? i === 0,
    })
    y += rows * TILE_SIZE
  }
  const totalHeight = y

  const refresh = (ints: ThemeInts): void => {
    let stackY = 0
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]
      layer.worldY = stackY
      layer.container.y = stackY
      layer.container.removeChildren()

      const h = layer.rows * TILE_SIZE
      const w = GRID_WIDTH * TILE_SIZE

      // Tint per layer (the seed could vary this later)
      const baseTint = tintForLayer(i, ints)

      const bg = new Graphics()
      for (let r = 0; r < layer.rows; r++) {
        const rowY = r * TILE_SIZE
        const shade = r % 2 === 0 ? 0x050505 : 0x020202
        bg.rect(0, rowY, w, TILE_SIZE)
        bg.fill({ color: addRgb(baseTint, shade), alpha: 0.85 })
      }
      // Layer header band
      bg.rect(0, 0, w, 2)
      bg.fill({ color: ints.chartsBlue, alpha: 0.35 })
      layer.container.addChild(bg)

      // Label
      const label = new Text({
        text: LAYER_DEFS[i].displayName,
        style: {
          fontFamily: 'monospace',
          fontSize: 7,
          fill: ints.descriptionForeground,
          letterSpacing: 1,
        },
      })
      label.resolution = 2
      label.x = 2
      label.y = 2
      layer.container.addChild(label)

      if (!layer.unlocked) {
        const fog = new Graphics()
        fog.rect(0, 0, w, h)
        fog.fill({ color: 0x000000, alpha: 0.72 })
        layer.container.addChild(fog)
        const lockedText = new Text({
          text: `[LOCKED · ${LAYER_DEFS[i].unlockCostShards}◈]`,
          style: {
            fontFamily: 'monospace',
            fontSize: 8,
            fill: ints.chartsPurple,
          },
        })
        lockedText.resolution = 2
        lockedText.x = w / 2 - lockedText.width / 2
        lockedText.y = h / 2 - 4
        layer.container.addChild(lockedText)
      }

      stackY += h
    }
  }

  onThemeChange((_c, ints) => refresh(ints))

  return {
    container,
    get totalHeight(): number {
      let t = 0
      for (const l of layers) t += l.rows * TILE_SIZE
      return t
    },
    layerByY(worldY: number): LayerId | null {
      let acc = 0
      for (const l of layers) {
        acc += l.rows * TILE_SIZE
        if (worldY < acc) return l.id
      }
      return null
    },
    setLayerRows(id: LayerId, rows: number): void {
      const l = layers.find((x) => x.id === id)
      if (!l) return
      l.rows = rows
    },
    setLayerUnlocked(id: LayerId, unlocked: boolean): void {
      const l = layers.find((x) => x.id === id)
      if (!l) return
      l.unlocked = unlocked
    },
    refresh,
  }
}

function tintForLayer(i: number, ints: ThemeInts): number {
  // Each layer shifts hue via small deltas on the editor background.
  const deltas = [0x040400, 0x000408, 0x080210, 0x100208, 0x080010]
  return addRgb(ints.editorBackground, deltas[i] ?? 0)
}

function addRgb(base: number, delta: number): number {
  const br = (base >> 16) & 0xff
  const bg = (base >> 8) & 0xff
  const bb = base & 0xff
  const dr = (delta >> 16) & 0xff
  const dg = (delta >> 8) & 0xff
  const db = delta & 0xff
  return (clamp255(br + dr) << 16) | (clamp255(bg + dg) << 8) | clamp255(bb + db)
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}
