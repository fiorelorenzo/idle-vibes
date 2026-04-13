import * as vscode from 'vscode'
import * as path from 'path'

/**
 * Determines which files should be monitored by the parser.
 *
 * Rules:
 * 1. Only files inside workspace folders count as coding activity
 * 2. Excluded by default: node_modules, dist, out, .git, coverage, build artifacts
 * 3. Output channels, untitled docs, and extension-generated files are ignored
 * 4. User can override via settings (idleVibes.parser.include / exclude)
 */

const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/out/**',
  '**/.git/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/__pycache__/**',
  '**/build/**',
  '**/*.min.js',
  '**/*.min.css',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
]

export class WorkspaceFilter {
  private excludePatterns: string[]
  private includePatterns: string[] | null

  constructor() {
    const config = vscode.workspace.getConfiguration('idleVibes.parser')
    this.excludePatterns = config.get<string[]>('exclude', DEFAULT_EXCLUDE_PATTERNS)
    this.includePatterns = config.get<string[] | null>('include', null)

    // Re-read on config change
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('idleVibes.parser')) {
        const cfg = vscode.workspace.getConfiguration('idleVibes.parser')
        this.excludePatterns = cfg.get<string[]>('exclude', DEFAULT_EXCLUDE_PATTERNS)
        this.includePatterns = cfg.get<string[] | null>('include', null)
      }
    })
  }

  /**
   * Returns true if this document should be monitored by the parser.
   */
  shouldMonitor(document: vscode.TextDocument): boolean {
    // Ignore non-file schemes (output channels, untitled, git diffs, etc.)
    if (document.uri.scheme !== 'file') return false

    const filePath = document.uri.fsPath

    // Must be inside a workspace folder
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
    if (!workspaceFolder) return false

    // Check include patterns (if set, file must match at least one)
    if (this.includePatterns && this.includePatterns.length > 0) {
      const matches = this.includePatterns.some((pattern) =>
        this.matchGlob(filePath, pattern, workspaceFolder.uri.fsPath),
      )
      if (!matches) return false
    }

    // Check exclude patterns
    for (const pattern of this.excludePatterns) {
      if (this.matchGlob(filePath, pattern, workspaceFolder.uri.fsPath)) {
        return false
      }
    }

    return true
  }

  /**
   * Simple glob matching. Uses path segments for ** patterns.
   * For production, consider using picomatch — this covers the common cases.
   */
  private matchGlob(filePath: string, pattern: string, workspaceRoot: string): boolean {
    const relative = path.relative(workspaceRoot, filePath)

    // Convert glob to regex (simplified)
    const regexStr = pattern
      .replace(/\*\*/g, '___DOUBLESTAR___')
      .replace(/\*/g, '[^/]*')
      .replace(/___DOUBLESTAR___/g, '.*')
      .replace(/\?/g, '[^/]')

    return new RegExp(`^${regexStr}$`).test(relative)
  }
}
