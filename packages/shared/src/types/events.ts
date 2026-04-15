import type { LayerId } from './world.js'

/**
 * Discrete, coarse-grained events streamed from the host to the webview ECS.
 * Each event is the single source of cause for something the player sees.
 *
 * Never broadcast raw parser signals — always translate into game events.
 */
export type GlitchKind = 'bug_sprite' | 'null_wraith' | 'runner' | 'bomber' | 'leech' | 'tank'
export type GameEventKind = GameEvent['kind']

export type GameEvent =
  | { kind: 'mote_rain'; count: number; source: 'ai' | 'passive' | 'bloom'; layer?: LayerId }
  | { kind: 'focus_surge'; amount: number }
  | { kind: 'glitch_spawn'; glitchType: GlitchKind; count: number; reason: 'pillarB' | 'wave' | 'boss'; layer: LayerId }
  | { kind: 'platform_grow'; layer: LayerId }
  | { kind: 'bloom'; origin: 'random_scribe' }
  | { kind: 'portal_open'; durationMs: number }
  | { kind: 'heal_pulse'; amount: number }
  | { kind: 'summon_spirit'; durationMs: number }
  | { kind: 'shard_pop'; count: number }
  | { kind: 'flow_cascade' }
  | { kind: 'phase_change'; phase: 'calm' | 'crescendo' | 'climax' | 'dusk' }
  | { kind: 'expedition_start'; expeditionId: string; delverId: string; targetLayer: LayerId; durationMs: number }
  | { kind: 'expedition_choice'; expeditionId: string; choiceId: string; optionA: string; optionB: string; autoResolveAt: number }
  | { kind: 'expedition_return'; expeditionId: string; success: boolean; loot: Loot }
  | { kind: 'boss_spawn'; layer: LayerId; bossId: string; movesetVariant: number }
  | { kind: 'boss_phase'; bossId: string; phase: number }
  | { kind: 'boss_defeated'; layer: LayerId; bossId: string; relicId: string | null }
  | { kind: 'layer_collapse'; layer: LayerId; recoversAt: number }
  | { kind: 'layer_recover'; layer: LayerId }
  | { kind: 'tutorial_step'; step: number; text: string }

export interface Loot {
  shards: number
  tokens: number
  focus: number
  relicId: string | null
}

export interface LogEntry {
  id: string
  ts: number
  severity: 'info' | 'success' | 'warning' | 'danger' | 'lore'
  text: string
  /** Optional originating event kind, for filtering/icons */
  eventKind?: GameEventKind
}
