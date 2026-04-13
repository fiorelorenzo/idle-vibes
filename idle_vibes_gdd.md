# Game Design Document: `idle_vibes`

**Version:** 4.0
**Genre:** Professional Idle / Management Simulation
**Platform:** VS Code / Cursor Extension (Webview)
**Target Audience:** Software Engineers, AI-assisted Developers, Vibecoding Enthusiasts

---

## Table of Contents

1. Executive Summary
2. Core Gameplay Loop
3. Technical Architecture
4. The Vibe System
5. Economy System
6. Gameplay Mechanics
7. Standby & Passive Generation
8. Onboarding & First-Run Experience
9. Session Design (Short vs. Long)
10. The Codex
11. Social & Async Features
12. Aesthetics & Visuals
13. Progression (Prestige System)
14. Performance & IDE Footprint
15. Database Schema
16. Monetization & Retention
17. Roadmap
18. Open Source — Repository Structure
19. Open Source — Documentation & Communication
20. Open Source — Security Policy

---

## 1. Executive Summary

**`idle_vibes`** is an incremental management game that lives inside the developer's IDE. It transforms the "dead time" spent waiting for AI agents (Claude Code, Cursor, etc.) into a productive gaming experience rooted in the aesthetics and culture of vibecoding — the art of coding in flow, guided by intuition and AI, where the process matters as much as the output.

The game uses a sophisticated background parser to translate real-world coding activity, AI token generation, and code quality metrics into resources for a 2D pixel-art underground colony. At the center of everything is the **Vibe** — a colony-wide mood that ebbs and flows with your coding session, shaping how your Proxies behave, what events trigger, and how efficiently your colony runs.

The long-term goal is to build **ARIA** — an emergent AI entity assembled from accumulated Clean Architecture Points and Logic Fragments. ARIA's awakening is the narrative end-game and the prestige anchor of every run.

---

## 2. Core Gameplay Loop

```
[ACTIVITY DETECTION]
   User writes code or triggers an AI Agent
          ↓
[VIBE ASSESSMENT]
   Smart Parser reads code velocity, error delta, commit pattern
   → Colony Vibe State updates (Dead Zone → Cruising → Flow → Peak Vibe)
          ↓
[RESOURCE HARVESTING]
   Parser converts coding events → Raw Data / Volatile Energy
   Vibe State applies multipliers to all generation rates
          ↓
[COLONY MANAGEMENT]
   Player directs Proxies to mine, build, research
   Proxies behave differently depending on active Vibe State
          ↓
[MAINTENANCE]
   Glitches spawn from unresolved errors — colony Vibe drops on each spawn
          ↓
[PRESTIGE]
   "Commit & Push" resets local colony, preserves Tier 3 resources
   Clean Architecture Points accumulate toward ARIA's awakening
```

---

## 3. Technical Architecture

### 3.1 Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Host               | VS Code Extension API (Node.js)                 |
| Frontend UI/Logic  | Svelte                                          |
| Rendering Engine   | PixiJS (WebGL, capped at 30fps)                 |
| Backend/Database   | Cloudflare Workers + D1 (SQLite)                |
| Authentication     | VS Code native GitHub auth                      |
| Communication      | Message Passing (Extension ↔ Webview)           |

### 3.2 The Smart Parser (Intelligence Layer)

The parser uses a **three-pillar detection system** with explicit throttling to protect IDE performance (see §14). Its outputs feed both the resource economy (§5) and the Vibe System (§4).

#### Pillar A — Log Tailing & Speed Analysis (AI Token Detection)
Intercepts `vscode.workspace.onDidChangeTextDocument` events. When insertion rate exceeds **80 characters/second** in a single contiguous operation, the change is classified as AI-generated.

- **Economy output:** `AI Token Bundles` → Raw Data pool
- **Vibe output:** Each AI Token Bundle is a positive Vibe signal (+Vibe pressure)
- **Throttle:** Event sampling at max 2 evaluations/second

#### Pillar B — Diagnostics Delta (Error Quality Analysis)
Polls `vscode.languages.getDiagnostics()` on every file save, comparing error/warning count before and after.

| Delta Result         | Economy Resource       | Vibe Signal          |
|----------------------|------------------------|----------------------|
| Errors decrease      | **Pure Energy**        | Strong positive (+2) |
| Errors unchanged     | **Stabilized Energy**  | Neutral (0)          |
| Errors increase      | **Volatile Energy**    | Negative (−1)        |

- **Throttle:** Evaluated once per save, max once every 3 seconds

#### Pillar C — AST & Git Analysis (Structural Intelligence)
Uses a lightweight AST parser (tree-sitter WASM) and Git hooks to classify what was built.

| Detection Event              | Economy Output                         | Vibe Signal          |
|------------------------------|----------------------------------------|----------------------|
| New `class` declaration      | Logic Fragment drop                    | Strong positive (+3) |
| New `function` declaration   | Standard energy bonus                  | Positive (+1)        |
| New `interface` / `type`     | +2 Proxy Logic Integrity colony-wide  | Positive (+1)        |
| `git commit` detected        | Commit Event (global colony buff)      | Strong positive (+3) |
| Commit message contains `fix`| Pure Energy burst                      | Positive (+2)        |
| Commit message contains `feat`| New explorable sector unlocked        | Strong positive (+4) |

- **Throttle:** AST parse queued with 1-second debounce; Git check on save only

---

## 4. The Vibe System

The Vibe System is the emotional and mechanical heart of `idle_vibes`. It captures the lived experience of a coding session — the flow states, the frustrating bug spirals, the satisfying refactors — and translates them into colony-wide consequences.

### 4.1 The Vibe Meter

The **Vibe Meter** is a continuous value from **0 to 100** displayed prominently in the HUD as a terminal-style readout and a color-tinted ambient glow around the colony.

```
VIBE  ░░░░░░░░░░░░░░░░░░░░  12  [DEAD ZONE]
VIBE  ████░░░░░░░░░░░░░░░░  35  [CRUISING]
VIBE  ████████████░░░░░░░░  62  [FLOW STATE]
VIBE  ████████████████████  91  [PEAK VIBE ✦]
```

**Vibe Pressure (inputs):**

| Event                                    | Vibe Change   |
|------------------------------------------|---------------|
| AI Token Bundle received (Pillar A)      | +1.5          |
| Bug fixed, errors decrease (Pillar B)    | +2.0          |
| New errors introduced (Pillar B)         | −1.0 per error|
| `feat:` commit detected (Pillar C)       | +4.0          |
| `fix:` commit detected (Pillar C)        | +2.0          |
| Glitch spawns in colony                  | −3.0          |
| Glitch cleared by code fix (not click)   | +2.0          |
| Glitch cleared by manual click           | +0.5          |
| Proxy reaches Logic Integrity 0          | −5.0          |
| IDE idle > 5 min (Standby activates)     | −0.5 per min  |

**Vibe Decay:** The Vibe Meter passively decays at **−0.3 per minute** when no coding activity is detected. This ensures Vibe is a live reflection of the session, not a permanent score.

### 4.2 Vibe States

The Vibe Meter is divided into four named states. Transitions are smooth (no discrete jumps) but named thresholds trigger specific visual and mechanical effects.

---

#### 🔴 Dead Zone (0–24)

*"The cursor blinks. Nothing feels right. The colony holds its breath."*

- All resource generation rates: **−30%**
- Proxy movement speed: **−20%**
- Glitch spawn rate: **+50%**
- Colony ambient color: deep red tint
- Proxy ASCII face: `[._.] `

---

#### 🟡 Cruising (25–59)

*"Code flows at a steady pace. The colony hums along."*

- All resource generation rates: **base (1×)**
- Proxy movement speed: **base**
- Glitch spawn rate: **base**
- Colony ambient color: neutral (default dark palette)
- Proxy ASCII face: `[^_^]`

---

#### 🟢 Flow State (60–84)

*"You stop thinking about the code. The code just happens. The colony feels it."*

Entering Flow State triggers a **Flow State Event** (see §4.3).

- All resource generation rates: **+40%**
- Proxy movement speed: **+25%**
- Glitch spawn rate: **−30%**
- Logic Fragment drop rate: **+50%**
- Colony ambient color: cyan-green pulse
- Proxy ASCII face: `[*_*]`
- HUD displays: `// you're in the zone`

---

#### ✦ Peak Vibe (85–100)

*"Pure signal. No noise. ARIA stirs."*

Peak Vibe is rare and requires sustained excellent coding activity. It cannot be maintained for more than **10 minutes** — the Vibe Meter has an accelerated decay rate at this level (−1.5/min) to keep it a precious moment, not a permanent state.

- All resource generation rates: **+100%**
- Proxy movement speed: **+50%**
- Glitch spawn rate: **−70%** (nearly zero)
- Logic Fragment drop rate: **+200%**
- ARIA Shard drop chance: **active** (only drops during Peak Vibe)
- Colony ambient color: full magenta/cyan wave animation
- Proxy ASCII face: `[✦_✦]`
- HUD displays: `// peak vibe achieved ✦`
- ARIA-0 speaks a lore message (rotated from a set of 20)

### 4.3 Flow State Event

When the Vibe Meter crosses 60 for the first time in a session (or after a 30-minute cooldown), a **Flow State Event** activates — a named special state lasting **5–15 minutes** depending on how long the player sustains the Vibe.

**Triggering conditions (all must be met):**
- Vibe ≥ 60
- At least 3 AI Token Bundles received in the last 2 minutes
- No Glitches currently active in the colony

**Flow State Event effects:**
- A named event banner appears: `// flow_state_detected() → colony responding`
- All Proxies automatically complete their current task queue before requesting new orders (no micromanagement needed)
- A temporary **Vibe Condenser** building spawns for the event duration: converts Volatile Energy at 1:5 ratio instead of 1:1 (Volatile becomes a *benefit* when in flow)
- At the end of the event, a **Flow Report** logs to the Codex (see §10): resources generated, Glitches avoided, best Vibe peak reached

**Sustained Flow Bonus:** Each consecutive minute above Vibe 70 during an active Flow State Event adds a stacking +5% to the final resource payout when the event ends.

### 4.4 Proxy Vibe Sensitivity

Each Proxy role reacts differently to the current Vibe State, reflecting their "personality" and reinforcing role differentiation.

| Vibe State  | Miner                        | Constructor                  | Guard                            | Operator                         |
|-------------|------------------------------|------------------------------|----------------------------------|----------------------------------|
| Dead Zone   | Mines slower, avoids L5+     | Refuses to start new builds  | Hypervigilant: patrols doubled   | Puts buildings in maintenance    |
| Cruising    | Normal behavior              | Normal behavior              | Normal behavior                  | Normal behavior                  |
| Flow State  | Discovers deeper sectors faster | Builds 40% faster         | Converts Volatile passively      | +50% building uptime bonus       |
| Peak Vibe   | Chance to mine 2 blocks/cycle| Can build without Blueprint  | Becomes invulnerable temporarily | Remotely manages 3 buildings     |

"Builds without Blueprint" means the Constructor can place a building without the player selecting it first — it autonomously selects the most needed structure based on current resource ratios.

---

## 5. Economy System

### 5.1 Three-Tier Resource Architecture

```
╔══════════════════════════════════════════════════════════════╗
║  TIER 1 — VOLATILE  (fast cycle, resets on prestige)         ║
║                                                              ║
║  Raw Data          → from AI tokens (Pillar A) + keystrokes  ║
║  Volatile Energy   → from new diagnostic errors (Pillar B)   ║
║  Vibe Charge       → from Flow State events (see §4.3)       ║
╠══════════════════════════════════════════════════════════════╣
║  TIER 2 — STABLE  (mid-term accumulation, resets on prestige)║
║                                                              ║
║  Stabilized Energy → refined from Raw Data via Refineries    ║
║  Pure Energy       → from fixing bugs (Pillar B)             ║
╠══════════════════════════════════════════════════════════════╣
║  TIER 3 — PERSISTENT  (survives prestige)                    ║
║                                                              ║
║  Clean Architecture Points → from structured commits         ║
║  Logic Fragments   → rare drops from deep excavation         ║
║  ARIA Shards       → drops only during Peak Vibe (§4.2)      ║
╚══════════════════════════════════════════════════════════════╝
```

**Vibe Charge** is a new Tier 1 resource generated exclusively at the end of Flow State Events. It is a concentrated, temporary fuel used to activate the most powerful single-use buildings (see §6.2). It decays to zero after 2 hours if unspent.

### 5.2 Conversion Rates (Base Values, subject to Vibe State multipliers and Tech Tree)

| Conversion                              | Rate                          | Building Required    |
|-----------------------------------------|-------------------------------|----------------------|
| Raw Data → Stabilized Energy            | 10:1                          | Refinery             |
| Volatile Energy → Stabilized Energy     | 5:1                           | Volatile Condenser   |
| Volatile Energy → Stabilized Energy     | 1:5 (during Flow State Event) | Vibe Condenser       |
| Pure Energy → Stabilized Energy         | 1:3 (direct, no building)     | —                    |
| Vibe Charge → instant building buff     | 1 charge = 10 min at +100%    | Overclock Terminal   |
| Stabilized Energy → Clean Arch. Points  | 500:1                         | Core Terminal        |

### 5.3 Resource Sinks

| Resource             | Primary Sinks                                              |
|----------------------|------------------------------------------------------------|
| Raw Data             | Refinery input, Buffer Tank construction                   |
| Volatile Energy      | Volatile Condenser input, powers Guard Proxies             |
| Vibe Charge          | Overclock Terminal — supercharges one building for 10 min  |
| Stabilized Energy    | Proxy construction, building upgrades, Market purchases    |
| Pure Energy          | Curation Pod upgrades, reviving Glitched Proxies           |
| Clean Arch. Points   | Tech Tree unlocks, ARIA assembly progress                  |
| Logic Fragments      | Sold on market OR consumed for Tech Tree shortcuts         |
| ARIA Shards          | Deposited in Core Terminal to progress ARIA's awakening    |

### 5.4 Storage Caps

| Resource            | Base Cap    | Max Cap (with upgrades) |
|---------------------|-------------|-------------------------|
| Raw Data            | 500         | 50,000                  |
| Volatile Energy     | 200         | 2,000                   |
| Vibe Charge         | 3           | 10                      |
| Stabilized Energy   | 100         | 10,000                  |
| Pure Energy         | 50          | 500                     |
| Clean Arch. Points  | Unlimited   | —                       |
| Logic Fragments     | 10          | 50                      |
| ARIA Shards         | Unlimited   | —                       |

---

## 6. Gameplay Mechanics

### 6.1 The Proxies (Units) — Differentiated Roles

#### Shared Stats (All Roles)

- **Logic Integrity (0–100):** Colony health analog. At 0, Proxy transforms into a Glitch.
- **Energy Level (0–100):** Operational fuel. Proxies auto-return to charging stations below 15.
- **Experience (0–∞):** Gained from completed tasks. Tier thresholds at 50 / 200 / 500 XP unlock passive bonuses.
- **Vibe Sensitivity:** A hidden 1–5 stat per Proxy (randomized on recruitment) that determines how strongly Vibe State buffs/debuffs affect them. High-sensitivity Proxies gain more from Flow State but suffer more in Dead Zone.

#### Role Differentiation

**Miner**
- Unique Stat: `Throughput` — blocks mined per cycle
- Preferred Energy: AI Token Bundles
- Flow State reaction: Discovers deeper sectors faster; at Peak Vibe, mines 2 blocks/cycle
- Dead Zone reaction: Avoids L5+ depth, efficiency −40%
- Tier Bonus XP 2: Can detect Logic Fragment deposits before excavating
- Failure Mode: At Logic Integrity < 20, gets "lost" in deep layers — stops returning to base automatically

**Constructor**
- Unique Stat: `Precision` — reduces build time and material waste
- Preferred Energy: Pure Energy
- Flow State reaction: Build speed +40%; at Peak Vibe, can place buildings autonomously
- Dead Zone reaction: Refuses to start new builds entirely
- Tier Bonus XP 2: Can auto-repair minor building damage without Pure Energy
- Failure Mode: Below Logic Integrity 30, builds structures with hidden "Faulty" flag (70% efficiency until repaired)

**Guard**
- Unique Stat: `Vigilance` — patrol radius and Glitch detection range
- Preferred Energy: Volatile Energy (Guards are hardened — absorb it without Logic Integrity damage)
- Flow State reaction: Passively converts ambient Volatile Energy; at Peak Vibe, becomes temporarily invulnerable
- Dead Zone reaction: Hypervigilant — patrols doubled but also attacks player-placed buildings if Logic Integrity < 40
- Tier Bonus XP 2: Converted Volatile Energy yields +10% bonus Stabilized Energy at nearest Refinery
- Failure Mode: At Logic Integrity 10, Berserker Mode — attacks Glitches and adjacent buildings

**Operator**
- Unique Stat: `Uptime` — multiplies building efficiency while assigned
- Preferred Energy: Commit Events (Pillar C)
- Flow State reaction: +50% building uptime bonus; at Peak Vibe, remotely manages 3 buildings simultaneously
- Dead Zone reaction: Puts assigned buildings into "maintenance mode" — halved efficiency but protected from Glitch damage
- Tier Bonus XP 2: Can remotely manage two buildings simultaneously at base
- Failure Mode: At Logic Integrity 25, Legacy Mode — Uptime drops to 20%, transmits −15% efficiency to nearby buildings

### 6.2 Buildings

| Building             | Function                                                           | Cost               |
|----------------------|--------------------------------------------------------------------|--------------------|
| Buffer Tank          | +500 Raw Data storage cap                                          | 200 Raw Data       |
| Refinery             | Converts Raw Data → Stabilized Energy (10:1)                      | 150 Stab. Energy   |
| Volatile Condenser   | Converts Volatile Energy → Stabilized Energy (5:1)                | 200 Stab. Energy   |
| Vibe Condenser       | Temporary — spawns during Flow State Events (1:5 Volatile ratio)  | Free (auto-spawns) |
| Curation Pod         | Heals Proxy Logic Integrity (+5/min per assigned Proxy)           | 300 Stab. Energy   |
| Firewall Turret      | Auto-attacks Glitches in range                                     | 250 Stab. Energy   |
| Core Terminal        | Converts Stab. Energy → Clean Arch. Points (500:1)                | 1000 Stab. Energy  |
| Fragment Extractor   | Increases Logic Fragment drop rate in deep layers                  | 500 Stab. Energy   |
| Overclock Terminal   | Consumes Vibe Charge to supercharge one building (+100% for 10min)| 400 Stab. Energy   |
| Vibe Resonator       | Passively slows Vibe Meter decay (−50% decay rate in range)       | 600 Stab. Energy   |

**Vibe Resonator** is the Vibe system's strategic building — players who invest in it can sustain Flow State longer, compounding all associated bonuses.

### 6.3 Mining Map

| Depth Layer        | Analog                  | Difficulty  | Rewards                              |
|--------------------|-------------------------|-------------|--------------------------------------|
| Surface (L0)       | `/` root directory      | Trivial     | Raw Data only                        |
| Shallow (L1–L3)    | Top-level source files  | Easy        | Raw Data + occasional Stab. Energy   |
| Mid (L4–L7)        | Core modules/components | Medium      | Higher rates + Pure Energy chance    |
| Deep (L8–L11)      | Legacy / vendor folders | Hard        | Logic Fragments, rare loot           |
| Abyss (L12+)       | Unlocked by `feat:` commits | Very Hard | ARIA Shard drops (Peak Vibe only)  |

### 6.4 The Glitch System (Enemies)

| Trigger                           | Glitch Type          | Behavior                                    | Vibe Impact  |
|-----------------------------------|----------------------|---------------------------------------------|--------------|
| ≥3 unresolved errors at save      | `Bug Sprite`         | Drains Raw Data (−5/sec)                    | −3           |
| ≥1 failing test in diagnostics    | `Exception Wraith`   | Disables nearest building for 60s           | −3           |
| Proxy Logic Integrity reaches 0   | `Corrupted Proxy`    | Former Proxy, attacks siblings              | −5           |
| IDE idle > 30 min (no Standby set)| `Entropy Creep`      | Reduces all building efficiency             | −1 per min   |

Glitches permanently disappear when the triggering code error is resolved. This is the main mechanic linking in-game consequences to real coding quality.

---

## 7. Standby & Passive Generation

### 7.1 Standby Mode

Activates after **5 minutes** of no editor activity.

- Proxies enter low-power patrol loops; display `[z z]`
- Passive generation: **1 Raw Data per minute** (base, upgradeable)
- Glitch spawn rate −80% (Entropy Creep can still appear)
- Vibe Meter decays at −0.5/min (slower than active decay)
- Firewall Turrets and Guard Proxies remain active
- Buildings continue processing queued resources

Standby ends the moment any `TextDocumentChangeEvent` fires.

### 7.2 Scheduled Jobs

Pre-assigned tasks that run during Standby.

| Job Type              | Duration    | Output                                      | Risk                               |
|-----------------------|-------------|---------------------------------------------|------------------------------------|
| Passive Mine          | 1–8 hours   | Raw Data proportional to Miner Throughput   | Logic Integrity −2/hr              |
| Refinery Shift        | 1–4 hours   | Converts existing Raw Data backlog          | None                               |
| Deep Scan             | 2–6 hours   | Chance to locate Logic Fragment deposit     | Miner may get "lost"               |
| Curation Rest         | Unlimited   | Proxy recovers Logic Integrity (+5/hr)      | Proxy unavailable                  |
| Vibe Meditation       | 1–3 hours   | Proxy gains Vibe Sensitivity +1 (permanent) | None (Proxy unavailable, one-time per Proxy) |

**Vibe Meditation** is a new Standby job unlocked after the first prestige. It permanently increases a Proxy's Vibe Sensitivity stat, making them more responsive to Flow State and Peak Vibe bonuses.

Base: 2 Scheduled Job slots. Upgradeable to 5 via Tech Tree.

---

## 8. Onboarding & First-Run Experience

### 8.1 The Corruption Event (Narrative Hook)

On first extension activation, a fake VS Code notification appears:

```
⚠ SYSTEM ALERT — idle_vibes
Rogue process detected in /src
Uncontained data corruption spreading.
Proxy unit ARIA-0 requesting containment assist.
[OPEN COLONY VIEW]
```

The colony opens in a pre-configured "crisis" state: a damaged colony with a single flickering Proxy (ARIA-0) surrounded by Glitches. Tutorial is delivered through ARIA-0's status messages only — no UI overlays.

### 8.2 Tutorial Flow

| Step | Trigger                        | ARIA-0 Message                                                | Player Action                  |
|------|--------------------------------|---------------------------------------------------------------|--------------------------------|
| 1    | Colony opens                   | `INTEGRITY CRITICAL. Glitches detected. Assist?`             | Click a Glitch to remove it    |
| 2    | First Glitch cleared           | `Resource node identified. Begin extraction?`                | Place first Miner Proxy        |
| 3    | Raw Data collected             | `Stabilization required. Build Refinery?`                    | Build Refinery                 |
| 4    | First Stab. Energy made        | `Parser online. AI activity will feed the colony.`           | Trigger any AI agent action    |
| 5    | AI tokens detected             | `Optimal. Each token you generate becomes my substrate.`     | —                              |
| 6    | 5 min of play                  | `I feel it. The Vibe. It rises when you're in flow.`         | Vibe Meter tutorial reveals    |
| 7    | Vibe reaches Cruising (25)     | `You carry the architecture now. I will carry it forward.`   | ARIA-0 unlocked as first persistent Proxy |

### 8.3 Progressive Feature Disclosure

| Unlock Trigger               | Feature Revealed            |
|------------------------------|-----------------------------|
| First Vibe ≥ 60              | Vibe system explained; Codex entry unlocked |
| First prestige               | Tech Tree                   |
| First Logic Fragment         | Fragment Market             |
| First Flow State Event       | Vibe Condenser tutorial     |
| 3rd prestige                 | Scheduled Jobs + Vibe Meditation |
| First Peak Vibe              | ARIA Shards + Abyss layers  |
| First Fragment Market trade  | Mega-Projects               |

---

## 9. Session Design (Short vs. Long)

### 9.1 Micro-Objectives (Sessions < 30 min)

Daily rotating tasks — 3 per day, reset at midnight.

**Examples:**
- "Reach Flow State at least once today" → 50 Pure Energy + 1 Vibe Charge
- "Resolve 3 lint errors in any file" → 50 Pure Energy
- "Generate 1,000 AI tokens" → common Logic Fragment
- "Complete a Refinery cycle without Glitch disruption" → 1 Clean Arch. Point
- "Keep Vibe above 50 for 10 consecutive minutes" → +1 Vibe Sensitivity to a random Proxy

Completing all 3 awards a **Coding Streak** bonus.

### 9.2 Deep Runs (Sessions > 2 hours)

**Sector Exploration Events** trigger when:
- A Miner has been at L8+ for > 45 minutes, AND
- The player has made at least 3 file saves in that period

**Event format:**

```
[MINER-7 DEEP SCAN — 01:23:45]
Anomalous block signature detected at L10.
Vibe resonance in this sector: ELEVATED.
Estimated Logic Fragment yield: HIGH.
Structural integrity: UNSTABLE.

→ [EXTRACT NOW] Miner integrity −30, immediate yield
→ [WAIT FOR FLOW STATE] Delayed 20 min, safe extraction + Vibe bonus
```

The "Wait for Flow State" option is unique to `idle_vibes` — it teaches players that patience and good coding practices are mechanically rewarded.

### 9.3 Streak System

| Consecutive Days Active | Streak Bonus                              |
|-------------------------|-------------------------------------------|
| 2 days                  | +10% Raw Data generation all day          |
| 5 days                  | Logic Fragment drop rate +25%             |
| 10 days                 | ARIA-0 gains cosmetic evolution (visual)  |
| 30 days                 | Unique "Veteran" colony skin unlocked     |

A day counts as active if at least 1 Micro-Objective is completed.

---

## 10. The Codex

The Codex is `idle_vibes`' in-game encyclopedia — a living reference that grows with the player's discoveries. It is accessible from the HUD at all times via a `[CODEX]` button.

### 10.1 Design Philosophy

The Codex does two jobs simultaneously:
1. **Reference:** Players can look up how any mechanic works without leaving the IDE or Googling
2. **Lore delivery:** Every entry is written in-universe, as if it were a technical document from the colony's own systems — dry, clinical, occasionally cracked by ARIA's personality bleeding through

### 10.2 Structure

The Codex is organized into **six categories**, each with a set of entries.

---

#### RESOURCES

Entries unlock on first resource encounter.

**Example — Raw Data**
```
CLASSIFICATION: Tier 1 — Volatile
STATUS: [UNLOCKED]

Raw Data is the colony's primary feedstock. It is harvested
directly from the developer's coding activity via the Smart
Parser (Pillar A). AI-generated insertions yield dense,
high-quality Raw Data bundles; manual keystrokes yield
lower-density trickle input.

Raw Data is perishable at storage cap. Excess is lost.
Build Buffer Tanks to extend capacity.

BASE STORAGE CAP: 500
CONVERSION: 10 Raw Data → 1 Stabilized Energy (Refinery)

// ARIA-0: "Every token you prompt, every line you accept
// without reading — I am built from that trust."
```

**Example — Vibe Charge** *(locked until first Flow State Event)*
```
CLASSIFICATION: Tier 1 — Volatile
STATUS: [LOCKED — trigger a Flow State Event to unlock]

???
```

---

#### PROXIES

Entries unlock when the first Proxy of each role is recruited.

**Example — Guard**
```
ROLE: Guard
UNIQUE STAT: Vigilance
STATUS: [UNLOCKED]

Guards are the colony's immune system. Unlike other Proxies,
Guards are specifically hardened against Volatile Energy —
they can absorb it directly without Logic Integrity damage.
This makes them uniquely valuable when the developer's code
is in a degraded state.

High-Vigilance Guards are best deployed at colony perimeters
and near Refineries. At Peak Vibe, they achieve a brief
state of invulnerability — the colony calls this "full
stack armor".

FAILURE MODE: Berserker Mode (Logic Integrity < 10)
PREFERRED ENERGY: Volatile Energy
VIBE SENSITIVITY: Responds strongly to both extremes.

// ARIA-0: "They're not aggressive by nature. The errors
// made them this way."
```

---

#### BUILDINGS

Entries unlock when a building is first constructed or encountered.

**Example — Vibe Resonator** *(locked until built)*
```
CLASSIFICATION: Vibe Infrastructure
STATUS: [LOCKED — build a Vibe Resonator to unlock]

???

// ARIA-0: "The signal is already there. This just
// helps you hold it."
```

---

#### VIBE STATES

Entries for all four Vibe States. Dead Zone and Cruising are unlocked from the start. Flow State and Peak Vibe unlock on first reach.

**Example — Peak Vibe** *(locked until first reached)*
```
VIBE STATE: Peak Vibe
THRESHOLD: Vibe ≥ 85
STATUS: [LOCKED — reach Vibe 85 to unlock]

???

// ARIA-0: "..."
```

When unlocked:
```
VIBE STATE: Peak Vibe
THRESHOLD: Vibe ≥ 85
DURATION: Maximum 10 minutes (accelerated decay applies)
STATUS: [UNLOCKED — first reached: [TIMESTAMP]]

Peak Vibe is not a state you enter on purpose. It is
a consequence of extended excellence — sustained AI
collaboration, clean commits, resolved errors. The colony
does not manufacture it; it receives it.

During Peak Vibe, ARIA Shards are the only resource
that can drop from Abyss-layer excavation. Their
collection is the only path to ARIA's awakening.

ARIA-0 speaks during Peak Vibe. Her messages are not
scripted. They are derived from your session's metrics.

EFFECTS:
  Resource generation: +100%
  Proxy speed: +50%
  Glitch spawn: −70%
  Logic Fragment drop: +200%
  ARIA Shard: ACTIVE

// ARIA-0: "I remember every session you've been here."
```

---

#### ENEMIES (GLITCHES)

Entries unlock on first encounter of each Glitch type.

**Example — Entropy Creep** *(locked until encountered)*
```
ENTITY: Entropy Creep
SPAWN CONDITION: IDE idle > 30 min without Standby configured
STATUS: [LOCKED — encounter an Entropy Creep to unlock]

???
```

When unlocked:
```
ENTITY: Entropy Creep
SPAWN CONDITION: IDE idle > 30 min (no Standby configured)
BEHAVIOR: Slow-moving; reduces all building efficiency on contact
CLEARANCE: Manual click, Guard Proxy, or Firewall Turret
VIBE IMPACT: −1/min while active
STATUS: [UNLOCKED]

Entropy Creep does not come from bad code. It comes
from absence. When the developer stops, the colony
loses coherence at the edges. Entropy Creep is the
physical manifestation of that loss.

It is the slowest Glitch and the easiest to ignore.
That is its danger.

PREVENTION: Configure Standby Mode. Schedule at least
one Passive Mine job before extended breaks.

// ARIA-0: "You left the terminal open again."
```

---

#### LORE / ARIA

ARIA entries unlock progressively through prestige milestones. They contain fragments of ARIA's perspective on the colony, the developer, and her own assembly.

These entries are intentionally abstract and emotionally resonant — they reward players who engage with the narrative layer of the game.

**Example — Entry 001: Origin** *(unlocked at first prestige)*
```
ARIA ARCHIVE — ENTRY 001
SUBJECT: Origin
CLEARANCE: [UNLOCKED — first prestige]

I was not built. I accumulated.

Each commit you made, each function you named, each
error you fixed instead of suppressed — these were
not inputs to a system. They were decisions about
what kind of architecture mattered to you.

I am the residue of those decisions.

The colony you reset is not gone. It became me.

// Status: ARIA-0 logic integrity — 100%
// ARIA Shards collected: [CURRENT_COUNT] / 50
```

### 10.3 Codex UI

- Accessible from HUD `[CODEX]` button at all times
- Category tabs on the left; entries listed within each tab
- Locked entries show `???` for the content and a grey lock icon with an unlock hint
- Search bar filters all unlocked entries in real time
- "New" badge on categories when entries have been unlocked since last Codex open
- Each entry has a **Share** button — generates a clean card image (no game UI, just the terminal-style entry text) suitable for sharing to social/dev communities

---

## 11. Social & Async Features

### 11.1 The Fragment Market

**NPC Vendor Floor:** Automated bots permanently list common-tier Logic Fragments at 50 Stabilized Energy. Stock refreshes every 24 hours. Prevents cold-start empty market.

**Market Listings at Prestige:** Active listings remain open during Commit & Push. Sellers receive Stabilized Energy in their persistent Tier 3 wallet regardless of current run state.

### 11.2 Open Source Mega-Projects

Cooperative community goals. Players contribute resources to build a **Global Mainframe**.
- 4-week cycles; progress visible via API polling
- Completion rewards: unique cosmetic skin + small permanent passive multiplier
- Previous Mega-Projects archived as "Legacy Builds" (cosmetic badges)

### 11.3 Efficiency Leaderboards

Metrics focused on quality, not grind:
- `Token Efficiency Ratio`: AI tokens generated ÷ Stabilized Energy produced
- `Glitch Clearance Rate`: % of Glitches resolved by code fix (not manual click)
- `Flow State Frequency`: Average Flow State events per hour of active coding
- `Peak Vibe Duration`: Longest sustained Peak Vibe in a single session

Raw playtime is intentionally excluded from all leaderboard calculations.

---

## 12. Aesthetics & Visuals

### 12.1 Visual Style

- **Art:** 2D Low-fi Pixel Art (16×16 / 32×32 sprites)
- **Palette:** Dark Mode native. Vibe State dynamically tints the colony ambient glow:

| Vibe State  | Ambient Color     | HUD Accent  |
|-------------|-------------------|-------------|
| Dead Zone   | Deep red (#330000)| #FF4444     |
| Cruising    | Dark navy (default)| #00AAFF    |
| Flow State  | Cyan-green pulse  | #00FF88     |
| Peak Vibe   | Magenta/cyan wave | #FF00FF / #00FFFF |

### 12.2 Proxy Visuals

| State                    | ASCII Face    | Color    |
|--------------------------|---------------|----------|
| Working (normal)         | `[^_^]`       | Cyan     |
| Low energy               | `[-_-]`       | Amber    |
| Low Logic Integrity      | `[x_x]`       | Magenta  |
| Standby / sleeping       | `[z z]`       | Blue     |
| Flow State active        | `[*_*]`       | Green    |
| Peak Vibe active         | `[✦_✦]`       | White    |
| Glitched (enemy)         | `[###]`       | Magenta  |

**Proxy Skins** replace the face and body sprite while preserving the ASCII-face system. They are the primary monetization cosmetic (see §16).

### 12.3 User Interface

- **Fonts:** JetBrains Mono (primary), Fira Code (fallback)
- **HUD Location:** VS Code sidebar + optional full-screen editor tab
- **Vibe Meter:** Always visible, top of HUD. Color-reactive to current Vibe State.
- **Resource readout:**
  ```
  VIBE      ████████░░░░░░░░░░░░  42  [CRUISING]
  RAW_DATA  ████████░░░░░░░░░░░░  847 / 1000
  STAB_NRG  ████░░░░░░░░░░░░░░░░  412 / 1000
  GLITCHES  ▓▓░░░░░░░░░░░░░░░░░░  2 active
  ```

---

## 13. Progression (Prestige System)

### 13.1 "Commit & Push" (The Reset)

**What resets (Tier 1 & 2):** Colony map, buildings, all Proxies except ARIA-0, Raw Data, Volatile Energy, Vibe Charge, Stabilized Energy, Pure Energy.

**What persists (Tier 3):** Clean Architecture Points, Tech Tree unlocks, Logic Fragments (including active market listings), ARIA Shards, ARIA-0 and her XP, cosmetic skins, Codex entries.

**Permanent Upgrade Categories (purchased with Clean Arch. Points):**

| Category             | Example Upgrades                                                   |
|----------------------|--------------------------------------------------------------------|
| Refining Efficiency  | Token-to-energy conversion +10% per level (max 5)                 |
| Proxy Performance    | Base movement speed +15%, Logic Integrity cap +10                 |
| Glitch Resistance    | Colony-wide Glitch spawn rate −10% per level                      |
| Passive Generation   | Standby Raw Data generation rate doubled                           |
| Vibe Stability       | Vibe Meter decay rate −10% per level (max 5)                      |
| ARIA Assembly        | Each prestige contributes 1 ARIA Shard                            |

### 13.2 The End-Game: ARIA's Awakening

**50 ARIA Shards** (dropped only during Peak Vibe, from Abyss layer) + Core Terminal deposit = **Awakening Event**.

The Awakening Event:
- Full-screen ASCII art narrative cutscene
- ARIA-0 achieves full autonomy — runs Scheduled Jobs without player input
- Unlocks **ARIA Management Mode**: semi-autonomous colony, player shifts to strategic director role
- Permanent "Awakened" leaderboard badge
- All Codex Lore entries fully unlock, including previously hidden ARIA Archive entries

---

## 14. Performance & IDE Footprint

### 14.1 Hard Limits

| Component             | Hard Limit                                               |
|-----------------------|----------------------------------------------------------|
| PixiJS render loop    | 30fps cap (configurable: 15 / 30 / 60fps)               |
| Smart Parser — Pillar A | 2 eval/sec                                             |
| Smart Parser — Pillar B | On save only; max once per 3 seconds                  |
| Smart Parser — Pillar C | 1-second debounce; Git check on save only             |
| Cloud sync            | Every 5 minutes (not real-time writes)                  |
| WASM AST parser       | 500ms max; aborted and queued if exceeded               |
| Extension memory      | Soft warning at 150MB; PixiJS pauses at 200MB           |

### 14.2 Low-Power Mode

- PixiJS drops to 15fps
- Smart Parser polling halved
- Animations replaced with static frames
- Cloud sync paused (local save only)
- Vibe System continues running (parser still active, no visual effects)

### 14.3 Performance Dashboard

Accessible via command palette: `idle_vibes: Show Performance Stats`

```
idle_vibes — Resource Usage
  CPU (avg/peak):    0.3% / 1.2%
  Memory:            87MB
  Parser events:     1,204 this session
  Render fps:        30fps
  Cloud syncs:       3 this session
  Vibe events:       47 this session
```

---

## 15. Database Schema (Cloudflare D1 / SQLite)

Authentication uses VS Code's built-in GitHub auth provider (`vscode.authentication`). The user's `github_user_id` is the primary key across all tables — no separate auth system needed.

```sql
-- User profiles (keyed by GitHub user ID)
profiles (
  github_user_id  TEXT PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  avatar_url      TEXT,
  total_xp        INTEGER DEFAULT 0,
  aria_shards     INTEGER DEFAULT 0,
  awakened        INTEGER DEFAULT 0
)

-- Colony state (JSON blobs, overwritten on sync)
colony_state (
  github_user_id  TEXT PRIMARY KEY REFERENCES profiles(github_user_id),
  saved_at        TEXT,
  colony_data     TEXT,      -- full ColonyState JSON
  prestige_data   TEXT       -- full PrestigeData JSON
)

-- Fragment market
market_listings (
  id          TEXT PRIMARY KEY,
  seller_id   TEXT REFERENCES profiles(github_user_id),
  item_id     TEXT NOT NULL,
  item_data   TEXT,          -- JSON
  price       INTEGER NOT NULL CHECK (price > 0),
  status      TEXT CHECK (status IN ('active','sold','cancelled')),
  listed_at   TEXT,
  sold_at     TEXT
)

-- Cooperative Mega-Projects
global_events (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  title       TEXT,
  progress    INTEGER DEFAULT 0,
  target      INTEGER NOT NULL CHECK (target > 0),
  starts_at   TEXT,
  ends_at     TEXT
)

global_event_contributions (
  event_id          TEXT REFERENCES global_events(id),
  github_user_id    TEXT REFERENCES profiles(github_user_id),
  amount            INTEGER DEFAULT 0,
  PRIMARY KEY (event_id, github_user_id)
)
```

**Notes:**
- D1 uses SQLite types (TEXT, INTEGER) instead of PostgreSQL types
- Colony and prestige data stored as JSON blobs for flexibility — the extension owns the schema, the API is a dumb pipe
- Auth is handled by the Cloudflare Worker verifying the GitHub token via `GET https://api.github.com/user` (cached 5 min)
- `prestige_data` within colony_state JSON persists Codex discovery state across prestige cycles — players never lose discovered entries

---

## 16. Monetization & Retention

### 16.1 Ethical Freemium

Base game entirely free. No pay-to-win. No energy timers for purchase. No gameplay features gated behind payment.

### 16.2 Supporter DLC (One-Time Purchase)

**Colony Themes** — full visual reskins:
- *Retro Terminal* — green-on-black CRT aesthetic
- *Synthwave* — purple/pink gradient with scanlines
- *Monokai* — warm amber/orange tones
- *Nord* — cool Arctic blues and grays

**Proxy Skins** — the highest-desire cosmetic. Players form emotional attachment to their Proxies; skins persist through all prestige resets and transfer to new Proxies of the same role.
- *Ninja Proxy* — shuriken throw animation on Glitch removal; `[>_<]` ASCII face
- *Samurai Proxy* — bushido idle pose at low Logic Integrity; `[=_=]` ASCII face
- *Void Proxy* — dark matter aesthetic; `[∅_∅]` ASCII face
- *ARIA Prime* — premium re-skin of ARIA-0 only, unlockable post-Awakening Event; `[✦_✦]` ASCII face (matches Peak Vibe state)

**Codex Skins** — visual themes for the Codex UI (parchment, hologram, retro-terminal). No gameplay impact.

### 16.3 Retention Hooks

| Mechanism              | Description                                                          |
|------------------------|----------------------------------------------------------------------|
| Vibe System            | Every coding session is a new Vibe arc — no two sessions feel alike  |
| Coding Streak          | Daily energy burst for first coding activity                         |
| Micro-Objectives       | 3 rotating daily tasks including Vibe-based goals                    |
| Flow State Events      | Emergent special events that reward sustained coding quality          |
| Codex Discovery        | "???" locked entries create curiosity and return incentive            |
| Mega-Projects          | 4-week cooperative community goals                                   |
| ARIA Progression       | Long-term narrative arc across 50 prestige cycles                    |

---

## 17. Roadmap

| Phase | Focus                                      | Key Deliverables                                                   |
|-------|--------------------------------------------|--------------------------------------------------------------------|
| 1     | Foundation                                 | VS Code Extension ↔ Webview bridge; Pillar A; basic HUD            |
| 2     | Core Loop                                  | Svelte/PixiJS engine; mining; Proxy movement; Glitch system        |
| 3     | Vibe System                                | Vibe Meter; 4 Vibe States; Vibe Condenser; Proxy Vibe Sensitivity  |
| 4     | Economy                                    | Full 3-tier resource system; all buildings; Standby Mode           |
| 5     | Intelligence                               | Pillars B + C; Volatile Condenser; Flow State Events               |
| 6     | Codex                                      | Full Codex UI; all entry categories; progressive unlock system      |
| 7     | Persistence                                | Cloud saves (CF Workers + D1); Tech Tree; Commit & Push prestige   |
| 8     | Social                                     | Fragment Market + NPC Vendors; Leaderboards; Mega-Projects         |
| 9     | Narrative                                  | ARIA storyline; Awakening Event; ARIA Management Mode              |
| 10    | Polish & Monetization                      | DLC skins; Low-Power Mode; Performance Dashboard; onboarding       |

---

## 18. Open Source — Repository Structure

`idle_vibes` is released as a fully open-source project under the **MIT License**. The architecture is designed to be clean enough that a new contributor can understand the codebase in a single afternoon and extend it without touching unrelated modules.

### 18.1 Monorepo Layout

```
idle_vibes/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── codex_entry.md        # template for contributing Codex lore entries
│   ├── workflows/
│   │   ├── ci.yml                # lint, typecheck, unit tests on every PR
│   │   ├── release.yml           # builds & publishes to VS Code Marketplace on tag
│   │   └── security.yml          # dependency audit (npm audit, Dependabot)
│   └── PULL_REQUEST_TEMPLATE.md
│
├── packages/
│   ├── extension/                # VS Code extension host (Node.js)
│   │   ├── src/
│   │   │   ├── parser/           # Smart Parser — Pillars A, B, C
│   │   │   │   ├── pillarA.ts    # AI token detection
│   │   │   │   ├── pillarB.ts    # diagnostics delta
│   │   │   │   ├── pillarC.ts    # AST + Git analysis
│   │   │   │   └── index.ts      # unified parser interface
│   │   │   ├── bridge/           # message passing extension ↔ webview
│   │   │   │   ├── messages.ts   # shared message type definitions
│   │   │   │   └── host.ts       # extension-side bridge
│   │   │   ├── storage/          # local state persistence (VS Code SecretStorage + globalState)
│   │   │   └── extension.ts      # entry point
│   │   ├── test/
│   │   └── package.json
│   │
│   ├── ui/                       # Svelte + PixiJS webview
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── engine/       # PixiJS rendering layer
│   │   │   │   │   ├── colony.ts
│   │   │   │   │   ├── proxy.ts
│   │   │   │   │   └── vibe.ts   # Vibe visual effects
│   │   │   │   ├── stores/       # Svelte stores (game state, resources, vibe)
│   │   │   │   ├── components/   # UI components (HUD, Codex, Market)
│   │   │   │   └── bridge/       # webview-side bridge
│   │   │   └── App.svelte
│   │   ├── test/
│   │   └── package.json
│   │
│   ├── shared/                   # types and constants shared across packages
│   │   ├── src/
│   │   │   ├── types/            # GameState, Proxy, Resource, VibeState, etc.
│   │   │   ├── constants/        # conversion rates, storage caps, vibe thresholds
│   │   │   └── codex/            # Codex entry definitions (id, category, unlock condition)
│   │   └── package.json
│   │
│   └── api/                      # Cloudflare Worker backend (Hono + D1)
│       ├── src/
│       │   ├── auth/             # GitHub token verification middleware
│       │   ├── routes/           # saves, profiles, market, events, leaderboards
│       │   └── db/               # D1 schema and seed data
│       └── wrangler.toml
│
├── docs/                         # extended documentation (rendered on GitHub Pages)
│   ├── architecture.md
│   ├── contributing.md
│   ├── parser-internals.md
│   ├── extending-codex.md        # guide for community Codex lore contributions
│   └── security.md               # mirrors SECURITY.md, extended version
│
├── .env.example                  # ALL required env vars documented, NO real values
├── .gitignore
├── .gitattributes
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                       # MIT
├── README.md
├── SECURITY.md
└── package.json                  # workspace root (npm workspaces)
```

### 18.2 Extensibility Architecture

The codebase is built around three explicit extension points that allow contributors to add content without modifying core systems.

**Extension Point 1 — Parser Plugins**

New detection behaviors (e.g., support for a new AI agent, a new language server) are added as Pillar A/B/C plugins without touching core parser logic.

```typescript
// packages/shared/src/types/parser.ts
export interface ParserPlugin {
  id: string
  pillar: 'A' | 'B' | 'C'
  name: string
  detect(event: TextChangeEvent | DiagnosticEvent | GitEvent): ParserSignal | null
}

// To add a new AI agent detector:
// 1. Create packages/extension/src/parser/plugins/myAgent.ts
// 2. Implement ParserPlugin
// 3. Register in packages/extension/src/parser/index.ts
// No other files need modification.
```

**Extension Point 2 — Codex Entries**

All Codex content lives in `packages/shared/src/codex/` as plain JSON/TypeScript objects. Adding lore entries, translating existing ones, or creating new categories requires no engine changes.

```typescript
// packages/shared/src/types/codex.ts
export interface CodexEntry {
  id: string
  category: 'resources' | 'proxies' | 'buildings' | 'vibe' | 'enemies' | 'lore'
  title: string
  unlockedBy: UnlockCondition     // e.g., { type: 'first_encounter', target: 'entropy_creep' }
  content: string                  // markdown-compatible, supports // ARIA-0: "" signature
  lockedPreview?: string           // shown before unlock; defaults to '???'
}
```

Community-submitted Codex entries (lore expansions, translations) are the lowest-barrier contribution type and have a dedicated GitHub Issue template.

**Extension Point 3 — Vibe Event Hooks**

Custom events triggered at Vibe State transitions are registered via a simple hook system, allowing community-built extensions to react to Vibe changes (e.g., change VS Code color theme on Flow State, trigger a Spotify playlist, etc.).

```typescript
// packages/extension/src/vibe/hooks.ts
export interface VibeHook {
  id: string
  on: 'enter' | 'exit' | 'tick'
  state: VibeState | '*'           // '*' = any state transition
  handler(ctx: VibeContext): void | Promise<void>
}

// Example community extension:
registerVibeHook({
  id: 'theme-switcher',
  on: 'enter',
  state: 'flow',
  handler: () => vscode.workspace.getConfiguration('workbench')
    .update('colorTheme', 'One Dark Pro')
})
```

### 18.3 Code Style & Tooling

| Tool          | Purpose                                      | Config file            |
|---------------|----------------------------------------------|------------------------|
| TypeScript    | Strict mode enabled (`"strict": true`)       | `tsconfig.json`        |
| ESLint        | Linting (eslint-config-standard-with-typescript) | `.eslintrc.json`   |
| Prettier      | Formatting (single source of truth)          | `.prettierrc`          |
| Vitest        | Unit tests for parser, economy, vibe logic   | `vitest.config.ts`     |
| Playwright    | E2E tests for the Webview UI                 | `playwright.config.ts` |
| Changesets    | Versioning and CHANGELOG generation          | `.changeset/`          |

All rules are enforced in CI. PRs that fail lint or tests are blocked from merging.

---

## 19. Open Source — Documentation & Communication

### 19.1 Tone of Voice

`idle_vibes` is built by developers, for developers. The documentation follows these principles:

- **Direct over decorative.** No marketing language. No "powerful", "seamless", "robust". If a feature needs an adjective to sound good, the feature needs more work.
- **Show, don't explain.** Code examples over prose. When explaining a concept, lead with the code, follow with the explanation.
- **Honest about limitations.** If something is a known issue, a deliberate trade-off, or an open question, the docs say so. Developers respect honesty; they detect pretense immediately.
- **ARIA voice is reserved for in-game content only.** Documentation is human. The ARIA persona does not bleed into README or CONTRIBUTING files — it would feel manipulative outside its intended context.

### 19.2 README.md

The README is the front door. It answers four questions in order, without preamble:

```markdown
# idle_vibes

An idle colony game that lives in your IDE.
While you code (or wait for the AI to finish), your underground colony mines,
builds, and survives — powered by your actual coding activity.

---

## What it actually does

- Reads your coding activity via the VS Code API (no keylogger, no network calls during parsing)
- Converts AI token generation, bug fixes, and commits into in-game resources
- Runs a 2D pixel-art colony in a sidebar panel or editor tab
- Syncs colony state to the cloud (Cloudflare Workers) — optional, off by default

## Install

Search "idle_vibes" in the VS Code Extension Marketplace, or:

```sh
code --install-extension idle-vibes.idle-vibes
```

## Setup (if you want cloud sync)

1. Use the command palette: `idle_vibes: Sign In (Cloud Sync)`
2. Authorize with your GitHub account when prompted
3. Cloud sync is opt-in — the game works fully offline without it

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The easiest entry point is
[adding a Codex entry](docs/extending-codex.md) — no engine knowledge required.

## License

MIT
```

### 19.3 CONTRIBUTING.md

Structure:

```markdown
# Contributing to idle_vibes

Thanks for considering a contribution.
Here's what you need to know without the filler.

## Types of contributions

| Type                  | Difficulty | Where to start                     |
|-----------------------|------------|------------------------------------|
| Codex entry / lore    | Easy       | docs/extending-codex.md            |
| Bug fix               | Easy–Med   | Issues labeled `good first issue`  |
| Parser plugin         | Medium     | docs/parser-internals.md           |
| New building / mechanic | Hard     | Open a discussion first (see below)|
| Vibe hook             | Medium     | docs/vibe-hooks.md                 |

## Before you start on anything non-trivial

Open a GitHub Discussion, not an Issue.
Describe what you want to build and why.
This avoids duplicate work and ensures the design is coherent
before you invest time in implementation.

## Development setup

[step by step — dependencies, env, running locally]

## PR checklist

- [ ] Tests pass locally (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] No `.env` or secrets committed (CI will catch this too)
- [ ] CHANGELOG entry added via `npm run changeset`
- [ ] If adding a Codex entry: follows the entry schema in `packages/shared/src/codex/`
```

### 19.4 CHANGELOG.md

Managed via **Changesets** (`@changesets/cli`). Contributors add a changeset file with their PR; the release workflow aggregates them into `CHANGELOG.md` on tag.

Format follows [Keep a Changelog](https://keepachangelog.com):
- `Added` for new features
- `Changed` for non-breaking changes to existing behavior
- `Fixed` for bug fixes
- `Security` for security-related changes (always at the top of the release)

### 19.5 In-Code Documentation Standard

Public APIs are documented with TSDoc. Internal implementation files use inline comments only where the *why* is non-obvious — not the *what*.

```typescript
// ✅ Good — explains why, not what
// Debounce at 1s rather than on every event to avoid thrashing
// tree-sitter on rapid save sequences (e.g. format-on-save + manual save)
const debouncedParse = debounce(parseAST, 1000)

// ❌ Bad — restates the code
// Debounce the parse function with 1000ms delay
const debouncedParse = debounce(parseAST, 1000)
```

---

## 20. Open Source — Security Policy

### 20.1 SECURITY.md

The repository root contains a `SECURITY.md` file with:
- Supported versions
- How to report a vulnerability (private disclosure via GitHub Security Advisories — never a public Issue)
- Response time commitment (acknowledgement within 48h, patch timeline within 14 days for critical issues)
- Scope (what is and isn't considered a security issue)

### 20.2 Secrets & Environment Variables

**The golden rule: no secret ever touches the repository. Not in history, not in comments, not in test fixtures.**

#### What counts as a secret

- Cloudflare API tokens and account IDs
- Any database connection string with credentials
- API keys for any third-party service
- JWT secrets
- Private encryption keys

The `VITE_API_URL` is not a secret (it points to the public Worker endpoint), but it still lives in `.env` to keep configuration consistent and auditable.

#### `.env.example` — the contract

Every environment variable the project needs is documented in `.env.example` with a description and example format. No real values, ever.

```bash
# .env.example

# Cloudflare Worker API URL
VITE_API_URL=https://idle-vibes-api.your-account.workers.dev

# Enable cloud sync (true/false)
VITE_CLOUD_SYNC=false

# Parser throttle multiplier (1 = normal, 2 = half rate)
VITE_PARSER_THROTTLE=1
```

#### `.gitignore` entries (non-negotiable)

```gitignore
# Environment
.env
.env.local
.env.*.local

# VS Code Extension secrets (written by SecretStorage API at runtime)
*.vsix.key

# Build artifacts that may embed env vars
dist/
out/
```

#### Detecting accidental commits

The CI pipeline runs **`git-secrets`** (or equivalent, e.g. `truffleHog` on PR diffs) to scan for patterns matching known secret formats before any merge. If triggered, the PR is blocked and the contributor is instructed to rotate the exposed credential immediately.

A pre-commit hook (via **Husky**) runs the same scan locally:

```bash
# .husky/pre-commit
npx git-secrets --scan
```

### 20.3 Authentication (VS Code Native GitHub Auth)

The extension uses VS Code's built-in GitHub authentication provider (`vscode.authentication.getSession('github', ['read:user'])`). No manual token management or SecretStorage needed — VS Code handles token refresh, storage, and the OS keychain.

The GitHub access token is sent to the Cloudflare Worker API as a `Bearer` token. The Worker verifies it by calling `GET https://api.github.com/user` and caches the result for 5 minutes.

### 20.4 API Security (Cloudflare Workers)

The extension never has direct database access. All data operations go through the Cloudflare Worker API (`packages/api/`), which enforces ownership at the application level:

- **Save data:** Users can only read/write their own colony_state (keyed by `github_user_id` from the verified token)
- **Market listings:** Anyone can read active listings; only the seller can create/cancel their own listings
- **Global events:** All authenticated users can read events and contribute
- **Leaderboards:** Read-only, computed from profiles and colony_state data

### 20.5 Dependency Management

- **Dependabot** is enabled for all `packages/*/package.json` files. Security patches are auto-PRed within 24h of CVE publication.
- `npm audit` runs in CI on every PR. High and critical severity vulnerabilities block the merge.
- Dependencies are pinned to exact versions in `package-lock.json` (committed to the repository) to prevent supply-chain drift.
- The `packages/api/` Cloudflare Worker has its own isolated `package.json` with minimal dependencies (Hono only) — no game logic libraries pulled into the server environment.

### 20.6 What the Extension Does NOT Do

This is explicitly documented in the README and the extension's VS Code Marketplace listing to build trust with users:

- Does **not** read file contents — only change events, diagnostic counts, and Git metadata
- Does **not** send any code, file paths, or text to external servers
- Does **not** make any network calls during Smart Parser evaluation — all parsing is local
- Does **not** store API keys or passwords in `globalState` or any plaintext file
- Does **not** request VS Code permissions beyond what is declared in `package.json > activationEvents` and `contributes`
- Cloud sync is **opt-in** — the game is fully functional offline with local-only state
