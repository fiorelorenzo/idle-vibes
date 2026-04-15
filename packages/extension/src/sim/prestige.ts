import type { WorldSnapshot, GameEvent } from '@idle-vibes/shared'
import {
  WORLD_SCHEMA_VERSION,
  LAYER_DEFS,
  SURFACE_ROWS,
  LAYER_ROWS_AT_UNLOCK,
  GRID_WIDTH,
} from '@idle-vibes/shared'

/**
 * Reset the colony for a new run while preserving meta state (Echoes,
 * equipped Relics, unlocked pools, tutorial, total prestiges).
 * Returns the resulting snapshot (same object, mutated).
 */
export function performPrestige(snapshot: WorldSnapshot): GameEvent[] {
  const now = Date.now()
  const echoesEarned = computeEchoes(snapshot)

  snapshot.meta.echoes += echoesEarned
  snapshot.meta.totalPrestiges++

  // Reset run-local state
  snapshot.resources = { tokens: 0, focus: 0, shards: 0 }
  snapshot.layers = LAYER_DEFS.map((def, i) => ({
    id: def.id,
    unlocked: i === 0,
    stability: 100,
    rows: i === 0 ? SURFACE_ROWS : LAYER_ROWS_AT_UNLOCK,
    fogRemaining: i === 0 ? 0 : GRID_WIDTH * LAYER_ROWS_AT_UNLOCK,
    bossDefeated: false,
  }))
  snapshot.expeditions = []
  snapshot.run = {
    prestigeCount: snapshot.run.prestigeCount + 1,
    seed: hashRunSeed(snapshot.run.prestigeCount + 1),
    modifierId: null,
    startedAt: now,
    layersCleared: 0,
    bossesKilled: 0,
    deepestLayer: 'surface',
  }
  snapshot.drama = { phase: 'calm', elapsedInPhaseMs: 0, cycles: 0 }
  snapshot.schemaVersion = WORLD_SCHEMA_VERSION
  snapshot.savedAt = now

  return [] // webview handles the prestige screen via a snapshot resync
}

export function computeEchoes(snapshot: WorldSnapshot): number {
  const layerBonus = snapshot.run.layersCleared
  const bossBonus = snapshot.run.bossesKilled
  const shardPool = snapshot.resources.shards
  const base = 1 + Math.floor(shardPool / 10)
  return Math.max(1, base + layerBonus + bossBonus * 2)
}

function hashRunSeed(prestigeCount: number): number {
  // mulberry-ish hash of (ts ^ prestige)
  let h = (Date.now() ^ (prestigeCount * 0x6d2b79f5)) >>> 0
  h = Math.imul(h ^ (h >>> 15), h | 1)
  return h >>> 0
}
