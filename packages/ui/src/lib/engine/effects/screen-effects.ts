import { Application, Graphics } from 'pixi.js'

/**
 * Screen-level effects: shake, flash, and ambient color transitions.
 */
export class ScreenEffects {
  private app: Application
  private flashOverlay: Graphics
  private shakeTimer = 0
  private shakeIntensity = 0
  private shakeDuration = 0
  private originalStageX = 0
  private originalStageY = 0

  constructor(app: Application) {
    this.app = app

    this.flashOverlay = new Graphics()
    this.flashOverlay.visible = false
    app.stage.addChild(this.flashOverlay)

    app.ticker.add((ticker) => {
      this.updateShake(ticker.deltaMS)
      this.updateFlash(ticker.deltaMS)
    })
  }

  /**
   * Shake the screen for a duration.
   */
  shake(intensity: number, durationMs: number): void {
    this.shakeIntensity = intensity
    this.shakeDuration = durationMs
    this.shakeTimer = durationMs
    this.originalStageX = 0
    this.originalStageY = 0
  }

  /**
   * Flash the entire screen with a color.
   */
  flash(color: number, alpha: number, durationMs: number): void {
    const w = this.app.screen.width
    const h = this.app.screen.height

    this.flashOverlay.clear()
    this.flashOverlay.rect(0, 0, w, h)
    this.flashOverlay.fill({ color, alpha })
    this.flashOverlay.visible = true
    this.flashOverlay.alpha = 1;

    // Fade out
    (this.flashOverlay as any)._flashDuration = durationMs;
    (this.flashOverlay as any)._flashTimer = durationMs
  }

  private updateShake(deltaMS: number): void {
    if (this.shakeTimer <= 0) return

    this.shakeTimer -= deltaMS
    const progress = Math.max(0, this.shakeTimer / this.shakeDuration)
    const currentIntensity = this.shakeIntensity * progress

    this.app.stage.x = this.originalStageX + (Math.random() - 0.5) * currentIntensity * 2
    this.app.stage.y = this.originalStageY + (Math.random() - 0.5) * currentIntensity * 2

    if (this.shakeTimer <= 0) {
      this.app.stage.x = this.originalStageX
      this.app.stage.y = this.originalStageY
    }
  }

  private updateFlash(deltaMS: number): void {
    const overlay = this.flashOverlay as any
    if (!overlay._flashTimer || overlay._flashTimer <= 0) return

    overlay._flashTimer -= deltaMS
    const progress = Math.max(0, overlay._flashTimer / overlay._flashDuration)
    this.flashOverlay.alpha = progress

    if (progress <= 0) {
      this.flashOverlay.visible = false
    }
  }
}
