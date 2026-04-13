import type { GlitchDefinition } from '../types/glitch.js'

export const GLITCH_DEFINITIONS: Record<string, GlitchDefinition> = {
  bug_sprite: {
    type: 'bug_sprite',
    name: 'Bug Sprite',
    trigger: '≥3 unresolved errors at save',
    behavior: 'Drains Raw Data (−5/sec)',
    vibeImpact: -3,
  },
  exception_wraith: {
    type: 'exception_wraith',
    name: 'Exception Wraith',
    trigger: '≥1 failing test in diagnostics',
    behavior: 'Disables nearest building for 60s',
    vibeImpact: -3,
  },
  corrupted_proxy: {
    type: 'corrupted_proxy',
    name: 'Corrupted Proxy',
    trigger: 'Proxy Logic Integrity reaches 0',
    behavior: 'Former Proxy, attacks siblings',
    vibeImpact: -5,
  },
  entropy_creep: {
    type: 'entropy_creep',
    name: 'Entropy Creep',
    trigger: 'IDE idle > 30 min (no Standby set)',
    behavior: 'Reduces all building efficiency',
    vibeImpact: -1,
  },
}
