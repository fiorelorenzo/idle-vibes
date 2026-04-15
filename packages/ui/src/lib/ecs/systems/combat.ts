import { defineQuery, hasComponent } from 'bitecs'
import {
  Position,
  KinType,
  Kin,
  KIN,
  GlitchTag,
  BossTag,
  Health,
  Attack,
  Aggro,
  AIState,
  PathTarget,
  GridPos,
  STATE,
  SpriteRef,
  Carrying,
} from '../components'
import type { EcsWorld } from '../world'
import { killEntity } from '../world'
import { spawnFloatingText } from '../prefabs/floating-text'

const wardenQuery = defineQuery([Kin, KinType, Attack, Aggro, AIState, Position, GridPos, PathTarget])
const glitchQuery = defineQuery([GlitchTag, Health, Position, GridPos, PathTarget, AIState])
const carrierQuery = defineQuery([Carrying, Position])

const CORE_GX = 10
const CORE_GY = 4

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

  // ── Glitch locomotion toward Core ───────────────────────────────
  for (let i = 0; i < glitches.length; i++) {
    const g = glitches[i]
    if (Health.hp[g] <= 0) {
      onGlitchDeath(world, g)
      continue
    }
    if (PathTarget.active[g] === 0 && AIState.state[g] === STATE.walking) {
      PathTarget.gx[g] = CORE_GX
      PathTarget.gy[g] = CORE_GY
    }
    // Glitch reached Core tile? Nibble Tokens.
    if (GridPos.gx[g] === CORE_GX && GridPos.gy[g] === CORE_GY) {
      world.pendingMutations.push({ kind: 'resource_delta', resource: 'tokens', delta: -1 })
      // Destroy this glitch on bite — no loss cascade
      onGlitchDeath(world, g)
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
    if (target === 0) continue

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
