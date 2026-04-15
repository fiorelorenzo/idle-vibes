import { writable } from 'svelte/store'
import type { LayerId } from '@idle-vibes/shared'

/** Layer the camera should jump to on next frame (or null to stay put). */
export const cameraTarget = writable<LayerId | null>(null)

export function jumpToLayer(id: LayerId): void {
  cameraTarget.set(id)
}
