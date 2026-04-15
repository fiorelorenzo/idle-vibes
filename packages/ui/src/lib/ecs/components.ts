import { defineComponent, Types } from 'bitecs'

// ── spatial ─────────────────────────────────────────────────────────
export const Position = defineComponent({ x: Types.f32, y: Types.f32 })
export const PreviousPosition = defineComponent({ x: Types.f32, y: Types.f32 })
export const Velocity = defineComponent({ vx: Types.f32, vy: Types.f32 })
export const GridPos = defineComponent({ gx: Types.i16, gy: Types.i16 })
export const LayerRef = defineComponent({ layer: Types.ui8 })

// ── identity / sprite ───────────────────────────────────────────────
export const KinType = defineComponent({ type: Types.ui8 })
export const GlitchKind = defineComponent({ type: Types.ui8 })
export const SpriteRef = defineComponent({
  spriteId: Types.ui16,
  frame: Types.ui8,
  dir: Types.ui8, // 0=down 1=left 2=right 3=up
  tint: Types.ui32,
})

// ── AI / behavior ───────────────────────────────────────────────────
export const AIState = defineComponent({
  state: Types.ui8,
  ticks: Types.ui16,
  nextThinkAt: Types.f32,
})
export const PathTarget = defineComponent({
  gx: Types.i16,
  gy: Types.i16,
  active: Types.ui8,
  nodeIdx: Types.ui8,
})
export const PathBuffer = defineComponent({
  // Up to 32 waypoints stored inline. nodeIdx / length tracked in PathTarget.
  nodes: [Types.i16, 64], // alternating gx,gy = 32 waypoints
  length: Types.ui8,
})
export const Home = defineComponent({ gx: Types.i16, gy: Types.i16 })

// ── combat ──────────────────────────────────────────────────────────
export const Health = defineComponent({ hp: Types.f32, max: Types.f32 })
export const Attack = defineComponent({
  dmg: Types.f32,
  range: Types.f32,
  cooldown: Types.f32,
  timer: Types.f32,
})
export const Aggro = defineComponent({ target: Types.ui32 })

// ── carry / items ───────────────────────────────────────────────────
export const Carrying = defineComponent({ eid: Types.ui32 })
export const Item = defineComponent({ kind: Types.ui8, value: Types.f32 })
export const Lifetime = defineComponent({ remaining: Types.f32 })

// ── visual extras ───────────────────────────────────────────────────
export const Animation = defineComponent({
  clipId: Types.ui8,
  frame: Types.ui8,
  elapsed: Types.f32,
  speed: Types.f32,
})
export const Tween = defineComponent({
  prop: Types.ui8,
  from: Types.f32,
  to: Types.f32,
  duration: Types.f32,
  elapsed: Types.f32,
  ease: Types.ui8,
})
export const FloatingText = defineComponent({
  glyph: Types.ui8,
  value: Types.f32,
  tint: Types.ui32,
  life: Types.f32,
  maxLife: Types.f32,
})
export const Particle = defineComponent({
  kind: Types.ui8,
  r: Types.f32,
  tint: Types.ui32,
  life: Types.f32,
  maxLife: Types.f32,
  gravity: Types.f32,
})

// ── tags ────────────────────────────────────────────────────────────
export const Renderable = defineComponent()
export const Dead = defineComponent()
export const Kin = defineComponent() // parent tag for all 4 Kin archetypes
export const GlitchTag = defineComponent()
export const MoteTag = defineComponent()
export const BossTag = defineComponent()
export const CoreTag = defineComponent()
export const BuildingTag = defineComponent()
export const BuildingType = defineComponent({ type: Types.ui8 })
export const BuildingProduction = defineComponent({
  interval: Types.f32,
  timer: Types.f32,
})

// ── enums (plain TS — bitECS stores numeric codes) ──────────────────
export const KIN = {
  scribe: 0,
  warden: 1,
  delver: 2,
  archivist: 3,
} as const

export const STATE = {
  idle: 0,
  walking: 1,
  working: 2,
  fighting: 3,
  sleeping: 4,
  carrying: 5,
  dancing: 6,
  returning: 7,
  chasing_mote: 8,
  dying: 9,
} as const

export const DIR = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
} as const

export const PARTICLE_KIND = {
  droplet: 0,
  ember: 1,
  spark: 2,
  glyph: 3,
  dust: 4,
  floating_text: 5,
  smoke: 6,
  ring: 7,
} as const

export const BUILDING = {
  loom: 0,         // produces Scribes
  barracks: 1,     // produces Wardens
  well: 2,         // passive tokens
  gate: 3,         // required for expeditions
} as const
