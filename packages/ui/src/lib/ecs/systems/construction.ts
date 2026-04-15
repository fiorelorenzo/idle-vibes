import { defineQuery, hasComponent, addComponent, removeComponent } from 'bitecs'
import {
  AIState,
  STATE,
  BlueprintTag,
  BuildingProgress,
  BuilderTask,
  Kin,
  KinType,
  KIN,
  GridPos,
  PathTarget,
  Carrying,
  Position,
  BuildingType,
  BUILDING,
} from '../components'
import type { EcsWorld } from '../world'
import { findBuildingEntity, forgetBuildingEntity } from '../prefabs/building'
import { bridge } from '../../bridge/webview-bridge'
import { worldSnapshot } from '../../stores/world-store'
import { get } from 'svelte/store'
import { spawnFloatingText } from '../prefabs/floating-text'
import { createBlueprintSprite } from '../../render/blueprint-sprite'

const blueprintQuery = defineQuery([BlueprintTag, BuildingProgress, Position, GridPos])
const scribeQuery = defineQuery([Kin, KinType, AIState, GridPos, PathTarget, Position])

/**
 * Building time in seconds per worker. With one Scribe the blueprint
 * takes ~12s to finish; more Scribes accelerate it.
 */
const BUILD_TIME_SEC = 12
const WORKER_RADIUS = 1.5 // tiles; Scribe within this distance counts as "working"

/**
 * Assigns idle Scribes to blueprints and advances construction progress
 * when workers are at the site. Once a blueprint reaches 1.0, it emits
 * a complete_building mutation and upgrades the sprite in place.
 */
export function constructionSystem(world: EcsWorld): void {
  const blueprints = blueprintQuery(world)
  if (blueprints.length === 0) return

  const scribes = scribeQuery(world)

  // ── Assignment ─────────────────────────────────────────────
  // Find idle Scribes not yet assigned a builder task and push them
  // toward the nearest blueprint.
  for (let i = 0; i < scribes.length; i++) {
    const s = scribes[i]
    if (KinType.type[s] !== KIN.scribe) continue
    // Don't pull Scribes away from the carry loop.
    if (hasComponent(world, Carrying, s) && Carrying.eid[s] !== 0) continue
    if (hasComponent(world, BuilderTask, s) && BuilderTask.targetEid[s] !== 0) continue
    if (AIState.state[s] !== STATE.idle && AIState.state[s] !== STATE.walking) continue

    const target = nearestBlueprint(s, blueprints)
    if (target === -1) continue
    if (!hasComponent(world, BuilderTask, s)) addComponent(world, BuilderTask, s)
    BuilderTask.targetEid[s] = target
    PathTarget.gx[s] = GridPos.gx[target]
    PathTarget.gy[s] = GridPos.gy[target] + 1 // stand below the building
    PathTarget.active[s] = 0
    AIState.state[s] = STATE.walking
    AIState.nextThinkAt[s] = world.time + 10
  }

  // ── Progress accumulation ──────────────────────────────────
  const dt = world.delta
  for (let i = 0; i < blueprints.length; i++) {
    const b = blueprints[i]
    let workers = 0
    // Count Scribes inside the work radius.
    for (let s = 0; s < scribes.length; s++) {
      const kin = scribes[s]
      if (KinType.type[kin] !== KIN.scribe) continue
      if (!hasComponent(world, BuilderTask, kin)) continue
      if (BuilderTask.targetEid[kin] !== b) continue
      const dx = (Position.x[kin] - Position.x[b]) / 16
      const dy = (Position.y[kin] - Position.y[b]) / 16
      if (Math.abs(dx) + Math.abs(dy) <= WORKER_RADIUS) {
        workers++
        AIState.state[kin] = STATE.working
      }
    }
    BuildingProgress.workers[b] = workers
    if (workers > 0) {
      BuildingProgress.progress[b] = Math.min(1, BuildingProgress.progress[b] + (dt * workers) / BUILD_TIME_SEC)
      const sprite = world.sprites.get(b) as ReturnType<typeof createBlueprintSprite> | undefined
      if (sprite) sprite.setProgress(BuildingProgress.progress[b])
    }

    // Complete?
    if (BuildingProgress.progress[b] >= 1) {
      completeBlueprint(world, b, scribes)
    }
  }
}

function nearestBlueprint(scribe: number, blueprints: ReadonlyArray<number>): number {
  let best = -1
  let bestDist = Infinity
  for (let i = 0; i < blueprints.length; i++) {
    const b = blueprints[i]
    const dx = Position.x[b] - Position.x[scribe]
    const dy = Position.y[b] - Position.y[scribe]
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      best = b
    }
  }
  return best
}

function completeBlueprint(world: EcsWorld, blueprint: number, scribes: Uint32Array | ReadonlyArray<number>): void {
  // Which server-side building id does this entity map to?
  const serverId = findServerIdFor(blueprint)
  if (!serverId) return

  // Tell the host to flip status → 'active' and begin production.
  bridge.send({
    type: 'ui:world-mutation',
    mutation: { kind: 'complete_building', buildingId: serverId },
  })

  // Flip the sprite in place.
  const sprite = world.sprites.get(blueprint) as ReturnType<typeof createBlueprintSprite> | undefined
  sprite?.setActive()

  // Drop the blueprint markers so the construction system ignores it
  // from here on. We keep BuildingTag + BuildingType so it renders as
  // an active building.
  removeComponent(world, BlueprintTag, blueprint)
  removeComponent(world, BuildingProgress, blueprint)

  // Release worker Scribes so they return to the carry loop.
  for (let s = 0; s < scribes.length; s++) {
    const kin = scribes[s]
    if (!hasComponent(world, BuilderTask, kin)) continue
    if (BuilderTask.targetEid[kin] !== blueprint) continue
    BuilderTask.targetEid[kin] = 0
    removeComponent(world, BuilderTask, kin)
    AIState.state[kin] = STATE.idle
    AIState.nextThinkAt[kin] = world.time + 0.5
  }

  // Celebration floating text
  const kindId = BuildingType.type[blueprint]
  const label =
    kindId === BUILDING.loom ? 'LOOM'
      : kindId === BUILDING.barracks ? 'BARRACKS'
      : kindId === BUILDING.well ? 'WELL'
      : 'GATE'
  spawnFloatingText(
    world,
    Position.x[blueprint],
    Position.y[blueprint] - 14,
    label,
    world.pixi.themeInts.chartsGreen,
  )

  forgetBuildingEntity(serverId)
}

/** Walks the snapshot.buildings list to find the server id for a Pixi entity. */
function findServerIdFor(blueprint: number): string | undefined {
  const snap = get(worldSnapshot)
  if (!snap) return undefined
  for (const b of snap.buildings) {
    const eid = findBuildingEntity(b.id)
    if (eid === blueprint) return b.id
  }
  return undefined
}
