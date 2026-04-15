import * as vscode from 'vscode'
import type { ThemeColors } from '@idle-vibes/shared'
import type { ExtensionBridge } from '../bridge/host'

/**
 * Pushes VS Code theme colors to the webview.
 *
 * Note: VS Code's extension host can NOT read CSS custom properties — only
 * the webview can call getComputedStyle. So this bridge sends a KIND signal
 * (dark/light/hc-dark/hc-light) plus hardcoded fallbacks. The webview is
 * expected to read the authoritative values from its own document on receipt
 * and prefer those; the fallbacks here only matter before the webview DOM is
 * ready.
 */
export class ThemeBridge {
  private disposables: vscode.Disposable[] = []

  constructor(private readonly bridge: ExtensionBridge) {}

  start(): vscode.Disposable {
    this.push()
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => this.push()),
    )
    return new vscode.Disposable(() => this.dispose())
  }

  push(): void {
    const colors = resolveThemeColors()
    this.bridge.send({ type: 'ext:theme', colors })
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose())
    this.disposables = []
  }
}

function resolveThemeColors(): ThemeColors {
  const kind = mapThemeKind(vscode.window.activeColorTheme.kind)
  const isDark = kind === 'dark' || kind === 'hc-dark'

  if (isDark) {
    return {
      kind,
      editorBackground: '#1e1e1e',
      editorForeground: '#d4d4d4',
      panelBorder: '#2d2d30',
      descriptionForeground: '#a6a6a6',
      errorForeground: '#f48771',
      focusBorder: '#007fd4',
      chartsBlue: '#4daafc',
      chartsOrange: '#ff8c00',
      chartsPurple: '#b180d7',
      chartsGreen: '#89d185',
      chartsRed: '#f14c4c',
      chartsYellow: '#dcdcaa',
    }
  }

  return {
    kind,
    editorBackground: '#ffffff',
    editorForeground: '#333333',
    panelBorder: '#e5e5e5',
    descriptionForeground: '#717171',
    errorForeground: '#a1260d',
    focusBorder: '#0090f1',
    chartsBlue: '#1f78d1',
    chartsOrange: '#d18616',
    chartsPurple: '#652d90',
    chartsGreen: '#388a34',
    chartsRed: '#a1260d',
    chartsYellow: '#bf8803',
  }
}

function mapThemeKind(kind: vscode.ColorThemeKind): ThemeColors['kind'] {
  switch (kind) {
    case vscode.ColorThemeKind.Light:
      return 'light'
    case vscode.ColorThemeKind.HighContrast:
      return 'hc-dark'
    case vscode.ColorThemeKind.HighContrastLight:
      return 'hc-light'
    default:
      return 'dark'
  }
}
