/**
 * Definitions for the meta roguelike layer: Relics, Modifiers, Echo Tree.
 *
 * Effects are identified by opaque string ids. The extension host's
 * modifier-engine / relic-engine map ids to concrete behaviors — this file
 * only declares the data shapes.
 */

export type Rarity = 'common' | 'rare' | 'legendary'

export interface RelicDef {
  id: string
  name: string
  rarity: Rarity
  description: string
  /** Opaque effect id consumed by relic-engine */
  effectId: string
  /** True if this relic introduces a risk (for UI warnings) */
  risky?: boolean
}

export interface ModifierDef {
  id: string
  name: string
  description: string
  /**
   * Rough risk/reward weight (1 = mild, 5 = extreme).
   * Higher weight gives more Echoes on prestige.
   */
  weight: number
  effectId: string
  /** Optional validator — if returns false, skip this modifier in current pool */
  requiresUnlock?: string
}

export type EchoNodeCategory = 'foundations' | 'unlocks' | 'mutations'

export interface EchoNodeDef {
  id: string
  category: EchoNodeCategory
  name: string
  description: string
  /** Base cost in Echoes (scaled by rank) */
  baseCost: number
  /** Max rank (1 = one-shot unlock) */
  maxRank: number
  /** Optional prerequisite node id */
  requires?: string
  /**
   * What the node grants. Interpretation lives in the extension host.
   * Shape: { kind: 'unlock_relic', target: 'token_lens' } or similar.
   */
  grant: { kind: string; target?: string; value?: number }
}

export interface ExpeditionEventDef {
  id: string
  /** Description shown in the feed card */
  prompt: string
  optionA: { label: string; outcome: string }
  optionB: { label: string; outcome: string }
  /** Minimum target layer (event only appears if expedition targets this layer or deeper) */
  minLayerIndex: number
}
