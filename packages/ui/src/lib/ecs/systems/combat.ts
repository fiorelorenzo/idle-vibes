import { defineQuery, hasComponent } from 'bitecs'
import {
  Position,
  KinType,
  Kin,
  KIN,
  GlitchTag,
  BossTag,
  CoreTag,
  Health,
  Attack,
  Aggro,
  AIState,
  PathTarget,
  GridPos,
  Home,
  STATE,
  SpriteRef,
  Carrying,
} from '../components'
import { refreshCoreHp } from '../prefabs/core'
import type { EcsWorld } from '../world'
import { killEntity } from '../world'
import { spawnFloatingText } from '../prefabs/floating-text'
import { sfx } from '../../audio/synth'

const wardenQuery = defineQuery([Kin, KinType, Attack, Aggro, AIState, Position, GridPos, PathTarget])
const glitchQuery = defineQuery([GlitchTag, Health, Position, GridPos, PathTarget, AIState])
const carrierQuery = defineQuery([Carrying, Position])
const coreQuery = defineQuery([CoreTag, Health])

/**
 * Core world coordinate. The Core entity sits at this tile; glitches
 * target a ring of tiles around it so they don't pile up.
 */
export const CORE_GX = 10
export const CORE_GY = 3

// Target tiles around the Core — glitches pick one and path to it,
// so they spread out instead of stacking on a single tile.
const CORE_APPROACH_TILES = [
  [9, 4], [10, 4], [11, 4],
  [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],
  [8, 6], [12, 6],
]

/**
 * Combat + glitch locomotion + hit resolution.
 *
 * - Glitches: path toward the Core and, if reached, nibble Tokens.
 * - Wardens: if no aggro target, scan for nearest glitch in vision range
 *   and walk to bite distance, then attack.
 */
export function combatSystem(world: EcsWorld): void {
  const dt = world.delta
  const wardens = wardenQuery(world)
  const glitches = glitchQuery(world)
  const cores = coreQuery(world)

  // ── Glitch locomotion toward Core ───────────────────────────────
  for (let i = 0; i < glitches.length; i++) {
    const g = glitches[i]
    if (Health.hp[g] <= 0) {
      onGlitchDeath(world, g)
      continue
    }
    // Pick a ring tile around the Core on first walk request, then stick to it.
    if (PathTarget.active[g] === 0 && AIState.state[g] === STATE.walking) {
      const tile = CORE_APPROACH_TILES[g % CORE_APPROACH_TILES.length]
      PathTarget.gx[g] = tile[0]
      PathTarget.gy[g] = tile[1]
    }
    // Glitch close enough to the Core → damage it and die.
    const dx = GridPos.gx[g] - CORE_GX
    const dy = GridPos.gy[g] - CORE_GY
    if (Math.abs(dx) + Math.abs(dy) <= 2) {
      for (let j = 0; j < cores.length; j++) {
        Health.hp[cores[j]] = Math.max(0, Health.hp[cores[j]] - 5)
        refreshCoreHp(world, cores[j])
      }
      world.pendingMutations.push({ kind: 'resource_delta', resource: 'tokens', delta: -1 })
      onGlitchDeath(world, g)
    }
  }

  // Core slow passive regen when no glitches nearby
  if (glitches.length === 0) {
    for (let j = 0; j < cores.length; j++) {
      const c = cores[j]
      if (Health.hp[c] < Health.max[c]) {
        Health.hp[c] = Math.min(Health.max[c], Health.hp[c] + 0.5 * dt)
        refreshCoreHp(world, c)
      }
    }
  }

  // ── Warden AI: engage nearest glitch ────────────────────────────
  for (let i = 0; i < wardens.length; i++) {
    const w = wardens[i]
    if (KinType.type[w] !== KIN.warden) continue
    Attack.timer[w] = Math.max(0, Attack.timer[w] - dt)

    let target = Aggro.target[w]
    if (target !== 0 && (!world.sprites.get(target) || Health.hp[target] <= 0)) {
      target = 0
      Aggro.target[w] = 0
    }

    if (target === 0) {
      target = findNearestGlitch(glitches, Position.x[w], Position.y[w])
      Aggro.target[w] = target
    }
    if (target === 0) {
      // No enemies in sight — head home if not already there.
      const hx = Home.gx[w]
      const hy = Home.gy[w]
      if (PathTarget.active[w] === 0 && (GridPos.gx[w] !== hx || GridPos.gy[w] !== hy)) {
        PathTarget.gx[w] = hx
        PathTarget.gy[w] = hy
        AIState.state[w] = STATE.walking
      }
      continue
    }

    const dx = Position.x[target] - Position.x[w]
    const dy = Position.y[target] - Position.y[w]
    const dist = Math.hypot(dx, dy)

    if (dist > Attack.range[w]) {
      // Walk toward glitch's grid tile
      if (PathTarget.active[w] === 0) {
        PathTarget.gx[w] = GridPos.gx[target]
        PathTarget.gy[w] = GridPos.gy[target]
        PathTarget.active[w] = 0
        AIState.state[w] = STATE.walking
      }
    } else if (Attack.timer[w] === 0) {
      // Bite!
      Health.hp[target] -= Attack.dmg[w]
      Attack.timer[w] = Attack.cooldown[w]
      spawnFloatingText(
        world,
        Position.x[target],
        Position.y[target] - 10,
        `-${Math.floor(Attack.dmg[w])}`,
        world.pixi.themeInts.errorForeground,
      )
      sfx.glitchHit()
      if (Health.hp[target] <= 0) {
        onGlitchDeath(world, target)
        Aggro.target[w] = 0
      }
    }
  }
}

function findNearestGlitch(glitches: Uint32Array | ReadonlyArray<number>, x: number, y: number): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < glitches.length; i++) {
    const g = glitches[i]
    if (Health.hp[g] <= 0) continue
    const dx = Position.x[g] - x
    const dy = Position.y[g] - y
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      best = g
    }
  }
  return best
}

function onGlitchDeath(world: EcsWorld, g: number): void {
  const isBoss = hasComponent(world, BossTag, g)
  if (isBoss) {
    world.pendingMutations.push({ kind: 'resource_delta', resource: 'shards', delta: 10 })
    spawnFloatingText(
      world,
      Position.x[g],
      Position.y[g] - 10,
      '+10 ◈',
      world.pixi.themeInts.chartsPurple,
    )
    world.pendingLogs.push({
      id: `boss-kill-${world.tick}`,
      ts: Date.now(),
      severity: 'success',
      text: '// watcher defeated',
      eventKind: 'boss_defeated',
    })
    // Record deepest layer advance — the coordinator uses this for PrestigeButton visibility.
    // We can't know the layer here, so leave the coordinator to infer from layersCleared.
  } else if (Math.random() < 0.4) {
    world.pendingMutations.push({ kind: 'resource_delta', resource: 'shards', delta: 1 })
    spawnFloatingText(
      world,
      Position.x[g],
      Position.y[g] - 10,
      '+1 ◈',
      world.pixi.themeInts.chartsPurple,
    )
  }
  killEntity(world, g)
}

// Prevent unused import warning (Carrying / SpriteRef / carrierQuery reserved for Phase 6 ambient)
void Carrying
void SpriteRef
void carrierQuery
