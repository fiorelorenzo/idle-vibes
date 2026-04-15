import { defineQuery, hasComponent } from 'bitecs'
import {
  AIState,
  Kin,
  KinType,
  KIN,
  STATE,
  GridPos,
  PathTarget,
  Home,
  Carrying,
  MoteTag,
  Velocity,
  Position,
  GlitchTag,
  Health,
} from '../components'
import type { EcsWorld } from '../world'
import { rand } from '../util/rng'
import { emitChatter } from '../behaviors/chatter'

const kinQuery = defineQuery([Kin, KinType, AIState, GridPos, PathTarget, Home, Position])
const moteQuery = defineQuery([MoteTag, GridPos, Velocity])
const glitchQuery = defineQuery([GlitchTag, Health, Position])

/**
 * Behavior-tree-style AI system for every Kin.
 *
 * This is not a real BT library — it's a compact FSM that runs each
 * sim tick per Kin. The rule is: every Kin always has a next action.
 * No dead idle. Use `AIState.nextThinkAt` as a cooldown between
 * decisions so they don't spam.
 */
export function aiBehaviorSystem(world: EcsWorld): void {
  const entities = kinQuery(world)
  const motes = moteQuery(world)
  const glitches = glitchQuery(world)
  const landedMotes: number[] = []
  for (let i = 0; i < motes.length; i++) {
    if (Velocity.vy[motes[i]] === 0) landedMotes.push(motes[i])
  }

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    const type = KinType.type[eid]

    // Wake up from sleep when the cooldown has elapsed.
    if (AIState.state[eid] === STATE.sleeping && world.time >= AIState.nextThinkAt[eid]) {
      AIState.state[eid] = STATE.idle
    }

    // Cooldown between BT ticks. Each state still runs its own logic via
    // other systems (pathfinding, movement, carry, combat). This only
    // decides transitions.
    if (world.time < AIState.nextThinkAt[eid]) continue

    switch (type) {
      case KIN.scribe:
        tickScribe(world, eid, landedMotes)
        break
      case KIN.warden:
        tickWarden(world, eid, glitches)
        break
      case KIN.delver:
        tickDelver(world, eid)
        break
      case KIN.archivist:
        tickArchivist(world, eid)
        break
    }
  }
}

// ── Scribe ──────────────────────────────────────────────────────────

function tickScribe(world: EcsWorld, eid: number, landedMotes: number[]): void {
  const state = AIState.state[eid]
  const isCarrying = hasComponent(world, Carrying, eid) && Carrying.eid[eid] !== 0

  // The carry system takes priority over wander goals — let it handle
  // mote seek + deliver. This BT just picks wander/rest when idle and
  // occasional chatter.
  if (isCarrying || state === STATE.chasing_mote || state === STATE.carrying) {
    // carrySystem is doing its job
    AIState.nextThinkAt[eid] = world.time + 0.5
    return
  }

  if (state !== STATE.idle) {
    AIState.nextThinkAt[eid] = world.time + 0.5
    return
  }

  // Idle scribe: wander, sleep, or chatter.
  const roll = rand(world)
  if (roll < 0.15 && landedMotes.length === 0) {
    // Small chance to chatter if there's nothing to do
    emitChatter(world, eid, KIN.scribe)
    AIState.nextThinkAt[eid] = world.time + 3 + rand(world) * 4
    return
  }
  if (roll < 0.25) {
    // Brief rest/sit (no movement, short cooldown)
    AIState.state[eid] = STATE.sleeping
    AIState.nextThinkAt[eid] = world.time + 2 + rand(world) * 3
    return
  }
  // Default: wander within 3 tiles of home.
  pickWanderTarget(world, eid, 3)
}

// ── Warden ──────────────────────────────────────────────────────────

function tickWarden(
  world: EcsWorld,
  eid: number,
  glitches: Uint32Array | ReadonlyArray<number>,
): void {
  const state = AIState.state[eid]

  // Combat system handles engagement once an Aggro.target is set.
  // This BT handles patrol/return-home/chatter when idle.
  if (state === STATE.fighting) {
    AIState.nextThinkAt[eid] = world.time + 0.5
    return
  }
  if (state === STATE.walking) {
    AIState.nextThinkAt[eid] = world.time + 0.5
    return
  }

  // Are there glitches? Combat takes over.
  if (glitches.length > 0) {
    AIState.nextThinkAt[eid] = world.time + 0.5
    return
  }

  if (state !== STATE.idle) {
    AIState.nextThinkAt[eid] = world.time + 0.5
    return
  }

  // Idle warden: patrol in a tight radius around home.
  const roll = rand(world)
  if (roll < 0.12) {
    emitChatter(world, eid, KIN.warden)
    AIState.nextThinkAt[eid] = world.time + 4 + rand(world) * 3
    return
  }
  pickWanderTarget(world, eid, 2)
}

// ── Delver ──────────────────────────────────────────────────────────

function tickDelver(world: EcsWorld, eid: number): void {
  const state = AIState.state[eid]
  if (state === STATE.walking) {
    AIState.nextThinkAt[eid] = world.time + 0.5
    return
  }

  // Delver idles near home pacing impatiently.
  const roll = rand(world)
  if (roll < 0.12) {
    emitChatter(world, eid, KIN.delver)
    AIState.nextThinkAt[eid] = world.time + 5 + rand(world) * 5
    return
  }
  pickWanderTarget(world, eid, 4)
}

// ── Archivist ───────────────────────────────────────────────────────

function tickArchivist(world: EcsWorld, eid: number): void {
  const state = AIState.state[eid]
  if (state === STATE.walking) {
    AIState.nextThinkAt[eid] = world.time + 0.5
    return
  }
  const roll = rand(world)
  if (roll < 0.2) {
    emitChatter(world, eid, KIN.archivist)
    AIState.nextThinkAt[eid] = world.time + 6 + rand(world) * 5
    return
  }
  pickWanderTarget(world, eid, 3)
}

// ── Shared helper ───────────────────────────────────────────────────

function pickWanderTarget(world: EcsWorld, eid: number, radius: number): void {
  const hx = Home.gx[eid]
  const hy = Home.gy[eid]
  const dx = Math.floor(rand(world) * (radius * 2 + 1)) - radius
  const dy = Math.floor(rand(world) * (radius * 2 + 1)) - radius
  let tx = hx + dx
  let ty = hy + dy
  tx = Math.max(0, Math.min(world.grid.width - 1, tx))
  ty = Math.max(0, Math.min(world.grid.height - 1, ty))
  if (tx === GridPos.gx[eid] && ty === GridPos.gy[eid]) {
    AIState.nextThinkAt[eid] = world.time + 1 + rand(world) * 2
    return
  }
  PathTarget.gx[eid] = tx
  PathTarget.gy[eid] = ty
  PathTarget.active[eid] = 0
  AIState.state[eid] = STATE.walking
  AIState.nextThinkAt[eid] = world.time + 3 + rand(world) * 4
}
