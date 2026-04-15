import type { GameEvent } from '@idle-vibes/shared'
import type { EcsWorld } from '../world'
import { spawnMote } from '../prefabs/mote'
import { spawnGlitch } from '../prefabs/glitch'
import { spawnBoss } from '../prefabs/boss'
import { rand } from '../util/rng'

/**
 * Drains host-queued GameEvents and turns them into ECS state changes
 * (spawns, effects, log entries). This is the one seam where "the host
 * said something happened" becomes "stuff appears on screen".
 */
export function eventIngestSystem(world: EcsWorld): void {
  const queue = world.pendingEvents
  if (queue.length === 0) return

  for (const event of queue) {
    handle(world, event)
  }
  queue.length = 0
}

function handle(world: EcsWorld, event: GameEvent): void {
  switch (event.kind) {
    case 'mote_rain': {
      for (let i = 0; i < event.count; i++) {
        const gx = 2 + Math.floor(rand(world) * (world.grid.width - 4))
        const gy = 5 + Math.floor(rand(world) * 6)
        spawnMote(world, gx, gy, event.source === 'ai' ? 2 : 1)
      }
      world.pendingLogs.push({
        id: `mote-${world.tick}-${Math.floor(rand(world) * 9999)}`,
        ts: Date.now(),
        severity: 'info',
        text: event.source === 'ai' ? '+tokens (AI burst)' : '+tokens (passive)',
        eventKind: 'mote_rain',
      })
      break
    }
    case 'focus_surge':
      world.pendingMutations.push({ kind: 'resource_delta', resource: 'focus', delta: event.amount })
      world.pendingLogs.push({
        id: `focus-${world.tick}`,
        ts: Date.now(),
        severity: 'success',
        text: `+${event.amount} focus`,
        eventKind: 'focus_surge',
      })
      break
    case 'shard_pop':
      world.pendingMutations.push({ kind: 'resource_delta', resource: 'shards', delta: event.count })
      world.pendingLogs.push({
        id: `shard-${world.tick}`,
        ts: Date.now(),
        severity: 'success',
        text: `+${event.count} shard${event.count === 1 ? '' : 's'}`,
        eventKind: 'shard_pop',
      })
      break
    case 'heal_pulse':
      world.pendingLogs.push({
        id: `heal-${world.tick}`,
        ts: Date.now(),
        severity: 'success',
        text: 'heal pulse · +hp',
        eventKind: 'heal_pulse',
      })
      break
    case 'flow_cascade':
      // Burst of 12 bonus motes
      for (let i = 0; i < 12; i++) {
        const gx = 2 + Math.floor(rand(world) * (world.grid.width - 4))
        const gy = 4 + Math.floor(rand(world) * 8)
        spawnMote(world, gx, gy, 3)
      }
      world.pendingLogs.push({
        id: `flow-${world.tick}`,
        ts: Date.now(),
        severity: 'lore',
        text: '// flow cascade',
        eventKind: 'flow_cascade',
      })
      break
    case 'glitch_spawn': {
      for (let i = 0; i < event.count; i++) {
        const crackGx = 2 + Math.floor(rand(world) * (world.grid.width - 4))
        const crackGy = 14 + Math.floor(rand(world) * 4)
        spawnGlitch(world, crackGx, crackGy, event.glitchType)
      }
      world.pendingLogs.push({
        id: `glitch-${world.tick}`,
        ts: Date.now(),
        severity: 'danger',
        text: `${event.count}× ${event.glitchType.replace('_', ' ')} (${event.reason})`,
        eventKind: 'glitch_spawn',
      })
      break
    }
    case 'phase_change':
      world.pendingLogs.push({
        id: `phase-${world.tick}`,
        ts: Date.now(),
        severity: 'lore',
        text: `// phase → ${event.phase}`,
        eventKind: 'phase_change',
      })
      break
    case 'summon_spirit':
      world.pendingLogs.push({
        id: `spirit-${world.tick}`,
        ts: Date.now(),
        severity: 'success',
        text: 'companion spirit summoned',
        eventKind: 'summon_spirit',
      })
      break
    case 'portal_open':
      world.pendingLogs.push({
        id: `portal-${world.tick}`,
        ts: Date.now(),
        severity: 'info',
        text: `portal opens (${Math.floor(event.durationMs / 1000)}s)`,
        eventKind: 'portal_open',
      })
      break
    case 'platform_grow':
      world.pendingMutations.push({ kind: 'layer_rows_grew', layer: event.layer })
      world.pendingLogs.push({
        id: `grow-${world.tick}`,
        ts: Date.now(),
        severity: 'info',
        text: `the stack grows · ${event.layer}`,
        eventKind: 'platform_grow',
      })
      break
    case 'boss_spawn': {
      spawnBoss(world, 10, 16, 150 + event.movesetVariant * 50)
      world.pendingLogs.push({
        id: `boss-${world.tick}`,
        ts: Date.now(),
        severity: 'danger',
        text: `// a Watcher rises from ${event.layer}`,
        eventKind: 'boss_spawn',
      })
      break
    }
    case 'boss_defeated':
      world.pendingMutations.push({ kind: 'boss_defeated', layer: event.layer })
      world.pendingLogs.push({
        id: `bossdown-${world.tick}`,
        ts: Date.now(),
        severity: 'success',
        text: `the ${event.layer} watcher falls`,
        eventKind: 'boss_defeated',
      })
      break
    default:
      break
  }
}
