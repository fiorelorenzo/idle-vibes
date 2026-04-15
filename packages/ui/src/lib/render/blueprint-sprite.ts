import { Container, Graphics } from 'pixi.js'
import type { BuildingKind } from '@idle-vibes/shared'
import type { ThemeInts } from '../theme/theme-store'
import { onThemeChange } from '../theme/theme-store'
import { createBuildingSprite } from './building-sprite'

/**
 * A blueprint sprite: the normal building sprite rendered with
 * a dashed outline and low alpha, plus a progress bar underneath.
 */
export function createBlueprintSprite(
  kind: BuildingKind,
  ints: ThemeInts,
): Container & { setProgress(p: number): void; setActive(): void } {
  const ghost = createBuildingSprite(kind, ints)
  ghost.alpha = 0.5

  const outline = new Graphics()
  const progressBar = new Graphics()

  const container = new Container()
  container.addChild(outline, ghost, progressBar)

  const drawOutline = (i: ThemeInts): void => {
    outline.clear()
    outline.rect(-9, -9, 18, 18)
    outline.stroke({
      color: i.chartsPurple,
      width: 1,
      alpha: 0.75,
    })
  }
  drawOutline(ints)

  let currentProgress = 0
  let isActive = false
  const drawProgress = (): void => {
    progressBar.clear()
    if (isActive) return
    const w = 18
    progressBar.rect(-w / 2, 10, w, 2).fill({ color: 0x000000, alpha: 0.5 })
    progressBar.rect(-w / 2, 10, w * currentProgress, 2).fill({
      color: 0xb180d7,
      alpha: 0.95,
    })
  }
  drawProgress()

  onThemeChange((_c, i) => drawOutline(i))

  return Object.assign(container, {
    setProgress(p: number): void {
      currentProgress = Math.max(0, Math.min(1, p))
      drawProgress()
    },
    setActive(): void {
      isActive = true
      ghost.alpha = 1
      outline.clear()
      drawProgress()
    },
  })
}
