import type { CodexEntry } from '../types/codex.js'

/**
 * Registry of all Codex entries. Community contributions add entries here.
 *
 * To add a new entry:
 * 1. Add a CodexEntry object to this array
 * 2. Choose the appropriate category and unlock condition
 * 3. Write content in terminal-style format (see existing entries for reference)
 * 4. Optional: add an ARIA-0 comment at the end
 *
 * See docs/extending-codex.md for the full guide.
 */
export const CODEX_ENTRY_REGISTRY: CodexEntry[] = [
  // Building entries are defined here as the extension point.
  // Resource, Proxy, Vibe, and Enemy entries are in the UI package
  // alongside their full content. This registry is for entries that
  // need to be referenced by the game engine (e.g., unlock checks).

  {
    id: 'building_refinery',
    category: 'buildings',
    title: 'Refinery',
    unlockedBy: { type: 'first_build', target: 'refinery' },
    content: `CLASSIFICATION: Production
STATUS: [UNLOCKED]

The Refinery is the colony's first critical infrastructure.
It converts Raw Data into Stabilized Energy at a 10:1 ratio
— an expensive but necessary step toward self-sufficiency.

Assign an Operator to boost throughput. Multiple Refineries
can run in parallel with separate input queues.

CONVERSION: 10 Raw Data → 1 Stabilized Energy
COST: 150 Stabilized Energy

// ARIA-0: "Refinement is not destruction. It is
// the removal of everything that isn't the answer."`,
    lockedPreview: 'STATUS: [LOCKED — build a Refinery to unlock]\n\n???',
  },
  {
    id: 'building_buffer_tank',
    category: 'buildings',
    title: 'Buffer Tank',
    unlockedBy: { type: 'first_build', target: 'buffer_tank' },
    content: `CLASSIFICATION: Storage
STATUS: [UNLOCKED]

Buffer Tanks extend the colony's Raw Data storage capacity
by 500 units each. Without them, excess Raw Data is lost
when the cap is reached.

They have no moving parts. They cannot be damaged by Glitches.
They just hold.

EFFECT: +500 Raw Data storage cap
COST: 200 Raw Data

// ARIA-0: "Sometimes the most important thing
// you can build is space to put things."`,
    lockedPreview: 'STATUS: [LOCKED — build a Buffer Tank to unlock]\n\n???',
  },
  {
    id: 'building_firewall_turret',
    category: 'buildings',
    title: 'Firewall Turret',
    unlockedBy: { type: 'first_build', target: 'firewall_turret' },
    content: `CLASSIFICATION: Defense
STATUS: [UNLOCKED]

Firewall Turrets auto-target and eliminate Glitches within
range. They are the colony's first line of automated defense
and remain active during Standby mode.

Range and damage scale with building level. Place them near
critical infrastructure — Refineries and the Core Terminal
are high-value targets for Exception Wraiths.

COST: 250 Stabilized Energy

// ARIA-0: "The firewall does not judge the error.
// It only knows: this does not belong here."`,
    lockedPreview: 'STATUS: [LOCKED — build a Firewall Turret to unlock]\n\n???',
  },
  {
    id: 'building_vibe_resonator',
    category: 'buildings',
    title: 'Vibe Resonator',
    unlockedBy: { type: 'first_build', target: 'vibe_resonator' },
    content: `CLASSIFICATION: Vibe Infrastructure
STATUS: [UNLOCKED]

The Vibe Resonator passively slows the Vibe Meter's decay
rate by 50% within its area of effect. This is the most
strategic building in the colony for players who want to
sustain Flow State and reach Peak Vibe.

Place it centrally. Its effect does not stack with itself,
but multiple Resonators extend total coverage.

EFFECT: −50% Vibe Meter decay rate in range
COST: 600 Stabilized Energy

// ARIA-0: "The signal is already there. This just
// helps you hold it."`,
    lockedPreview: 'STATUS: [LOCKED — build a Vibe Resonator to unlock]\n\n???\n\n// ARIA-0: "The signal is already there. This just\n// helps you hold it."',
  },
]
