/** Pillar A: chars/second threshold to classify as AI-generated */
export const AI_TOKEN_THRESHOLD_CPS = 80

/** Pillar A: max evaluations per second */
export const PILLAR_A_MAX_EVALS_PER_SEC = 2

/** Pillar B: minimum interval between evaluations (ms) */
export const PILLAR_B_MIN_INTERVAL_MS = 3000

/** Pillar C: debounce for AST parse (ms) */
export const PILLAR_C_DEBOUNCE_MS = 1000

/** Standby mode: idle threshold (ms) */
export const STANDBY_IDLE_THRESHOLD_MS = 5 * 60 * 1000

/** Standby mode: passive Raw Data per minute */
export const STANDBY_RAW_DATA_PER_MIN = 1

/** Entropy Creep spawn threshold: idle without standby (ms) */
export const ENTROPY_CREEP_THRESHOLD_MS = 30 * 60 * 1000
