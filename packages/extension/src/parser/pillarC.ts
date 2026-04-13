import * as vscode from 'vscode'
import type { ParserPlugin, ParserEvent, ParserSignal } from '@idle-vibes/shared'

/**
 * Pillar C — AST & Git Analysis (Structural Intelligence)
 *
 * Lightweight detection of structural code changes and git events.
 * Uses regex-based heuristics instead of full tree-sitter for the initial
 * implementation — tree-sitter WASM can be added later as an optimization.
 */
export class PillarC implements ParserPlugin {
  readonly id = 'pillar-c-structural'
  readonly pillar = 'C' as const
  readonly name = 'AST & Git Analysis'

  detect(event: ParserEvent): ParserSignal | null {
    if (event.kind !== 'git') return null

    const msg = event.message.toLowerCase()
    if (msg.startsWith('feat') || msg.includes('feat:') || msg.includes('feat(')) {
      return {
        type: 'git_commit_feat',
        pillar: 'C',
        timestamp: event.timestamp,
        value: 1,
        metadata: { message: event.message },
      }
    }
    if (msg.startsWith('fix') || msg.includes('fix:') || msg.includes('fix(')) {
      return {
        type: 'git_commit_fix',
        pillar: 'C',
        timestamp: event.timestamp,
        value: 1,
        metadata: { message: event.message },
      }
    }

    return {
      type: 'git_commit',
      pillar: 'C',
      timestamp: event.timestamp,
      value: 1,
      metadata: { message: event.message },
    }
  }

  /**
   * Detect structural patterns in text changes (class, function, interface declarations).
   * Returns signals for each detected pattern.
   */
  detectStructural(text: string, timestamp: number): ParserSignal[] {
    const signals: ParserSignal[] = []

    if (/\bclass\s+\w+/.test(text)) {
      signals.push({ type: 'new_class', pillar: 'C', timestamp, value: 1 })
    }
    if (/\bfunction\s+\w+/.test(text)) {
      signals.push({ type: 'new_function', pillar: 'C', timestamp, value: 1 })
    }
    if (/\b(interface|type)\s+\w+/.test(text)) {
      signals.push({ type: 'new_interface', pillar: 'C', timestamp, value: 1 })
    }

    return signals
  }

  /**
   * Attempt to detect the last git commit message.
   * Uses the VS Code Git extension API.
   */
  static async getLastCommitMessage(): Promise<string | null> {
    const gitExtension = vscode.extensions.getExtension('vscode.git')
    if (!gitExtension) return null

    const git = gitExtension.isActive ? gitExtension.exports : await gitExtension.activate()
    const api = git.getAPI(1)
    const repo = api.repositories[0]
    if (!repo) return null

    const log = await repo.log({ maxEntries: 1 })
    return log[0]?.message ?? null
  }
}
