import * as vscode from 'vscode'
import type { ParserSignal } from '@idle-vibes/shared'
import { PILLAR_C_DEBOUNCE_MS } from '@idle-vibes/shared'
import { PillarA } from './pillarA'
import { PillarB } from './pillarB'
import { PillarC } from './pillarC'
import { WorkspaceFilter } from './workspace-filter'

type SignalListener = (signal: ParserSignal) => void

/**
 * The Smart Parser — unified coordinator for Pillars A, B, C.
 *
 * Listens to VS Code events, throttles/debounces per GDD spec,
 * filters by workspace rules, and emits ParserSignals to the game engine.
 */
export class SmartParser {
  private readonly pillarA = new PillarA()
  private readonly pillarB = new PillarB()
  private readonly pillarC = new PillarC()
  private readonly filter = new WorkspaceFilter()
  private readonly listeners: SignalListener[] = []
  private lastTextChangeAt = 0
  private lastKnownCommit: string | null = null
  private structuralDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private pendingStructuralText = ''

  /** Timestamp of last detected activity (for standby detection) */
  lastActivityAt = Date.now()

  onSignal(listener: SignalListener): vscode.Disposable {
    this.listeners.push(listener)
    return new vscode.Disposable(() => {
      const idx = this.listeners.indexOf(listener)
      if (idx >= 0) this.listeners.splice(idx, 1)
    })
  }

  /**
   * Inject a signal directly — used by the DevSimulator and by
   * non-leader instances forwarding signals.
   */
  inject(signal: ParserSignal): void {
    this.emit(signal)
  }

  private emit(signal: ParserSignal): void {
    for (const listener of this.listeners) {
      listener(signal)
    }
  }

  start(): vscode.Disposable {
    const disposables: vscode.Disposable[] = []

    // Pillar A: text change events — filtered by workspace rules
    disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (!this.filter.shouldMonitor(event.document)) return

        this.lastActivityAt = Date.now()
        const now = Date.now()
        const duration = now - this.lastTextChangeAt
        this.lastTextChangeAt = now

        const parserEvent = PillarA.fromVscodeEvent(event, duration)
        if (parserEvent) {
          const signal = this.pillarA.detect(parserEvent)
          if (signal) this.emit(signal)
        }

        // Queue structural detection (Pillar C) with debounce
        for (const change of event.contentChanges) {
          this.pendingStructuralText += change.text
        }
        this.scheduleStructuralDetection()
      }),
    )

    // Pillar B: diagnostics on save — filtered by workspace rules
    disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (!this.filter.shouldMonitor(document)) return

        this.lastActivityAt = Date.now()

        const event = this.pillarB.createEvent()
        const signal = this.pillarB.detect(event)
        if (signal) this.emit(signal)

        // Pillar C: check for git commits on save
        this.checkGitCommit()
      }),
    )

    return vscode.Disposable.from(...disposables)
  }

  private scheduleStructuralDetection(): void {
    if (this.structuralDebounceTimer) {
      clearTimeout(this.structuralDebounceTimer)
    }
    this.structuralDebounceTimer = setTimeout(() => {
      const text = this.pendingStructuralText
      this.pendingStructuralText = ''
      if (text.length > 0) {
        const signals = this.pillarC.detectStructural(text, Date.now())
        for (const signal of signals) {
          this.emit(signal)
        }
      }
    }, PILLAR_C_DEBOUNCE_MS)
  }

  private async checkGitCommit(): Promise<void> {
    try {
      const message = await PillarC.getLastCommitMessage()
      if (message && message !== this.lastKnownCommit) {
        this.lastKnownCommit = message
        const event = { kind: 'git' as const, type: 'commit' as const, message, timestamp: Date.now() }
        const signal = this.pillarC.detect(event)
        if (signal) this.emit(signal)
      }
    } catch {
      // Git extension not available — silently skip
    }
  }
}
