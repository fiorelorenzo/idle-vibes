import { writable, get } from 'svelte/store'
import type { ThemeColors } from '@idle-vibes/shared'
import { bridge } from '../bridge/webview-bridge'

/**
 * Theme colors exposed to the webview.
 *
 * Precedence order:
 *   1. VS Code CSS custom properties (read on mount + on ext:theme messages)
 *   2. Host-provided fallbacks via ext:theme message
 *   3. Hardcoded dark-plus defaults (used before either of the above)
 *
 * Svelte components react to the store for DOM/CSS changes. The PixiJS
 * renderer is notified via the `onThemeChange` subscription.
 */

type ThemeChangeHandler = (colors: ThemeColors, ints: ThemeInts) => void

export interface ThemeInts {
  editorBackground: number
  editorForeground: number
  panelBorder: number
  descriptionForeground: number
  errorForeground: number
  focusBorder: number
  chartsBlue: number
  chartsOrange: number
  chartsPurple: number
  chartsGreen: number
  chartsRed: number
  chartsYellow: number
}

const FALLBACK: ThemeColors = {
  kind: 'dark',
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

export const theme = writable<ThemeColors>(FALLBACK)
export const themeInts = writable<ThemeInts>(colorsToInts(FALLBACK))

const handlers = new Set<ThemeChangeHandler>()

export function onThemeChange(handler: ThemeChangeHandler): () => void {
  handlers.add(handler)
  // Fire once with current value so subscribers initialize.
  handler(get(theme), get(themeInts))
  return () => handlers.delete(handler)
}

export function initThemeStore(): void {
  // Initial read: VS Code injects its CSS vars before the script runs,
  // but getComputedStyle can briefly return empty strings. Retry once on
  // next animation frame, then trust ext:theme as the final word.
  const tryRead = (): void => {
    const resolved = readCssVarsOrFallback()
    applyTheme(resolved)
  }
  tryRead()
  requestAnimationFrame(tryRead)

  bridge.onMessage((msg) => {
    if (msg.type !== 'ext:theme') return
    // On receipt, re-read CSS vars (VS Code has now certainly swapped them)
    // and fall back to the host-provided values for anything missing.
    const cssColors = readCssVarsOrNull()
    const merged: ThemeColors = cssColors ?? msg.colors
    applyTheme({ ...msg.colors, ...merged, kind: msg.colors.kind })
  })
}

function applyTheme(next: ThemeColors): void {
  theme.set(next)
  const ints = colorsToInts(next)
  themeInts.set(ints)
  handlers.forEach((h) => h(next, ints))
}

function readCssVarsOrFallback(): ThemeColors {
  const cssColors = readCssVarsOrNull()
  return cssColors ?? FALLBACK
}

function readCssVarsOrNull(): ThemeColors | null {
  if (typeof document === 'undefined') return null
  const style = getComputedStyle(document.body)
  const read = (name: string, fallback: string): string => {
    const v = style.getPropertyValue(name).trim()
    return v || fallback
  }
  const bg = read('--vscode-editor-background', '')
  if (!bg) return null

  return {
    kind: detectKind(bg),
    editorBackground: bg,
    editorForeground: read('--vscode-editor-foreground', FALLBACK.editorForeground),
    panelBorder: read('--vscode-panel-border', read('--vscode-editorWidget-border', FALLBACK.panelBorder)),
    descriptionForeground: read('--vscode-descriptionForeground', FALLBACK.descriptionForeground),
    errorForeground: read('--vscode-errorForeground', FALLBACK.errorForeground),
    focusBorder: read('--vscode-focusBorder', FALLBACK.focusBorder),
    chartsBlue: read('--vscode-charts-blue', FALLBACK.chartsBlue),
    chartsOrange: read('--vscode-charts-orange', FALLBACK.chartsOrange),
    chartsPurple: read('--vscode-charts-purple', FALLBACK.chartsPurple),
    chartsGreen: read('--vscode-charts-green', FALLBACK.chartsGreen),
    chartsRed: read('--vscode-charts-red', FALLBACK.chartsRed),
    chartsYellow: read('--vscode-charts-yellow', FALLBACK.chartsYellow),
  }
}

function detectKind(bgHex: string): ThemeColors['kind'] {
  // Heuristic: parse bg, average luminance < 0.5 = dark.
  const int = parseColor(bgHex)
  const r = (int >> 16) & 0xff
  const g = (int >> 8) & 0xff
  const b = int & 0xff
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum < 0.5 ? 'dark' : 'light'
}

export function colorsToInts(c: ThemeColors): ThemeInts {
  return {
    editorBackground: parseColor(c.editorBackground),
    editorForeground: parseColor(c.editorForeground),
    panelBorder: parseColor(c.panelBorder),
    descriptionForeground: parseColor(c.descriptionForeground),
    errorForeground: parseColor(c.errorForeground),
    focusBorder: parseColor(c.focusBorder),
    chartsBlue: parseColor(c.chartsBlue),
    chartsOrange: parseColor(c.chartsOrange),
    chartsPurple: parseColor(c.chartsPurple),
    chartsGreen: parseColor(c.chartsGreen),
    chartsRed: parseColor(c.chartsRed),
    chartsYellow: parseColor(c.chartsYellow),
  }
}

/** Parse #rrggbb / #rgb / rgb()/rgba() to a 24-bit integer. Returns 0x000000 on failure. */
export function parseColor(input: string): number {
  if (!input) return 0
  const s = input.trim().toLowerCase()
  if (s.startsWith('#')) {
    if (s.length === 7) return parseInt(s.slice(1), 16)
    if (s.length === 4) {
      const r = parseInt(s[1] + s[1], 16)
      const g = parseInt(s[2] + s[2], 16)
      const b = parseInt(s[3] + s[3], 16)
      return (r << 16) | (g << 8) | b
    }
  }
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (m) {
    return (parseInt(m[1], 10) << 16) | (parseInt(m[2], 10) << 8) | parseInt(m[3], 10)
  }
  return 0
}
