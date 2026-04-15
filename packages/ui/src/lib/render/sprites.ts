import { Container, Graphics } from 'pixi.js'
import type { ThemeInts } from '../theme/theme-store'
import { onThemeChange } from '../theme/theme-store'

/**
 * Minimal sprite registry. Each entity id maps to a PixiJS Container
 * that holds the procedural graphic. The registry is responsible for
 * lifetime: release(eid) destroys the sprite, get(eid) may return null.
 */
export class SpriteRegistry {
  private map = new Map<number, Container>()

  register(eid: number, sprite: Container): void {
    this.map.set(eid, sprite)
  }

  get(eid: number): Container | undefined {
    return this.map.get(eid)
  }

  release(eid: number): void {
    this.map.delete(eid)
  }

  clear(): void {
    this.map.forEach((sprite) => sprite.destroy({ children: true }))
    this.map.clear()
  }

  get size(): number {
    return this.map.size
  }
}

// ── procedural sprites ──────────────────────────────────────────────

/**
 * A Kin is a ~10px tall figure with a small head, body, and directional
 * offset hints. Walk animation is approximated with a 2-frame vertical
 * bob. Tint is driven per-entity by the SpriteRef component.
 */
export function createKinSprite(kinType: number, tint: number, ints: ThemeInts): Container {
  const g = new Graphics()
  drawKin(g, kinType, tint, 0, ints)

  const container = new Container()
  container.addChild(g)
  ;(container as Container & { redraw?: (frame: number, t: number, i: ThemeInts) => void }).redraw =
    (frame: number, t: number, i: ThemeInts) => {
      g.clear()
      drawKin(g, kinType, t, frame, i)
    }

  // React to theme changes — rebuild with current tint
  onThemeChange((_c, newInts) => {
    const redraw = (container as Container & { redraw?: (f: number, t: number, i: ThemeInts) => void }).redraw
    redraw?.(0, tint, newInts)
  })

  return container
}

function drawKin(g: Graphics, kinType: number, tint: number, frame: number, ints: ThemeInts): void {
  const bob = frame % 2 === 0 ? 0 : -1
  const outline = ints.editorForeground
  const shadow = withAlphaStub(ints.panelBorder)

  // shadow ellipse
  g.ellipse(4, 10, 4, 1.2)
  g.fill({ color: shadow, alpha: 0.35 })

  // body column (~6×4)
  g.rect(2, 4 + bob, 6, 4)
  g.fill({ color: tint, alpha: 1 })
  // body outline
  g.rect(2, 4 + bob, 6, 1)
  g.fill({ color: outline, alpha: 0.2 })

  // head (~4×3)
  g.rect(2, 1 + bob, 6, 3)
  g.fill({ color: tint, alpha: 0.9 })
  g.rect(2, 1 + bob, 6, 1)
  g.fill({ color: outline, alpha: 0.35 })

  // eye dot
  g.rect(4, 2 + bob, 2, 1)
  g.fill({ color: outline, alpha: 0.6 })

  // legs (tiny lines)
  g.rect(2, 8 + bob, 2, 2)
  g.fill({ color: tint, alpha: 0.8 })
  g.rect(6, 8 + bob, 2, 2)
  g.fill({ color: tint, alpha: 0.8 })

  // tool tag per type (a colored dot)
  const accent = kinType === 0
    ? ints.chartsBlue
    : kinType === 1
    ? ints.chartsOrange
    : kinType === 2
    ? ints.chartsPurple
    : ints.chartsGreen
  g.rect(7, 5 + bob, 1, 2)
  g.fill({ color: accent, alpha: 1 })
}

/** Small yellow dot for a mote. */
export function createMoteSprite(ints: ThemeInts, tint: number): Container {
  const g = new Graphics()
  const redraw = (frame: number, localTint: number, i: ThemeInts): void => {
    g.clear()
    const pulse = frame % 60 < 30 ? 0.9 : 1.0
    g.circle(0, 0, 2)
    g.fill({ color: localTint, alpha: pulse })
    g.circle(0, 0, 1)
    g.fill({ color: i.editorForeground, alpha: 0.25 })
  }
  redraw(0, tint, ints)
  const container = new Container()
  container.addChild(g)
  ;(container as Container & { redraw?: (f: number, t: number, i: ThemeInts) => void }).redraw = redraw
  return container
}

/** Small red diamond for a Glitch. */
export function createGlitchSprite(ints: ThemeInts): Container {
  const g = new Graphics()
  const tint = ints.errorForeground
  const redraw = (i: ThemeInts): void => {
    g.clear()
    const err = i.errorForeground
    g.moveTo(0, -4)
    g.lineTo(4, 0)
    g.lineTo(0, 4)
    g.lineTo(-4, 0)
    g.closePath()
    g.fill({ color: err, alpha: 0.9 })
    g.stroke({ color: i.editorForeground, width: 1, alpha: 0.35 })
  }
  redraw(ints)
  const container = new Container()
  container.addChild(g)
  ;(container as Container & { redraw?: () => void; tint?: number }).tint = tint
  onThemeChange((_c, i) => redraw(i))
  return container
}

function withAlphaStub(int: number): number {
  return int // helper kept for future use
}
