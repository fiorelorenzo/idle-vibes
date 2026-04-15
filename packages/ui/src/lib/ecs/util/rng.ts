import type { EcsWorld } from '../world'

/**
 * Minimal mulberry32 PRNG. Deterministic given a seed.
 * `rand(world)` advances the state and returns [0,1).
 */
export function rand(world: EcsWorld): number {
  world.rngState = (world.rngState + 0x6d2b79f5) | 0
  let t = world.rngState
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function seed(world: EcsWorld, value: number): void {
  world.rngState = value >>> 0
}
