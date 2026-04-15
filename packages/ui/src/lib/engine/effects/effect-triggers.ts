import type { Glitch, Building, Proxy } from '@idle-vibes/shared'
import type { VibeStateName } from '@idle-vibes/shared'
import type { ParticlePool } from './particle-system'
import type { ScreenEffects } from './screen-effects'
import type { AnimationManager } from '../animation/animation-manager'
import { TILE_SIZE } from '../constants'

/**
 * Maps game events to visual effects (particles, screen shake, flash).
 */
export class EffectTriggers {
  constructor(
    private particles: ParticlePool,
    private screen: ScreenEffects,
    private animations: AnimationManager,
  ) {}

  /**
   * Called when a glitch is clicked/removed by the player.
   */
  onGlitchRemoved(glitch: Glitch): void {
    const x = glitch.position.x * TILE_SIZE + TILE_SIZE / 2
    const y = glitch.position.y * TILE_SIZE + TILE_SIZE / 2

    // Burst of particles
    this.particles.emit({
      x, y,
      count: 12,
      color: [0xff00ff, 0xff44ff, 0xffffff],
      speed: 3,
      life: 400,
      size: 2,
    })

    // Small shake
    this.screen.shake(2, 150)
  }

  /**
   * Called when a new glitch spawns.
   */
  onGlitchSpawn(glitch: Glitch): void {
    const x = glitch.position.x * TILE_SIZE + TILE_SIZE / 2
    const y = glitch.position.y * TILE_SIZE + TILE_SIZE / 2

    // Subtle shake
    this.screen.shake(1, 100)

    // Red flash at glitch position
    this.particles.emit({
      x, y,
      count: 6,
      color: [0xff0000, 0xff4444],
      speed: 1.5,
      life: 300,
      size: 2,
    })
  }

  /**
   * Called when a building is newly placed.
   */
  onBuildingPlaced(building: Building): void {
    const x = building.position.x * TILE_SIZE + TILE_SIZE
    const y = building.position.y * TILE_SIZE + TILE_SIZE

    // Green burst
    this.particles.emit({
      x, y,
      count: 8,
      color: [0x00ff88, 0x44ffaa, 0x88ffcc],
      speed: 2,
      life: 500,
      size: 2,
    })

    // Brief green flash
    this.screen.flash(0x00ff88, 0.15, 200)
  }

  /**
   * Called when vibe state changes.
   */
  onVibeStateChange(newState: VibeStateName, _fromColor: number, _toColor: number): void {
    if (newState === 'peak_vibe') {
      // Gold starburst
      this.particles.emit({
        x: 192, y: 160, // center of canvas
        count: 20,
        color: [0xffdd44, 0xff88ff, 0x44ffff],
        speed: 4,
        life: 800,
        size: 2,
      })
      this.screen.flash(0xff00ff, 0.2, 300)
    } else if (newState === 'dead_zone') {
      // Red warning flash
      this.screen.flash(0xff0000, 0.25, 400)
      this.screen.shake(1, 200)
    } else if (newState === 'flow_state') {
      // Cyan pulse
      this.screen.flash(0x00ff88, 0.1, 200)
      this.particles.emit({
        x: 192, y: 160,
        count: 10,
        color: [0x00ff88, 0x44ffaa],
        speed: 2.5,
        life: 600,
        size: 2,
      })
    }
  }

  /**
   * Called when a proxy becomes glitched.
   */
  onProxyGlitched(proxy: Proxy): void {
    const x = proxy.position.x * TILE_SIZE + TILE_SIZE / 2
    const y = proxy.position.y * TILE_SIZE + TILE_SIZE / 2

    this.particles.emit({
      x, y,
      count: 8,
      color: [0xff0066, 0xff00ff],
      speed: 2,
      life: 400,
      size: 2,
    })

    this.screen.flash(0xff0000, 0.1, 150)
  }

  /**
   * Called when player clicks on the canvas (for click feedback).
   */
  onCanvasClick(x: number, y: number): void {
    this.particles.emit({
      x, y,
      count: 4,
      color: [0x00aaff, 0x44ccff],
      speed: 1,
      life: 250,
      size: 1,
    })
  }
}
