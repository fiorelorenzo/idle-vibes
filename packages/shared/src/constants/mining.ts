import type { DepthLayerDefinition } from '../types/mining.js'

export const DEPTH_LAYERS: DepthLayerDefinition[] = [
  {
    layer: 'surface',
    levelRange: [0, 0],
    analog: '/ root directory',
    difficulty: 'trivial',
    rewards: ['raw_data'],
  },
  {
    layer: 'shallow',
    levelRange: [1, 3],
    analog: 'Top-level source files',
    difficulty: 'easy',
    rewards: ['raw_data', 'stabilized_energy'],
  },
  {
    layer: 'mid',
    levelRange: [4, 7],
    analog: 'Core modules/components',
    difficulty: 'medium',
    rewards: ['raw_data', 'stabilized_energy', 'pure_energy'],
  },
  {
    layer: 'deep',
    levelRange: [8, 11],
    analog: 'Legacy / vendor folders',
    difficulty: 'hard',
    rewards: ['raw_data', 'logic_fragments'],
  },
  {
    layer: 'abyss',
    levelRange: [12, 20],
    analog: 'Unlocked by feat: commits',
    difficulty: 'very_hard',
    rewards: ['logic_fragments', 'aria_shards'],
  },
]

export function getDepthLayer(level: number): DepthLayerDefinition {
  for (const def of DEPTH_LAYERS) {
    if (level >= def.levelRange[0] && level <= def.levelRange[1]) {
      return def
    }
  }
  return DEPTH_LAYERS[DEPTH_LAYERS.length - 1]
}
