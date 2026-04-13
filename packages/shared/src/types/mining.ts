export type DepthLayer = 'surface' | 'shallow' | 'mid' | 'deep' | 'abyss'

export interface DepthLayerDefinition {
  layer: DepthLayer
  levelRange: [number, number]
  analog: string
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'very_hard'
  rewards: string[]
}

export interface MiningMap {
  /** Grid of blocks — each cell is a depth level or null (mined) */
  grid: (MiningBlock | null)[][]
  width: number
  height: number
}

export interface MiningBlock {
  depth: number
  layer: DepthLayer
  /** Whether this block contains a Logic Fragment deposit */
  hasFragment: boolean
  /** Whether this block has been scanned by a high-XP miner */
  scanned: boolean
}
