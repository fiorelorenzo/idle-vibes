import { writable } from 'svelte/store'
import { bridge } from '../bridge/webview-bridge'

export interface CloudSyncState {
  authenticated: boolean
  username: string | null
  avatarUrl: string | null
}

export const cloudSync = writable<CloudSyncState>({
  authenticated: false,
  username: null,
  avatarUrl: null,
})

export function initCloudSyncStore(): void {
  bridge.onMessage((msg) => {
    if (msg.type === 'ext:auth-status') {
      cloudSync.set({
        authenticated: msg.authenticated,
        username: msg.username ?? null,
        avatarUrl: msg.avatarUrl ?? null,
      })
    }
  })
}
