import * as vscode from 'vscode'
import type { ParserPlugin, ParserEvent, ParserSignal } from '@idle-vibes/shared'
import { PILLAR_B_MIN_INTERVAL_MS } from '@idle-vibes/shared'

/**
 * Pillar B — Diagnostics Delta (Error Quality Analysis)
 *
 * Polls VS Code diagnostics on every file save, comparing error/warning
 * count before and after.
 */
export class PillarB implements ParserPlugin {
  readonly id = 'pillar-b-diagnostics'
  readonly pillar = 'B' as const
  readonly name = 'Diagnostics Delta'

  private lastEvalAt = 0
  private previousErrors = 0
  private previousWarnings = 0
  private initialized = false

  detect(event: ParserEvent): ParserSignal | null {
    if (event.kind !== 'diagnostic') return null

    const now = event.timestamp
    if (now - this.lastEvalAt < PILLAR_B_MIN_INTERVAL_MS) return null
    this.lastEvalAt = now

    const errorDelta = event.errorsAfter - event.errorsBefore

    if (errorDelta < 0) {
      return {
        type: 'errors_decreased',
        pillar: 'B',
        timestamp: now,
        value: Math.abs(errorDelta),
      }
    } else if (errorDelta > 0) {
      return {
        type: 'errors_increased',
        pillar: 'B',
        timestamp: now,
        value: errorDelta,
      }
    }

    return {
      type: 'errors_unchanged',
      pillar: 'B',
      timestamp: now,
      value: 0,
    }
  }

  /**
   * Snapshot current diagnostics state. Call before and after save
   * to compute the delta.
   */
  snapshotDiagnostics(): { errors: number; warnings: number } {
    let errors = 0
    let warnings = 0

    for (const [, diagnostics] of vscode.languages.getDiagnostics()) {
      for (const d of diagnostics) {
        if (d.severity === vscode.DiagnosticSeverity.Error) errors++
        else if (d.severity === vscode.DiagnosticSeverity.Warning) warnings++
      }
    }

    return { errors, warnings }
  }

  /**
   * Creates a DiagnosticEvent by comparing current state with previous snapshot.
   */
  createEvent(): ParserEvent {
    const current = this.snapshotDiagnostics()

    const event: ParserEvent = {
      kind: 'diagnostic',
      errorsBefore: this.initialized ? this.previousErrors : current.errors,
      errorsAfter: current.errors,
      warningsBefore: this.initialized ? this.previousWarnings : current.warnings,
      warningsAfter: current.warnings,
      timestamp: Date.now(),
    }

    this.previousErrors = current.errors
    this.previousWarnings = current.warnings
    this.initialized = true

    return event
  }
}
