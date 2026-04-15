import { spawnFloatingText } from '../prefabs/floating-text'
import type { EcsWorld } from '../world'
import { Position } from '../components'

const SCRIBE_CHATS = ['...', '+', '◆', '*', 'hm', 'oh', '!', '?']
const WARDEN_CHATS = ['!', '...', '*', 'hrmpf', '↑', '→']
const DELVER_CHATS = ['...', '?', 'lost', 'go', '↓', 'deep']
const ARCHIVIST_CHATS = ['...', 'note', 'old', '!', '◈']

const POOLS = [SCRIBE_CHATS, WARDEN_CHATS, DELVER_CHATS, ARCHIVIST_CHATS]

/**
 * Pops a tiny chatter bubble above a Kin. Uses the bitmap-text prefab
 * with a quick fade so it looks like a speech glyph without any layout
 * overhead.
 */
export function emitChatter(world: EcsWorld, eid: number, kinType: number): void {
  const pool = POOLS[kinType] ?? SCRIBE_CHATS
  const glyph = pool[Math.floor(Math.random() * pool.length)]
  spawnFloatingText(
    world,
    Position.x[eid],
    Position.y[eid] - 12,
    glyph,
    world.pixi.themeInts.descriptionForeground,
  )
}
