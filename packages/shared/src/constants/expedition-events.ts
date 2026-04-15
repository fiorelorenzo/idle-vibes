import type { ExpeditionEventDef } from '../types/roguelike.js'

/**
 * Pool of mid-expedition narrative events. When an expedition is active,
 * the host picks one every 2–3 minutes and emits an expedition_choice
 * event. The UI renders a choice card in the Event Feed; if the player
 * doesn't choose within 30 seconds, option A is auto-picked.
 *
 * The `outcome` string is an opaque tag consumed by ExpeditionManager
 * when computing final loot — positive tags increase shards/tokens,
 * negative ones introduce small risks.
 */
export const EXPEDITION_EVENTS: readonly ExpeditionEventDef[] = [
  {
    id: 'crack_of_light',
    prompt: 'A crack of light glows in the wall.',
    optionA: { label: 'pry it open', outcome: 'bonus_shards' },
    optionB: { label: 'keep walking', outcome: 'safe' },
    minLayerIndex: 0,
  },
  {
    id: 'ancient_rune',
    prompt: 'An ancient rune hums softly on the floor.',
    optionA: { label: 'copy it', outcome: 'bonus_focus' },
    optionB: { label: 'cover it', outcome: 'safe' },
    minLayerIndex: 0,
  },
  {
    id: 'abandoned_cache',
    prompt: 'An abandoned cache of motes.',
    optionA: { label: 'take all', outcome: 'bonus_tokens' },
    optionB: { label: 'leave half', outcome: 'safe' },
    minLayerIndex: 0,
  },
  {
    id: 'strange_wind',
    prompt: 'A strange wind — the Delver hesitates.',
    optionA: { label: 'push through', outcome: 'risk_big' },
    optionB: { label: 'turn back briefly', outcome: 'slight_delay' },
    minLayerIndex: 1,
  },
  {
    id: 'fallen_kin',
    prompt: 'A fallen Kin, half-buried in dust.',
    optionA: { label: 'revive them', outcome: 'kin_bonus' },
    optionB: { label: 'take their relic', outcome: 'bonus_relic_chance' },
    minLayerIndex: 1,
  },
  {
    id: 'ore_vein',
    prompt: 'A vein of glowing ore.',
    optionA: { label: 'mine it (slower)', outcome: 'bonus_shards_slow' },
    optionB: { label: 'mark it and move on', outcome: 'safe' },
    minLayerIndex: 1,
  },
  {
    id: 'whispering_shadow',
    prompt: 'A whispering shadow asks a question.',
    optionA: { label: 'answer honestly', outcome: 'bonus_focus' },
    optionB: { label: 'stay silent', outcome: 'safe' },
    minLayerIndex: 2,
  },
  {
    id: 'collapsed_passage',
    prompt: 'The passage ahead collapses.',
    optionA: { label: 'dig through', outcome: 'bonus_shards' },
    optionB: { label: 'find a detour', outcome: 'slight_delay' },
    minLayerIndex: 2,
  },
  {
    id: 'rogue_glitch',
    prompt: 'A rogue glitch trails the Delver.',
    optionA: { label: 'fight it', outcome: 'risk_small' },
    optionB: { label: 'outrun it', outcome: 'slight_delay' },
    minLayerIndex: 2,
  },
  {
    id: 'crystal_pool',
    prompt: 'A still pool of liquid crystal.',
    optionA: { label: 'drink', outcome: 'bonus_focus' },
    optionB: { label: 'collect a sample', outcome: 'bonus_tokens' },
    minLayerIndex: 2,
  },
  {
    id: 'aria_echo',
    prompt: 'ARIA-0 calls from the far dark.',
    optionA: { label: 'answer', outcome: 'bonus_relic_chance' },
    optionB: { label: 'keep going', outcome: 'safe' },
    minLayerIndex: 3,
  },
  {
    id: 'recursion_loop',
    prompt: 'A recursion loop folds the path.',
    optionA: { label: 'step through', outcome: 'risk_big' },
    optionB: { label: 'break the loop', outcome: 'slight_delay' },
    minLayerIndex: 3,
  },
  {
    id: 'merchant_spirit',
    prompt: 'A merchant spirit offers a trade.',
    optionA: { label: '10 shards for a relic', outcome: 'trade_shards_relic' },
    optionB: { label: 'decline', outcome: 'safe' },
    minLayerIndex: 2,
  },
  {
    id: 'forgotten_archive',
    prompt: 'A forgotten archive glows faintly.',
    optionA: { label: 'read every page', outcome: 'bonus_focus_big' },
    optionB: { label: 'grab what glitters', outcome: 'bonus_tokens_big' },
    minLayerIndex: 3,
  },
  {
    id: 'ruined_codex',
    prompt: 'A ruined codex — the pages still resonate.',
    optionA: { label: 'carry it back', outcome: 'legendary_relic_chance' },
    optionB: { label: 'memorize it', outcome: 'bonus_focus_big' },
    minLayerIndex: 3,
  },
]

/** Seconds between candidate event firings during an expedition. */
export const EXPEDITION_EVENT_INTERVAL_MS = 150_000
/** Probability of actually firing at each candidate interval. */
export const EXPEDITION_EVENT_CHANCE = 0.5
/** Auto-resolve to option A after this much time. */
export const EXPEDITION_CHOICE_AUTO_MS = 30_000
