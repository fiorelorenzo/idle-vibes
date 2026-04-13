import type { BuildingDefinition } from '../types/building.js'

export const BUILDINGS: Record<string, BuildingDefinition> = {
  buffer_tank: {
    id: 'buffer_tank',
    name: 'Buffer Tank',
    description: '+500 Raw Data storage cap',
    cost: { raw_data: 200 },
    autoSpawn: false,
  },
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    description: 'Converts Raw Data → Stabilized Energy (10:1)',
    cost: { stabilized_energy: 150 },
    autoSpawn: false,
  },
  volatile_condenser: {
    id: 'volatile_condenser',
    name: 'Volatile Condenser',
    description: 'Converts Volatile Energy → Stabilized Energy (5:1)',
    cost: { stabilized_energy: 200 },
    autoSpawn: false,
  },
  vibe_condenser: {
    id: 'vibe_condenser',
    name: 'Vibe Condenser',
    description: 'Temporary — spawns during Flow State Events (1:5 Volatile ratio)',
    cost: {},
    autoSpawn: true,
  },
  curation_pod: {
    id: 'curation_pod',
    name: 'Curation Pod',
    description: 'Heals Proxy Logic Integrity (+5/min per assigned Proxy)',
    cost: { stabilized_energy: 300 },
    autoSpawn: false,
  },
  firewall_turret: {
    id: 'firewall_turret',
    name: 'Firewall Turret',
    description: 'Auto-attacks Glitches in range',
    cost: { stabilized_energy: 250 },
    autoSpawn: false,
  },
  core_terminal: {
    id: 'core_terminal',
    name: 'Core Terminal',
    description: 'Converts Stabilized Energy → Clean Architecture Points (500:1)',
    cost: { stabilized_energy: 1000 },
    autoSpawn: false,
  },
  fragment_extractor: {
    id: 'fragment_extractor',
    name: 'Fragment Extractor',
    description: 'Increases Logic Fragment drop rate in deep layers',
    cost: { stabilized_energy: 500 },
    autoSpawn: false,
  },
  overclock_terminal: {
    id: 'overclock_terminal',
    name: 'Overclock Terminal',
    description: 'Consumes Vibe Charge to supercharge one building (+100% for 10min)',
    cost: { stabilized_energy: 400 },
    autoSpawn: false,
  },
  vibe_resonator: {
    id: 'vibe_resonator',
    name: 'Vibe Resonator',
    description: 'Passively slows Vibe Meter decay (−50% decay rate in range)',
    cost: { stabilized_energy: 600 },
    autoSpawn: false,
  },
}
