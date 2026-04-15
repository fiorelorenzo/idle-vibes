import type { Container } from 'pixi.js'
import type { Proxy, Glitch, Building } from '@idle-vibes/shared'
import type { AnimationManager } from './animation-manager'

/**
 * Register idle animations for a proxy.
 * - Idle bounce: subtle vertical bobbing
 */
export function registerProxyAnimations(
  proxy: Proxy,
  container: Container,
  manager: AnimationManager,
): void {
  const baseY = container.y

  // Idle bounce — continuous sine wave, ~2s period
  manager.animate(`${proxy.id}_idle`, {
    duration: 2000,
    loop: true,
    easing: 'linear',
    onUpdate: (progress) => {
      // Only apply bounce if not currently walking
      if (!manager.has(`${proxy.id}_walk`)) {
        container.y = baseY + Math.sin(progress * Math.PI * 2) * 1.5
      }
    },
  })
}

/**
 * Register pulsing/distortion animations for a glitch.
 */
export function registerGlitchAnimations(
  glitch: Glitch,
  container: Container,
  manager: AnimationManager,
): void {
  // Pulse speed depends on type
  const pulseDurations: Record<string, number> = {
    bug_sprite: 400,
    exception_wraith: 1200,
    corrupted_proxy: 600,
    entropy_creep: 800,
  }
  const duration = pulseDurations[glitch.type] || 800

  // Scale pulsing
  manager.animate(`${glitch.id}_pulse`, {
    duration,
    loop: true,
    easing: 'linear',
    onUpdate: (progress) => {
      const scale = 0.9 + Math.sin(progress * Math.PI * 2) * 0.1
      container.scale.set(scale)
    },
  })

  // Alpha flickering for wraith
  if (glitch.type === 'exception_wraith') {
    manager.animate(`${glitch.id}_flicker`, {
      duration: 300,
      loop: true,
      easing: 'linear',
      onUpdate: (progress) => {
        container.alpha = 0.6 + Math.sin(progress * Math.PI * 4) * 0.3
      },
    })
  }

  // Horizontal jitter for corrupted proxy
  if (glitch.type === 'corrupted_proxy') {
    manager.animate(`${glitch.id}_jitter`, {
      duration: 200,
      loop: true,
      easing: 'linear',
      onUpdate: (progress) => {
        const offset = Math.sin(progress * Math.PI * 6) * 1
        container.x = container.x + offset * 0.1
      },
    })
  }
}

/**
 * Register active-state animations for a building.
 */
export function registerBuildingAnimations(
  building: Building,
  container: Container,
  manager: AnimationManager,
): void {
  // Subtle "breathing" effect for all buildings — gentle alpha pulse
  manager.animate(`${building.instanceId}_breathe`, {
    duration: 3000,
    loop: true,
    easing: 'linear',
    onUpdate: (progress) => {
      const body = container.getChildAt(0)
      if (body) {
        body.alpha = 0.92 + Math.sin(progress * Math.PI * 2) * 0.08
      }
    },
  })
}
