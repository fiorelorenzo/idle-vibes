import { Container, Graphics } from 'pixi.js'
import type { ThemeInts } from '../theme/theme-store'
import { onThemeChange } from '../theme/theme-store'

export type BuildingVisualKind = 'loom' | 'barracks' | 'well' | 'gate'

/**
 * Procedural building sprites — chunkier than Kin, drawn roughly at
 * 16×14. Each type has a distinct silhouette so they read clearly
 * even on tiny canvas resolutions.
 */
export function createBuildingSprite(kind: BuildingVisualKind, ints: ThemeInts): Container {
  const g = new Graphics()
  const draw = (i: ThemeInts): void => {
    g.clear()
    const fg = i.editorForeground
    switch (kind) {
      case 'loom': {
        const c = i.chartsBlue
        // Loom body (a small arched hut with a spindle on top)
        g.rect(-6, 0, 12, 6).fill({ color: c, alpha: 0.65 })
        g.rect(-6, 0, 12, 1).fill({ color: fg, alpha: 0.35 })
        g.rect(-4, -4, 8, 4).fill({ color: c, alpha: 0.85 })
        g.rect(-1, -7, 2, 3).fill({ color: fg, alpha: 0.8 })
        g.rect(-3, 2, 2, 2).fill({ color: fg, alpha: 0.4 })
        g.rect(1, 2, 2, 2).fill({ color: fg, alpha: 0.4 })
        break
      }
      case 'barracks': {
        const c = i.chartsOrange
        // Square bunker with battlements
        g.rect(-7, -2, 14, 8).fill({ color: c, alpha: 0.7 })
        g.rect(-7, -2, 14, 1).fill({ color: fg, alpha: 0.35 })
        // crenellations
        g.rect(-7, -4, 3, 2).fill({ color: c, alpha: 0.8 })
        g.rect(-2, -4, 3, 2).fill({ color: c, alpha: 0.8 })
        g.rect(4, -4, 3, 2).fill({ color: c, alpha: 0.8 })
        g.rect(-2, 1, 4, 5).fill({ color: fg, alpha: 0.35 })
        break
      }
      case 'well': {
        const c = i.chartsBlue
        const c2 = i.chartsPurple
        // Round well with fluid
        g.circle(0, 2, 6).fill({ color: c, alpha: 0.7 })
        g.circle(0, 2, 4).fill({ color: c2, alpha: 0.85 })
        g.circle(0, 2, 2).fill({ color: fg, alpha: 0.8 })
        g.rect(-7, 3, 14, 3).fill({ color: fg, alpha: 0.25 })
        break
      }
      case 'gate': {
        const c = i.chartsPurple
        // Tall portal arch
        g.rect(-6, -8, 12, 14).fill({ color: c, alpha: 0.35 })
        g.rect(-6, -8, 12, 1).fill({ color: fg, alpha: 0.4 })
        g.rect(-4, -6, 8, 10).fill({ color: 0x000000, alpha: 0.65 })
        g.rect(-3, -5, 6, 8).fill({ color: c, alpha: 0.45 })
        break
      }
    }
  }
  draw(ints)

  const container = new Container()
  container.addChild(g)
  onThemeChange((_c, i) => draw(i))
  return container
}
