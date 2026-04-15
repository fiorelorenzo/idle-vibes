import type { WorldSnapshot } from '@idle-vibes/shared'
import { MODIFIER_DEFS } from '@idle-vibes/shared'

/**
 * Coarse modifier effects resolved from the active run modifier id.
 * The EffectsBus handles the full per-id branching; this record just
 * captures the most common multipliers so unit-test-style fallbacks
 * keep working even if the bus isn't invoked.
 */
export interface ModifierEffects {
  moteValueMul: number
  expeditionDurationMul: number
  expeditionDisabled: boolean
  commitMultiplier: number
  glitchSpawnMul: number
  focusMul: number
  coreHpMul: number
  suppressMoteRainUntilCommit: boolean
}

const DEFAULT: ModifierEffects = {
  moteValueMul: 1,
  expeditionDurationMul: 1,
  expeditionDisabled: false,
  commitMultiplier: 1,
  glitchSpawnMul: 1,
  focusMul: 1,
  coreHpMul: 1,
  suppressMoteRainUntilCommit: false,
}

export function resolveModifier(snapshot: WorldSnapshot): ModifierEffects {
  if (!snapshot.run.modifierId) return { ...DEFAULT }
  const def = MODIFIER_DEFS.find((m) => m.id === snapshot.run.modifierId)
  if (!def) return { ...DEFAULT }
  switch (def.effectId) {
    case 'flow_glutton':
      return { ...DEFAULT, moteValueMul: 2, expeditionDisabled: true }
    case 'delver_rush':
      return { ...DEFAULT, expeditionDurationMul: 0.5 }
    case 'silent_run':
      return { ...DEFAULT, suppressMoteRainUntilCommit: true }
    case 'glass_core':
      return { ...DEFAULT, focusMul: 2, coreHpMul: 0.5 }
    case 'recursion_echo':
      return { ...DEFAULT, commitMultiplier: 2, glitchSpawnMul: 1.5 }
    default:
      // Richer modifier effects are handled directly in effects-bus.ts.
      return { ...DEFAULT }
  }
}

export function rollModifierChoices(snapshot: WorldSnapshot, count = 3): string[] {
  const unlocked = new Set(snapshot.meta.unlockedModifiers)
  const pool = MODIFIER_DEFS.filter((m) => {
    if (!m.requiresUnlock) return true
    return unlocked.has(m.requiresUnlock)
  })
  if (pool.length === 0) return []
  const copy = pool.slice()
  const out: string[] = []
  while (out.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy[idx].id)
    copy.splice(idx, 1)
  }
  return out
}
