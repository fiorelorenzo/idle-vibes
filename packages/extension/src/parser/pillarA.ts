import * as vscode from 'vscode'
import type { ParserPlugin, ParserEvent, ParserSignal } from '@idle-vibes/shared'
import { AI_TOKEN_THRESHOLD_CPS, PILLAR_A_MAX_EVALS_PER_SEC } from '@idle-vibes/shared'

/**
 * Pillar A — Log Tailing & Speed Analysis (AI Token Detection)
 *
 * Intercepts text document change events. When insertion rate exceeds
 * 80 chars/second in a single contiguous operation, the change is
 * classified as AI-generated.
 */
export class PillarA implements ParserPlugin {
  readonly id = 'pillar-a-ai-tokens'
  readonly pillar = 'A' as const
  readonly name = 'AI Token Detection'

  private lastEvalAt = 0
  private readonly minIntervalMs = 1000 / PILLAR_A_MAX_EVALS_PER_SEC

  detect(event: ParserEvent): ParserSignal | null {
    if (event.kind !== 'text_change') return null

    const now = event.timestamp
    if (now - this.lastEvalAt < this.minIntervalMs) return null
    this.lastEvalAt = now

    if (event.charsPerSecond >= AI_TOKEN_THRESHOLD_CPS && event.insertedLength > 10) {
      return {
        type: 'ai_token_bundle',
        pillar: 'A',
        timestamp: now,
        value: event.insertedLength,
      }
    }

    return null
  }

  /**
   * Creates a TextChangeEvent from a VS Code TextDocumentChangeEvent.
   * Call this from the parser coordinator.
   */
  static fromVscodeEvent(
    event: vscode.TextDocumentChangeEvent,
    durationMs: number,
  ): ParserEvent | null {
    let totalInserted = 0
    for (const change of event.contentChanges) {
      totalInserted += change.text.length
    }

    if (totalInserted === 0) return null

    return {
      kind: 'text_change',
      insertedLength: totalInserted,
      durationMs,
      charsPerSecond: durationMs > 0 ? (totalInserted / durationMs) * 1000 : totalInserted * 1000,
      timestamp: Date.now(),
    }
  }
}
