import { Application, Container } from 'pixi.js'
import type { ThemeInts } from '../theme/theme-store'
import { onThemeChange } from '../theme/theme-store'

export interface PixiApp {
  app: Application
  stage: Container
  /** Layer containers — rendering order matches the array */
  layers: {
    ambient: Container
    map: Container
    entities: Container
    effects: Container
    hud: Container
  }
  resize(width: number, height: number): void
  destroy(): void
}

/**
 * Virtual internal width. Vertical height is driven by container size.
 * CSS scales the canvas up to physical pixels with `image-rendering: pixelated`.
 */
export const VIRTUAL_WIDTH = 320

export async function createPixiApp(canvas: HTMLCanvasElement): Promise<PixiApp> {
  const app = new Application()
  await app.init({
    canvas,
    backgroundAlpha: 0,
    antialias: false,
    autoDensity: false,
    resolution: 1,
    width: VIRTUAL_WIDTH,
    height: 480,
    preference: 'webgl',
  })

  const stage = app.stage
  const ambient = new Container()
  const map = new Container()
  const entities = new Container()
  const effects = new Container()
  const hud = new Container()
  stage.addChild(ambient, map, entities, effects, hud)

  const handle: PixiApp = {
    app,
    stage,
    layers: { ambient, map, entities, effects, hud },
    resize(width, height) {
      app.renderer.resize(width, height)
    },
    destroy() {
      app.destroy(true, { children: true, texture: true })
    },
  }

  // Theme-driven background clear color (transparent canvas,
  // but we also render an ambient background container tinted to editor bg)
  onThemeChange((_colors, ints: ThemeInts) => {
    // Transparent canvas lets the VS Code editor background show through.
    // Nothing to do for the clear color — we keep backgroundAlpha = 0.
    // But expose the editor bg on the root so sprites can sample from it:
    ;(app.stage as Container & { bgInt?: number }).bgInt = ints.editorBackground
  })

  return handle
}
