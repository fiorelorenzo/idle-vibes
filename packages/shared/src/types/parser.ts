export type Pillar = 'A' | 'B' | 'C'

export type ParserSignalType =
  | 'ai_token_bundle'
  | 'errors_decreased'
  | 'errors_unchanged'
  | 'errors_increased'
  | 'new_class'
  | 'new_function'
  | 'new_interface'
  | 'git_commit'
  | 'git_commit_fix'
  | 'git_commit_feat'

export interface ParserSignal {
  type: ParserSignalType
  pillar: Pillar
  timestamp: number
  /** Raw numeric value (e.g. token count, error delta) */
  value: number
  metadata?: Record<string, unknown>
}

export interface ParserPlugin {
  id: string
  pillar: Pillar
  name: string
  detect(event: ParserEvent): ParserSignal | null
}

export type ParserEvent =
  | TextChangeEvent
  | DiagnosticEvent
  | GitEvent

export interface TextChangeEvent {
  kind: 'text_change'
  /** Characters inserted in this change */
  insertedLength: number
  /** Time span of the insertion in ms */
  durationMs: number
  /** Characters per second */
  charsPerSecond: number
  timestamp: number
}

export interface DiagnosticEvent {
  kind: 'diagnostic'
  errorsBefore: number
  errorsAfter: number
  warningsBefore: number
  warningsAfter: number
  timestamp: number
}

export interface GitEvent {
  kind: 'git'
  type: 'commit'
  message: string
  timestamp: number
}
