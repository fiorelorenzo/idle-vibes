/**
 * Theme colors resolved from VS Code CSS variables and pushed to the webview.
 * The webview may re-read its own getComputedStyle on top of this — this is
 * the authoritative fallback / initial value.
 */
export interface ThemeColors {
  editorBackground: string
  editorForeground: string
  panelBorder: string
  descriptionForeground: string
  errorForeground: string
  focusBorder: string
  chartsBlue: string
  chartsOrange: string
  chartsPurple: string
  chartsGreen: string
  chartsRed: string
  chartsYellow: string
  /** 'dark' | 'light' | 'high-contrast' | 'high-contrast-light' */
  kind: 'dark' | 'light' | 'hc-dark' | 'hc-light'
}
