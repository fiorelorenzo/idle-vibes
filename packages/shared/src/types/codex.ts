export type CodexCategory = 'resources' | 'proxies' | 'buildings' | 'vibe' | 'enemies' | 'lore'

export interface UnlockCondition {
  type:
    | 'first_encounter'
    | 'first_build'
    | 'first_recruit'
    | 'vibe_threshold'
    | 'prestige_count'
    | 'always'
  target?: string
  value?: number
}

export interface CodexEntry {
  id: string
  category: CodexCategory
  title: string
  unlockedBy: UnlockCondition
  content: string
  lockedPreview?: string
}
