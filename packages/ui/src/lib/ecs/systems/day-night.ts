import { Graphics } from 'pixi.js'
import type { EcsWorld } from '../world'
import { worldSnapshot } from '../../stores/world-store'
import { get } from 'svelte/store'

/**
 * Lightweight day/night ambience: an overlay graphic is added to the
 * `ambient` container whose alpha eases toward a phase-target. No ECS
 * state required.
 */

let overlay: Graphics | null = null
let currentPhase: string | null = null
let overlayAlpha = 0
const OVERLAY_W = 1024
const OVERLAY_H = 4096

export function dayNightSystem(world: EcsWorld): void {
  const snap = get(worldSnapshot)
  if (!snap) return
  const phase = snap.drama.phase

  if (!overlay) {
    overlay = new Graphics()
    overlay.rect(-OVERLAY_W / 2, -OVERLAY_H / 2, OVERLAY_W, OVERLAY_H)
    overlay.fill({ color: 0x1c1145, alpha: 1 })
    overlay.x = 160
    overlay.y = OVERLAY_H / 2
    world.pixi.layers.ambient.addChild(overlay)
    world.pixi.layers.ambient.alpha = 0
  }

  if (phase !== currentPhase) {
    currentPhase = phase
    overlay.clear()
    overlay.rect(-OVERLAY_W / 2, -OVERLAY_H / 2, OVERLAY_W, OVERLAY_H)
    if (phase === 'dusk') {
      overlay.fill({ color: 0x1c1145, alpha: 1 })
    } else if (phase === 'climax') {
      overlay.fill({ color: 0x3a0a0a, alpha: 1 })
    } else if (phase === 'crescendo') {
      overlay.fill({ color: 0x0a1a3a, alpha: 1 })
    } else {
      overlay.fill({ color: 0x000000, alpha: 1 })
    }
  }

  const target = phase === 'dusk' ? 0.35 : phase === 'climax' ? 0.18 : phase === 'crescendo' ? 0.08 : 0
  overlayAlpha += (target - overlayAlpha) * Math.min(1, world.delta * 1.2)
  world.pixi.layers.ambient.alpha = overlayAlpha
}
