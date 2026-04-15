import type { PixiApp } from './pixi-app'

/**
 * Vertical camera. The world is much taller than the viewport, so we
 * translate the map+entity+effects containers together.
 *
 * Simple drag-to-pan: grab on pointerdown, track on pointermove, clamp
 * to world bounds. No inertia in v1 — easy to add later.
 */
export class Camera {
  y = 0
  minY = 0
  maxY = 0

  private dragging = false
  private lastPointerY = 0

  constructor(private readonly pixi: PixiApp) {}

  attach(canvas: HTMLCanvasElement): () => void {
    const onDown = (e: PointerEvent): void => {
      this.dragging = true
      this.lastPointerY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent): void => {
      if (!this.dragging) return
      const dy = e.clientY - this.lastPointerY
      this.lastPointerY = e.clientY
      this.y = clamp(this.y - dy, this.minY, this.maxY)
      this.apply()
    }
    const onUp = (e: PointerEvent): void => {
      this.dragging = false
      canvas.releasePointerCapture(e.pointerId)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }

  setBounds(maxY: number): void {
    this.maxY = Math.max(0, maxY)
    this.y = clamp(this.y, this.minY, this.maxY)
    this.apply()
  }

  setY(y: number): void {
    this.y = clamp(y, this.minY, this.maxY)
    this.apply()
  }

  private apply(): void {
    const offset = -this.y
    this.pixi.layers.map.y = offset
    this.pixi.layers.entities.y = offset
    this.pixi.layers.effects.y = offset
    this.pixi.layers.ambient.y = offset
  }
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v))
}
