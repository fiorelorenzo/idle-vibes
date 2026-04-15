import type { WorldSnapshot } from '@idle-vibes/shared'
import { ECHO_NODE_DEFS } from '@idle-vibes/shared'
import { resolveRelics, type RelicEffects } from './relic-engine'
import { resolveModifier, type ModifierEffects } from './modifier-engine'

/**
 * Aggregate all passive effects that apply to the current run, from
 * three sources: run modifier, equipped relics, and the permanent
 * Echo Tree purchases. Anything that touches gameplay numbers asks
 * this bus for its multipliers.
 *
 * Computed on demand — snapshots are tiny so there's no value in
 * memoizing with a version counter here.
 */
export interface RunEffects {
  // multipliers
  moteValueMul: number
  wardenDmgMul: number
  expeditionDurationMul: number
  expeditionFailDelta: number        // additive to fail rate, can be negative
  focusGainMul: number
  shardGainMul: number
  glitchHpMul: number
  glitchSpawnMul: number
  waveIntervalMul: number
  passiveTrickleMul: number
  echoesGainMul: number
  duskDurationMul: number
  bossDmgMul: number
  relicPowerMul: number              // wraps other relic multipliers

  // flat bonuses
  commitShardBonus: number
  startingTokens: number
  startingShards: number
  kinCapBonus: number
  layerStabilityBonus: number
  focusRegenPerMin: number
  maxRelicSlots: number

  // booleans / mutations
  suppressMoteRainUntilCommit: boolean
  expeditionDisabled: boolean
  wardensCarry: boolean
  coreGeneratesShards: boolean
  commitsAreFeats: boolean
  doubleExpedition: boolean
  moteAutopickup: boolean
  fixMakesGlitchesFlee: boolean
  recursiveFlow: boolean
  permanentAria: boolean
  reverseDescent: boolean
  shardBank: boolean
  blindDescent: boolean
  permaNight: boolean
  crescendoForever: boolean
  feastFamine: boolean
  ascetic: boolean
  noWardens: boolean
  brittleGlass: boolean
  autoRelic: boolean
  tinkerMode: boolean
}

const DEFAULT: RunEffects = {
  moteValueMul: 1,
  wardenDmgMul: 1,
  expeditionDurationMul: 1,
  expeditionFailDelta: 0,
  focusGainMul: 1,
  shardGainMul: 1,
  glitchHpMul: 1,
  glitchSpawnMul: 1,
  waveIntervalMul: 1,
  passiveTrickleMul: 1,
  echoesGainMul: 1,
  duskDurationMul: 1,
  bossDmgMul: 1,
  relicPowerMul: 1,
  commitShardBonus: 0,
  startingTokens: 0,
  startingShards: 0,
  kinCapBonus: 0,
  layerStabilityBonus: 0,
  focusRegenPerMin: 0,
  maxRelicSlots: 3,
  suppressMoteRainUntilCommit: false,
  expeditionDisabled: false,
  wardensCarry: false,
  coreGeneratesShards: false,
  commitsAreFeats: false,
  doubleExpedition: false,
  moteAutopickup: false,
  fixMakesGlitchesFlee: false,
  recursiveFlow: false,
  permanentAria: false,
  reverseDescent: false,
  shardBank: false,
  blindDescent: false,
  permaNight: false,
  crescendoForever: false,
  feastFamine: false,
  ascetic: false,
  noWardens: false,
  brittleGlass: false,
  autoRelic: false,
  tinkerMode: false,
}

export function computeRunEffects(snapshot: WorldSnapshot): RunEffects {
  const effects: RunEffects = { ...DEFAULT }
  applyEchoTree(snapshot, effects)
  applyRelics(snapshot, effects)
  applyModifier(snapshot, effects)
  applyBuildings(snapshot, effects)
  return effects
}

function applyBuildings(snapshot: WorldSnapshot, out: RunEffects): void {
  const gateCount = snapshot.buildings.filter((b) => b.kind === 'gate').length
  if (gateCount > 0) {
    // Each Delver Gate: -20% expedition duration, multiplicative.
    out.expeditionDurationMul *= Math.pow(0.8, gateCount)
  }
}

function applyEchoTree(snapshot: WorldSnapshot, out: RunEffects): void {
  for (const [nodeId, rank] of Object.entries(snapshot.meta.echoNodes)) {
    const def = ECHO_NODE_DEFS.find((n) => n.id === nodeId)
    if (!def || rank <= 0) continue
    const { grant } = def
    const v = (grant.value ?? 0) * rank
    switch (grant.kind) {
      case 'stat_mote_value':          out.moteValueMul *= 1 + v; break
      case 'stat_starting_tokens':     out.startingTokens += v; break
      case 'stat_expedition_speed':    out.expeditionDurationMul *= 1 - v; break
      case 'stat_kin_cap':             out.kinCapBonus += v; break
      case 'stat_warden_dmg':          out.wardenDmgMul *= 1 + v; break
      case 'stat_shard_gain':          out.shardGainMul *= 1 + v; break
      case 'stat_focus_gain':          out.focusGainMul *= 1 + v; break
      case 'stat_passive_trickle':     out.passiveTrickleMul *= 1 + v; break
      case 'stat_echoes_gain':         out.echoesGainMul *= 1 + v; break
      case 'stat_expedition_fail':     out.expeditionFailDelta -= v; break
      case 'stat_commit_shards':       out.commitShardBonus += v; break
      case 'stat_layer_stability':     out.layerStabilityBonus += v; break
      case 'stat_boss_dmg':            out.bossDmgMul *= 1 + v; break
      case 'stat_kin_hp':              /* snapshot-only for now */ break
      case 'stat_glitch_hp':           out.glitchHpMul *= 1 - v; break
      case 'stat_focus_regen':         out.focusRegenPerMin += v; break
      case 'stat_dusk_duration':       out.duskDurationMul *= 1 + v; break
      case 'stat_wave_delay':          out.waveIntervalMul *= 1 + v; break
      case 'stat_starting_shards':     out.startingShards += v; break
      case 'stat_relic_power':         out.relicPowerMul *= 1 + v; break
      case 'unlock_relic_slot':        out.maxRelicSlots += v; break
      case 'mutation_wardens_carry':   out.wardensCarry = true; break
      case 'mutation_passive_shards':  out.coreGeneratesShards = true; break
      case 'mutation_commits_are_feats': out.commitsAreFeats = true; break
      case 'mutation_double_expedition': out.doubleExpedition = true; break
      case 'mutation_mote_autopickup': out.moteAutopickup = true; break
      case 'mutation_fix_heals_glitches': out.fixMakesGlitchesFlee = true; break
      case 'mutation_recursive_flow':  out.recursiveFlow = true; break
      case 'mutation_permanent_aria':  out.permanentAria = true; break
      case 'mutation_reverse_descent': out.reverseDescent = true; break
      case 'mutation_shard_bank':      out.shardBank = true; break
      case 'unlock_auto_relic':        out.autoRelic = true; break
      case 'unlock_tinker_mode':       out.tinkerMode = true; break
      default:                         break
    }
  }
}

function applyRelics(snapshot: WorldSnapshot, out: RunEffects): void {
  const r: RelicEffects = resolveRelics(snapshot)
  // Apply the aggregated relic record to the run effects, scaled by
  // stat_relic_power. The "1+" centering keeps relicPowerMul neutral.
  const scale = out.relicPowerMul
  out.moteValueMul *= 1 + (r.moteValueMul - 1) * scale
  out.wardenDmgMul *= 1 + (r.wardenDmgMul - 1) * scale
  out.expeditionDurationMul *= 1 + (r.expeditionDurationMul - 1) * scale
  out.commitShardBonus += r.commitShardBonus * scale
  if (r.duskTokenTrickle) out.permanentAria = true
  if (r.brittleGlass) out.brittleGlass = true
}

function applyModifier(snapshot: WorldSnapshot, out: RunEffects): void {
  const m: ModifierEffects = resolveModifier(snapshot)
  out.moteValueMul *= m.moteValueMul
  out.expeditionDurationMul *= m.expeditionDurationMul
  out.expeditionDisabled = out.expeditionDisabled || m.expeditionDisabled
  out.glitchSpawnMul *= m.glitchSpawnMul
  out.focusGainMul *= m.focusMul
  out.suppressMoteRainUntilCommit =
    out.suppressMoteRainUntilCommit || m.suppressMoteRainUntilCommit

  // Modifier-specific flags — match by id to keep the engine lean.
  const id = snapshot.run.modifierId
  if (!id) return
  switch (id) {
    case 'ascetic': out.ascetic = true; out.maxRelicSlots = 0; break
    case 'frostbite': out.moteValueMul *= 2; break
    case 'crescendo_forever': out.crescendoForever = true; out.echoesGainMul *= 1.5; break
    case 'blind_descent': out.blindDescent = true; out.shardGainMul *= 3; break
    case 'no_wardens': out.noWardens = true; break
    case 'feast_famine': out.feastFamine = true; break
    case 'perma_night': out.permaNight = true; out.moteValueMul *= 2; break
    case 'glass_core': out.brittleGlass = true; break
    case 'one_shot': out.brittleGlass = true; break
    case 'recursion_echo': out.commitShardBonus += 1; out.glitchSpawnMul *= 1.5; break
    case 'shard_magnet': out.shardGainMul *= 2; out.moteValueMul *= 0.5; break
    case 'brittle_code': out.glitchSpawnMul *= 2; break
    case 'dual_expeditions': out.doubleExpedition = true; out.expeditionFailDelta += 0.1; break
    case 'golden_hour': out.duskDurationMul *= 2; break
    case 'iron_wardens': out.wardenDmgMul *= 1.5; break
    case 'quiet_streets': out.glitchSpawnMul *= 0.5; out.glitchHpMul *= 1.5; break
    case 'shallow_pockets': out.startingTokens = 0; break
  }
}
