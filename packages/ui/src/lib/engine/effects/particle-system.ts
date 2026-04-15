import { Container, Graphics } from 'pixi.js'

interface Particle {
  graphics: Graphics
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: number
  startAlpha: number
  size: number
  active: boolean
}

export interface EmitConfig {
  x: number
  y: number
  count: number
  color: number | number[]
  speed?: number       // max initial speed (default 2)
  spread?: number      // radial spread 0-1 (default 1 = full circle)
  life?: number        // particle lifetime in ms (default 500)
  size?: number        // particle size in px (default 2)
  alpha?: number       // start alpha (default 1)
  gravity?: number     // downward acceleration (default 0)
  direction?: number   // base angle in radians (default random)
}

/**
 * Pre-allocated particle pool for lightweight effects.
 */
export class ParticlePool {
  private particles: Particle[] = []
  private container: Container

  constructor(container: Container, poolSize: number) {
    this.container = container

    for (let i = 0; i < poolSize; i++) {
      const graphics = new Graphics()
      graphics.visible = false
      container.addChild(graphics)

      this.particles.push({
        graphics,
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 0,
        color: 0xffffff,
        startAlpha: 1,
        size: 2,
        active: false,
      })
    }
  }

  /**
   * Emit particles from a point.
   */
  emit(config: EmitConfig): void {
    const {
      x, y, count,
      speed = 2,
      spread = 1,
      life = 500,
      size = 2,
      alpha = 1,
      gravity = 0,
    } = config

    const colors = Array.isArray(config.color) ? config.color : [config.color]

    let spawned = 0
    for (const p of this.particles) {
      if (spawned >= count) break
      if (p.active) continue

      const angle = config.direction !== undefined
        ? config.direction + (Math.random() - 0.5) * spread * Math.PI
        : Math.random() * Math.PI * 2
      const velocity = Math.random() * speed

      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * velocity
      p.vy = Math.sin(angle) * velocity - (gravity > 0 ? 0 : 0)
      p.life = life
      p.maxLife = life
      p.color = colors[spawned % colors.length]
      p.startAlpha = alpha
      p.size = size + (Math.random() - 0.5) * size * 0.5
      p.active = true

      // Redraw the particle graphic
      p.graphics.clear()
      p.graphics.rect(-p.size / 2, -p.size / 2, p.size, p.size)
      p.graphics.fill(p.color)
      p.graphics.visible = true

      spawned++
    }
  }

  /**
   * Update all active particles. Called every frame.
   */
  update(deltaMS: number): void {
    const dt = deltaMS / 16.67 // normalize to ~60fps pace

    for (const p of this.particles) {
      if (!p.active) continue

      p.life -= deltaMS
      if (p.life <= 0) {
        p.active = false
        p.graphics.visible = false
        continue
      }

      p.x += p.vx * dt
      p.y += p.vy * dt

      // Friction
      p.vx *= 0.98
      p.vy *= 0.98

      const lifeRatio = p.life / p.maxLife
      p.graphics.x = p.x
      p.graphics.y = p.y
      p.graphics.alpha = p.startAlpha * lifeRatio
      p.graphics.scale.set(lifeRatio * 0.5 + 0.5) // shrink slightly as they die
    }
  }

  destroy(): void {
    for (const p of this.particles) {
      p.graphics.destroy()
    }
    this.particles = []
  }
}
