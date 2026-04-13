import * as vscode from 'vscode'
import type { ParserSignal } from '@idle-vibes/shared'

type SignalEmitter = (signal: ParserSignal) => void

/**
 * Dev-only simulator for testing parser integration without a real AI agent.
 *
 * Available via command palette when running in Extension Development Host:
 *   - idle_vibes: Simulate AI Burst
 *   - idle_vibes: Simulate Bug Introduced
 *   - idle_vibes: Simulate Bug Fixed
 *   - idle_vibes: Simulate Commit (feat)
 *   - idle_vibes: Simulate Commit (fix)
 *   - idle_vibes: Simulate Flow Session (continuous AI + clean code)
 */
export class DevSimulator {
  private flowInterval: ReturnType<typeof setInterval> | null = null

  constructor(private readonly emit: SignalEmitter) {}

  register(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand('idleVibes.sim.aiBurst', () => this.simulateAiBurst()),
      vscode.commands.registerCommand('idleVibes.sim.bugIntroduced', () => this.simulateBugIntroduced()),
      vscode.commands.registerCommand('idleVibes.sim.bugFixed', () => this.simulateBugFixed()),
      vscode.commands.registerCommand('idleVibes.sim.commitFeat', () => this.simulateCommit('feat')),
      vscode.commands.registerCommand('idleVibes.sim.commitFix', () => this.simulateCommit('fix')),
      vscode.commands.registerCommand('idleVibes.sim.flowSession', () => this.simulateFlowSession()),
      vscode.commands.registerCommand('idleVibes.sim.stopFlow', () => this.stopFlowSession()),
    )
  }

  /**
   * Simulates a burst of AI-generated tokens (e.g. Claude Code writing a function).
   * Emits multiple ai_token_bundle signals over ~3 seconds.
   */
  private simulateAiBurst(): void {
    vscode.window.showInformationMessage('[idle_vibes sim] AI burst — 5 token bundles over 3s')

    const bursts = [150, 280, 420, 350, 200]
    bursts.forEach((chars, i) => {
      setTimeout(() => {
        this.emit({
          type: 'ai_token_bundle',
          pillar: 'A',
          timestamp: Date.now(),
          value: chars,
          metadata: { simulated: true },
        })
      }, i * 600)
    })
  }

  /**
   * Simulates introducing 3 new errors (e.g. AI wrote broken code).
   */
  private simulateBugIntroduced(): void {
    vscode.window.showInformationMessage('[idle_vibes sim] 3 new errors introduced')
    this.emit({
      type: 'errors_increased',
      pillar: 'B',
      timestamp: Date.now(),
      value: 3,
      metadata: { simulated: true },
    })
  }

  /**
   * Simulates fixing 2 errors.
   */
  private simulateBugFixed(): void {
    vscode.window.showInformationMessage('[idle_vibes sim] 2 errors fixed')
    this.emit({
      type: 'errors_decreased',
      pillar: 'B',
      timestamp: Date.now(),
      value: 2,
      metadata: { simulated: true },
    })
  }

  /**
   * Simulates a git commit.
   */
  private simulateCommit(type: 'feat' | 'fix'): void {
    const message = type === 'feat'
      ? 'feat: add user authentication flow'
      : 'fix: resolve null pointer in session handler'

    vscode.window.showInformationMessage(`[idle_vibes sim] commit: ${message}`)
    this.emit({
      type: type === 'feat' ? 'git_commit_feat' : 'git_commit_fix',
      pillar: 'C',
      timestamp: Date.now(),
      value: 1,
      metadata: { simulated: true, message },
    })
  }

  /**
   * Simulates a sustained flow coding session.
   * Every 10 seconds: AI burst + occasional bug fix + structural detections.
   * This drives the vibe from wherever it is toward Flow State / Peak Vibe.
   */
  private simulateFlowSession(): void {
    if (this.flowInterval) {
      vscode.window.showWarningMessage('[idle_vibes sim] Flow session already running. Use "Stop Flow" first.')
      return
    }

    vscode.window.showInformationMessage('[idle_vibes sim] Flow session started — AI coding at full speed')

    let tick = 0
    this.flowInterval = setInterval(() => {
      tick++

      // AI token bundle every tick
      this.emit({
        type: 'ai_token_bundle',
        pillar: 'A',
        timestamp: Date.now(),
        value: 100 + Math.floor(Math.random() * 300),
        metadata: { simulated: true },
      })

      // Bug fix every 3rd tick
      if (tick % 3 === 0) {
        this.emit({
          type: 'errors_decreased',
          pillar: 'B',
          timestamp: Date.now(),
          value: 1,
          metadata: { simulated: true },
        })
      }

      // New function every 5th tick
      if (tick % 5 === 0) {
        this.emit({
          type: 'new_function',
          pillar: 'C',
          timestamp: Date.now(),
          value: 1,
          metadata: { simulated: true },
        })
      }

      // Feat commit every 30 seconds
      if (tick % 3 === 0) {
        this.emit({
          type: 'git_commit_feat',
          pillar: 'C',
          timestamp: Date.now(),
          value: 1,
          metadata: { simulated: true, message: `feat: simulated feature #${tick}` },
        })
      }
    }, 10_000)
  }

  private stopFlowSession(): void {
    if (this.flowInterval) {
      clearInterval(this.flowInterval)
      this.flowInterval = null
      vscode.window.showInformationMessage('[idle_vibes sim] Flow session stopped')
    }
  }

  dispose(): void {
    this.stopFlowSession()
  }
}
