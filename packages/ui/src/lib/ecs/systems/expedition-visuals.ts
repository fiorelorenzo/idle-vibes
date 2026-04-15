import { defineQuery, hasComponent, addComponent, removeComponent } from 'bitecs'
import {
  Kin,
  KinType,
  KIN,
  AIState,
  STATE,
  PathTarget,
  GridPos,
  Position,
  InExpeditionTag,
  Home,
} from '../components'
import type { EcsWorld } from '../world'
import { spawnFloatingText } from '../prefabs/floating-text'

/**
 * The coordinator sends expedition_start / expedition_return events.
 * This system is the client-side reaction: when an expedition begins
 * we pick a Delver, walk them to the gate tile, fade them out and
 * tag them as InExpedition. On return we clear the tag, move the
 * sprite back to home, and play a particle burst.
 *
 * The coordinator doesn't care which specific Delver entity is
 * "used" — as long as something visible happens on screen.
 */

const delverQuery = defineQuery([Kin, KinType, Home, Position, GridPos, AIState, PathTarget])

const GATE_GX = 10
const GATE_GY = 14

const activeByServerId = new Map<string, number>()

/** Called from event-ingest on expedition_start. */
export function onExpeditionStart(world: EcsWorld, expeditionId: string): void {
  const delver = findFreeDelver(world)
  if (delver === -1) {
    // No delvers visible — log-only, nothing to animate.
    spawnFloatingText(
      world,
      GATE_GX * 16 + 8,
      GATE_GY * 16 + 8,
      'NO DELVER',
      world.pixi.themeInts.errorForeground,
    )
    return
  }
  addComponent(world, InExpeditionTag, delver)
  activeByServerId.set(expeditionId, delver)

  // Walk to the gate tile.
  PathTarget.gx[delver] = GATE_GX
  PathTarget.gy[delver] = GATE_GY
  PathTarget.active[delver] = 0
  AIState.state[delver] = STATE.walking
  AIState.nextThinkAt[delver] = world.time + 60
}

export function onExpeditionReturn(world: EcsWorld, expeditionId: string): void {
  const delver = activeByServerId.get(expeditionId)
  activeByServerId.delete(expeditionId)
  if (delver === undefined) return
  if (!hasComponent(world, InExpeditionTag, delver)) return

  removeComponent(world, InExpeditionTag, delver)

  // Snap back to home; sprite will fade back in via the sim system below.
  const hx = Home.gx[delver]
  const hy = Home.gy[delver]
  Position.x[delver] = hx * 16 + 8
  Position.y[delver] = hy * 16 + 8
  GridPos.gx[delver] = hx
  GridPos.gy[delver] = hy
  AIState.state[delver] = STATE.idle
  AIState.nextThinkAt[delver] = world.time + 0.5

  // Celebration burst
  spawnFloatingText(
    world,
    Position.x[delver],
    Position.y[delver] - 14,
    '+LOOT',
    world.pixi.themeInts.chartsPurple,
  )
}

/**
 * Runs every sim tick: fades out the Delver sprite while in expedition
 * as they approach the gate, hides completely when arrived, fades back
 * in when the tag is removed.
 */
export function expeditionVisualSystem(world: EcsWorld): void {
  const delvers = delverQuery(world)
  for (let i = 0; i < delvers.length; i++) {
    const d = delvers[i]
    if (KinType.type[d] !== KIN.delver) continue
    const sprite = world.sprites.get(d)
    if (!sprite) continue

    if (hasComponent(world, InExpeditionTag, d)) {
      // Fade out as they approach the gate.
      const gdx = (GridPos.gx[d] - GATE_GX)
      const gdy = (GridPos.gy[d] - GATE_GY)
      const dist = Math.abs(gdx) + Math.abs(gdy)
      const alpha = Math.max(0, Math.min(1, dist / 6))
      sprite.alpha = alpha
    } else if (sprite.alpha < 1) {
      sprite.alpha = Math.min(1, sprite.alpha + world.delta * 2)
    }
  }
}

function findFreeDelver(world: EcsWorld): number {
  const delvers = delverQuery(world)
  for (let i = 0; i < delvers.length; i++) {
    const d = delvers[i]
    if (KinType.type[d] !== KIN.delver) continue
    if (hasComponent(world, InExpeditionTag, d)) continue
    return d
  }
  return -1
}
