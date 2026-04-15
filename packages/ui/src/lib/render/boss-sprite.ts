import { Container, Graphics } from 'pixi.js'
import type { ThemeInts } from '../theme/theme-store'
import { onThemeChange } from '../theme/theme-store'

/**
 * Procedural boss sprite — a chunky diamond with spikes. Larger than a
 * regular glitch and animates an outer ring pulse.
 */
export function createBossSprite(ints: ThemeInts): Container {
  const g = new Graphics()
  const draw = (i: ThemeInts): void => {
    g.clear()
    const err = i.errorForeground
    const fg = i.editorForeground

    // outer pulse ring
    g.circle(0, 0, 10)
    g.stroke({ color: err, width: 2, alpha: 0.3 })

    // main diamond
    g.moveTo(0, -8)
    g.lineTo(8, 0)
    g.lineTo(0, 8)
    g.lineTo(-8, 0)
    g.closePath()
    g.fill({ color: err, alpha: 0.95 })
    g.stroke({ color: fg, width: 1, alpha: 0.5 })

    // inner eye
    g.circle(0, 0, 2)
    g.fill({ color: fg, alpha: 0.8 })
  }
  draw(ints)

  const container = new Container()
  container.addChild(g)
  onThemeChange((_c, i) => draw(i))
  return container
}
