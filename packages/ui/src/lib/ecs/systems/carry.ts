import { defineQuery, hasComponent, removeEntity } from 'bitecs'
import {
  AIState,
  Kin,
  KinType,
  KIN,
  STATE,
  Carrying,
  MoteTag,
  GridPos,
  PathTarget,
  Home,
  Position,
  Velocity,
  Item,
} from '../components'
import type { EcsWorld } from '../world'
import { killEntity } from '../world'
import { spawnFloatingText } from '../prefabs/floating-text'
import { TILE_SIZE } from '../../render/tiles'
import { addComponent } from 'bitecs'

const idleScribeQuery = defineQuery([Kin, KinType, AIState, GridPos, PathTarget, Home])
const moteQuery = defineQuery([MoteTag, GridPos, Position, Velocity])

/**
 * The heartbeat loop.
 *
 * - Idle Scribes find the nearest landed mote and walk to it.
 * - When within 1 tile: pick it up (Carrying set to mote eid), head home.
 * - On arrival home: deliver (Tokens++, floating text, mote killed).
 */
export function carrySystem(world: EcsWorld): void {
  const scribes = idleScribeQuery(world)
  const motes = moteQuery(world)

  // Build a quick list of pickupable motes (those that have landed).
  const landed: number[] = []
  for (let i = 0; i < motes.length; i++) {
    const m = motes[i]
    if (Velocity.vy[m] === 0) landed.push(m)
  }

  for (let i = 0; i < scribes.length; i++) {
    const eid = scribes[i]
    if (KinType.type[eid] !== KIN.scribe) continue

    const carryingMote = hasComponent(world, Carrying, eid) ? Carrying.eid[eid] : 0

    // ── already carrying → head home ─────────────────────────
    if (carryingMote !== 0) {
      // If we've arrived at home with a mote, deliver (handled at the end).
      // If we stopped and aren't on the home tile, request path home.
      if (AIState.state[eid] === STATE.idle) {
        PathTarget.gx[eid] = Home.gx[eid]
        PathTarget.gy[eid] = Home.gy[eid]
        PathTarget.active[eid] = 0
        AIState.state[eid] = STATE.walking
      }
      // Keep mote sprite following carrier
      const mx = Position.x[eid]
      const my = Position.y[eid] - 6
      if (carryingMote && world.sprites.get(carryingMote)) {
        Position.x[carryingMote] = mx
        Position.y[carryingMote] = my
        const s = world.sprites.get(carryingMote)!
        s.x = mx
        s.y = my
      }

      // Arrived home?
      if (GridPos.gx[eid] === Home.gx[eid] && GridPos.gy[eid] === Home.gy[eid]) {
        deliverMote(world, eid, carryingMote)
      }
      continue
    }

    // ── not carrying → look for the nearest mote ─────────────
    if (AIState.state[eid] !== STATE.idle && AIState.state[eid] !== STATE.walking) continue
    if (landed.length === 0) continue

    // If already walking somewhere that's not a mote, let it arrive first
    if (AIState.state[eid] === STATE.walking && AIState.nextThinkAt[eid] < world.time + 5) {
      // wandering — interrupt
    }

    const mote = findNearestMote(landed, GridPos.gx[eid], GridPos.gy[eid])
    if (mote < 0) continue

    const mgx = GridPos.gx[mote]
    const mgy = GridPos.gy[mote]

    if (Math.abs(mgx - GridPos.gx[eid]) + Math.abs(mgy - GridPos.gy[eid]) <= 0) {
      // On the mote tile → pick up
      pickUp(world, eid, mote)
      continue
    }

    // Request a path to the mote
    PathTarget.gx[eid] = mgx
    PathTarget.gy[eid] = mgy
    PathTarget.active[eid] = 0
    AIState.state[eid] = STATE.chasing_mote
    AIState.nextThinkAt[eid] = world.time + 1

    // Remove from landed list so other Scribes don't also target it
    const idx = landed.indexOf(mote)
    if (idx >= 0) landed.splice(idx, 1)
  }
}

function findNearestMote(landed: number[], gx: number, gy: number): number {
  let best = -1
  let bestDist = Infinity
  for (let i = 0; i < landed.length; i++) {
    const m = landed[i]
    const dx = GridPos.gx[m] - gx
    const dy = GridPos.gy[m] - gy
    const d = Math.abs(dx) + Math.abs(dy)
    if (d < bestDist) {
      bestDist = d
      best = m
    }
  }
  return best
}

function pickUp(world: EcsWorld, scribe: number, mote: number): void {
  if (!hasComponent(world, Carrying, scribe)) {
    addComponent(world, Carrying, scribe)
  }
  Carrying.eid[scribe] = mote
  // Head home immediately
  PathTarget.gx[scribe] = Home.gx[scribe]
  PathTarget.gy[scribe] = Home.gy[scribe]
  PathTarget.active[scribe] = 0
  AIState.state[scribe] = STATE.walking
}

function deliverMote(world: EcsWorld, scribe: number, mote: number): void {
  const value = Item.value[mote] || 1
  world.pendingMutations.push({ kind: 'resource_delta', resource: 'tokens', delta: value })

  const x = Position.x[scribe]
  const y = Position.y[scribe] - 8
  spawnFloatingText(world, x, y, `+${value} tok`, world.pixi.themeInts.chartsBlue)

  killEntity(world, mote)
  Carrying.eid[scribe] = 0
  AIState.state[scribe] = STATE.idle
  AIState.nextThinkAt[scribe] = world.time + 0.5
}
