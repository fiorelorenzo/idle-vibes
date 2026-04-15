import type { GameEvent } from '@idle-vibes/shared'
import type { EcsWorld } from '../world'
import { spawnMote } from '../prefabs/mote'
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
    default:
      // Many event kinds are handled in later phases (glitch_spawn, boss_spawn, etc.)
      break
  }
}
