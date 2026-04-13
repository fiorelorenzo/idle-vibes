export type GlitchType = 'bug_sprite' | 'exception_wraith' | 'corrupted_proxy' | 'entropy_creep'

export interface GlitchDefinition {
  type: GlitchType
  name: string
  trigger: string
  behavior: string
  vibeImpact: number
}

export interface Glitch {
  id: string
  type: GlitchType
  position: { x: number; y: number }
  spawnedAt: number
  /** The code error that triggered this glitch (clearing it removes the glitch) */
  triggerSource: string | null
  /** For Corrupted Proxy: the original proxy ID */
  sourceProxyId: string | null
}
