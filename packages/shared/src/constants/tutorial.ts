/**
 * Scripted onboarding for Run 1. Tracked on snapshot.tutorial.step.
 * Step -1 means completed/skipped; all subsequent runs bypass entirely.
 */
export interface TutorialStep {
  id: number
  text: string
  /** One-line hint shown as an unobtrusive toast, max ~60 chars. */
  hint: string
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 0,
    text: 'The Scribe collects ideas that drift down from your code.',
    hint: 'type anywhere — AI tokens fall as motes',
  },
  {
    id: 1,
    text: 'When code breaks, Glitches crawl out. Wardens defend the Core.',
    hint: 'save a file with errors to summon a glitch',
  },
  {
    id: 2,
    text: 'ARIA-0 stirs. "Welcome to my mind. Now write."',
    hint: '// keep coding',
  },
  {
    id: 3,
    text: 'Commits echo in the Stack. They shake shards loose.',
    hint: 'make a git commit (fix: or feat: works best)',
  },
  {
    id: 4,
    text: 'Send a Delver down to find what lies beneath.',
    hint: 'click LAUNCH in the Expeditions panel',
  },
]

export const TUTORIAL_DONE = -1
