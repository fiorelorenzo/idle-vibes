import { defineQuery } from 'bitecs'
import type { Container } from 'pixi.js'
import { Position, PreviousPosition, SpriteRef, Renderable } from '../components'
import type { EcsWorld } from '../world'
import type { ThemeInts } from '../../theme/theme-store'

const renderQuery = defineQuery([Position, PreviousPosition, SpriteRef, Renderable])

/**
 * Writes ECS entity positions to PixiJS display objects. Position is
 * interpolated between PreviousPosition and Position based on `alpha`.
 *
 * Called every rAF (not every sim tick) so motion appears smooth even when
 * the simulation runs at 20Hz.
 */
export function pixiRenderSystem(world: EcsWorld, alpha: number): void {
  const entities = renderQuery(world)
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    const sprite = world.sprites.get(eid)
    if (!sprite) continue
    const px = PreviousPosition.x[eid]
    const py = PreviousPosition.y[eid]
    const cx = Position.x[eid]
    const cy = Position.y[eid]
    sprite.x = px + (cx - px) * alpha
    sprite.y = py + (cy - py) * alpha

    // Re-tell the sprite to redraw its walk frame if it supports it.
    const redraw = (sprite as Container & {
      redraw?: (frame: number, tint: number, ints: ThemeInts) => void
      lastFrame?: number
    }).redraw
    if (redraw) {
      const frame = SpriteRef.frame[eid]
      const tint = SpriteRef.tint[eid]
      // Only redraw when the frame actually changed to avoid GPU churn.
      const last = (sprite as unknown as { lastFrame?: number }).lastFrame
      if (last !== frame) {
        redraw(frame, tint, world.pixi.themeInts)
        ;(sprite as unknown as { lastFrame?: number }).lastFrame = frame
      }
    }
  }
}
