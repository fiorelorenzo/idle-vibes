/**
 * Host-authoritative world state. The webview rebuilds its ECS simulation
 * from this snapshot plus the streamed GameEvent log.
 *
 * Everything the webview cannot reconstruct from a seed + event replay must
 * live here (resources, unlocks, tutorial state, active expeditions).
 */

export type LayerId = 'surface' | 'shallow' | 'deep' | 'abyss' | 'main'

export interface LayerState {
  id: LayerId
  unlocked: boolean
  /** 0-100, stability meter — if 0, layer collapses temporarily */
  stability: number
  /** Rows in the current vertical grid for this layer (grows with new_class signals) */
  rows: number
  /** Cells of fog-of-war remaining (absolute count) */
  fogRemaining: number
  /** Boss defeated in this layer this run */
  bossDefeated: boolean
}

export type BuildingKind = 'loom' | 'barracks' | 'well' | 'gate'

export interface BuildingState {
  id: string
  kind: BuildingKind
  layer: LayerId
  gx: number
  gy: number
  placedAt: number
}

export interface ExpeditionState {
  id: string
  delverId: string
  targetLayer: LayerId
  startedAt: number
  durationMs: number
  /** 0-1 */
  progress: number
  /** Pending choices that appeared during the expedition */
  pendingChoices: ExpeditionChoiceInstance[]
  /** Resolved choices (kept for loot calculation at return) */
  resolvedChoices: string[]
}

export interface ExpeditionChoiceInstance {
  id: string
  poolEventId: string
  /** label for both options, rendered in event feed card */
  optionA: { label: string; outcomeTag: string }
  optionB: { label: string; outcomeTag: string }
  /** Timestamp at which this choice auto-resolves to default (optionA) */
  autoResolveAt: number
}

export interface ResourceBag {
  tokens: number
  focus: number
  shards: number
}

export interface RunState {
  /** Monotonic prestige count (0 = first run) */
  prestigeCount: number
  /** Seed used to derive every procgen element of the current run */
  seed: number
  /** Run modifier picked at start of run (null = vanilla, only allowed in runs < 3) */
  modifierId: string | null
  /** Run started at (ms) */
  startedAt: number
  /** Count of layers fully descended this run (for Echoes calculation) */
  layersCleared: number
  /** Bosses killed this run */
  bossesKilled: number
  /** Deepest layer reached */
  deepestLayer: LayerId
}

export interface MetaState {
  /** Commit Echoes — prestige currency, persists across runs */
  echoes: number
  /** Nodes purchased in the Echo Tree, keyed by node id */
  echoNodes: Record<string, number>
  /** Relic ids currently equipped (up to 3, upgradeable) */
  equippedRelics: string[]
  /** Relic ids owned (collected at least once) */
  ownedRelics: string[]
  /** Modifier ids unlocked (visible in the picker pool) */
  unlockedModifiers: string[]
  /** Kin types unlocked across runs */
  unlockedKinTypes: string[]
  /** ARIA-0 lore entries revealed */
  loreEntries: string[]
  /** Total prestiges ever completed */
  totalPrestiges: number
}

export interface TutorialState {
  /**
   * Current onboarding step (only used in prestigeCount === 0).
   * -1 means completed/skipped.
   */
  step: number
}

export interface DramaState {
  /** 'calm' | 'crescendo' | 'climax' | 'dusk' */
  phase: 'calm' | 'crescendo' | 'climax' | 'dusk'
  /** Elapsed ms in the current phase */
  elapsedInPhaseMs: number
  /** Loop count since run start */
  cycles: number
}

export interface WorldSnapshot {
  schemaVersion: number
  savedAt: number
  /** Incremental tick counter set by GameCoordinator */
  tick: number

  resources: ResourceBag
  layers: LayerState[]
  expeditions: ExpeditionState[]
  buildings: BuildingState[]

  run: RunState
  meta: MetaState
  tutorial: TutorialState
  drama: DramaState
}

/**
 * Mutation commands the webview sends to update authoritative state.
 * Coarse-grained — one mutation per meaningful gameplay action.
 */
export type WorldMutation =
  | { kind: 'resource_delta'; resource: keyof ResourceBag; delta: number }
  | { kind: 'unlock_layer'; layer: LayerId; cost: number }
  | { kind: 'boss_defeated'; layer: LayerId }
  | { kind: 'layer_rows_grew'; layer: LayerId }
  | { kind: 'layer_stability'; layer: LayerId; delta: number }
  | { kind: 'expedition_start'; delverId: string; targetLayer: LayerId; durationMs: number }
  | { kind: 'expedition_resolve_choice'; expeditionId: string; choiceId: string; pickedA: boolean }
  | { kind: 'tutorial_advance'; step: number }
  | { kind: 'equip_relic'; relicId: string; slot: number }
  | { kind: 'buy_echo_node'; nodeId: string; cost: number }
  | { kind: 'pick_modifier'; modifierId: string | null }
  | { kind: 'request_boss_spawn'; layer: LayerId }
  | { kind: 'place_building'; buildingKind: BuildingKind; layer: LayerId; gx: number; gy: number }
