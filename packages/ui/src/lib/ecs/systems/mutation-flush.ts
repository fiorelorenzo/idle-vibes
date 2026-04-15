import type { EcsWorld } from '../world'
import { bridge } from '../../bridge/webview-bridge'

/**
 * Flushes pending world mutations and log entries to the extension host.
 * Called at ~2 Hz from the sim loop (we cheat and just throttle via a
 * simple accumulator).
 */
let accumulator = 0
const FLUSH_INTERVAL = 0.5 // seconds

export function mutationFlushSystem(world: EcsWorld): void {
  accumulator += world.delta
  if (accumulator < FLUSH_INTERVAL) return
  accumulator = 0

  if (world.pendingMutations.length > 0) {
    for (const mutation of world.pendingMutations) {
      bridge.send({ type: 'ui:world-mutation', mutation })
    }
    world.pendingMutations.length = 0
  }
  if (world.pendingLogs.length > 0) {
    for (const entry of world.pendingLogs) {
      bridge.send({ type: 'ui:log-event', entry })
    }
    world.pendingLogs.length = 0
  }
}
