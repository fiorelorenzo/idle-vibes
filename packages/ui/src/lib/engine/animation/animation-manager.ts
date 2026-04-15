import { easings, type EasingFn } from './easing'

export interface AnimConfig {
  duration: number
  loop?: boolean
  easing?: string
  onUpdate: (progress: number) => void
  onComplete?: () => void
}

interface AnimEntry {
  config: AnimConfig
  elapsed: number
  easingFn: EasingFn
}

/**
 * Manages all active animations. Attached to PixiJS ticker.
 * Animations are keyed by a unique ID string.
 */
export class AnimationManager {
  private animations = new Map<string, AnimEntry>()

  /**
   * Register or replace an animation.
   */
  animate(id: string, config: AnimConfig): void {
    const easingFn = easings[config.easing || 'linear'] || easings.linear
    this.animations.set(id, {
      config,
      elapsed: 0,
      easingFn,
    })
  }

  /**
   * Stop a specific animation by ID.
   */
  stop(id: string): void {
    this.animations.delete(id)
  }

  /**
   * Stop all animations whose ID starts with a given prefix.
   * Useful for removing all animations for an entity (e.g., "proxy_123_*").
   */
  stopAll(prefix: string): void {
    for (const id of this.animations.keys()) {
      if (id.startsWith(prefix)) {
        this.animations.delete(id)
      }
    }
  }

  /**
   * Check if an animation is currently running.
   */
  has(id: string): boolean {
    return this.animations.has(id)
  }

  /**
   * Called every frame by the PixiJS ticker.
   */
  update(deltaMS: number): void {
    for (const [id, entry] of this.animations) {
      entry.elapsed += deltaMS
      const { config, easingFn } = entry

      if (config.loop) {
        // Looping: wrap elapsed around duration
        const rawProgress = (entry.elapsed % config.duration) / config.duration
        config.onUpdate(easingFn(rawProgress))
      } else {
        const rawProgress = Math.min(entry.elapsed / config.duration, 1)
        config.onUpdate(easingFn(rawProgress))

        if (rawProgress >= 1) {
          config.onComplete?.()
          this.animations.delete(id)
        }
      }
    }
  }

  destroy(): void {
    this.animations.clear()
  }
}
