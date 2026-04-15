import { writable } from 'svelte/store'
import type { WorldSnapshot } from '@idle-vibes/shared'
import { bridge } from '../bridge/webview-bridge'

/**
 * Mirrors the authoritative WorldSnapshot streamed from the host.
 * Svelte components read from this for HUD display. The ECS world
 * (coming in Phase 2) is a separate mutable structure and does NOT
 * go through Svelte reactivity.
 */
export const worldSnapshot = writable<WorldSnapshot | null>(null)

export function initWorldStore(): void {
  bridge.onMessage((msg) => {
    if (msg.type === 'ext:world-snapshot') {
      worldSnapshot.set(msg.snapshot)
    }
  })
}
