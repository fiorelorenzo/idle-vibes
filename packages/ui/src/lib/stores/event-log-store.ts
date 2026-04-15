import { writable } from 'svelte/store'
import type { LogEntry } from '@idle-vibes/shared'
import { bridge } from '../bridge/webview-bridge'

const MAX_ENTRIES = 40

export const eventLog = writable<LogEntry[]>([])

export function initEventLogStore(): void {
  bridge.onMessage((msg) => {
    // The host re-broadcasts ui:log-event back at us via the snapshot,
    // but the webview also writes directly from ECS. In v1 we just use
    // direct writes via the exported `pushLog` helper below.
    void msg
  })
}

export function pushLog(entry: LogEntry): void {
  eventLog.update((arr) => {
    const next = arr.concat(entry)
    return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next
  })
}
