import { Container, Graphics } from 'pixi.js'
import type { ThemeInts } from '../theme/theme-store'
import { onThemeChange } from '../theme/theme-store'

/**
 * The Core — a larger structure (24×24 area) drawn as a stepped ziggurat
 * with a glowing aria ring on top. The exposed `setHp(ratio)` setter
 * animates a health bar underneath the build.
 */
export function createCoreSprite(ints: ThemeInts): Container & { setHp(ratio: number): void } {
  const body = new Graphics()
  const glow = new Graphics()
  const hpBar = new Graphics()
  const container = new Container()
  container.addChild(glow, body, hpBar)

  const draw = (i: ThemeInts): void => {
    body.clear()
    const accent = i.chartsBlue
    const accent2 = i.chartsPurple
    const edge = i.editorForeground

    // Base step (width 24)
    body.rect(-12, 4, 24, 4).fill({ color: accent, alpha: 0.35 })
    body.rect(-12, 4, 24, 1).fill({ color: edge, alpha: 0.35 })

    // Mid step (width 20)
    body.rect(-10, 0, 20, 4).fill({ color: accent, alpha: 0.5 })
    body.rect(-10, 0, 20, 1).fill({ color: edge, alpha: 0.35 })

    // Top step (width 14)
    body.rect(-7, -4, 14, 4).fill({ color: accent, alpha: 0.7 })
    body.rect(-7, -4, 14, 1).fill({ color: edge, alpha: 0.35 })

    // Aria capstone (width 6)
    body.rect(-3, -8, 6, 4).fill({ color: accent2, alpha: 0.85 })

    // Eye slit
    body.rect(-1, -6, 2, 1).fill({ color: edge, alpha: 0.9 })

    // Glow ring
    glow.clear()
    glow.circle(0, -2, 18).stroke({ color: accent2, width: 1, alpha: 0.25 })
    glow.circle(0, -2, 14).stroke({ color: accent, width: 1, alpha: 0.2 })
  }
  draw(ints)

  let currentHp = 1
  const drawHp = (): void => {
    hpBar.clear()
    const w = 22
    const filled = Math.max(0, Math.min(1, currentHp)) * w
    hpBar.rect(-w / 2, 10, w, 2).fill({ color: 0x000000, alpha: 0.35 })
    hpBar.rect(-w / 2, 10, filled, 2).fill({ color: 0x89d185, alpha: 0.9 })
  }
  drawHp()

  ;(container as Container & { setHp(ratio: number): void }).setHp = (ratio: number) => {
    currentHp = ratio
    drawHp()
  }

  onThemeChange((_c, i) => draw(i))

  return container as Container & { setHp(ratio: number): void }
}
