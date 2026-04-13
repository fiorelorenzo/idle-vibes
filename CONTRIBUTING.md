# Contributing to idle_vibes

Thanks for considering a contribution.
Here's what you need to know without the filler.

## Types of contributions

| Type | Difficulty | Where to start |
|------|------------|----------------|
| Codex entry / lore | Easy | [docs/extending-codex.md](docs/extending-codex.md) |
| Bug fix | Easy-Med | Issues labeled [`good first issue`](../../labels/good%20first%20issue) |
| Parser plugin | Medium | [docs/parser-internals.md](docs/parser-internals.md) |
| Vibe hook | Medium | [docs/vibe-hooks.md](docs/vibe-hooks.md) |
| New building / mechanic | Hard | Open a Discussion first (see below) |

## Before you start on anything non-trivial

Open a **GitHub Discussion**, not an Issue.
Describe what you want to build and why.
This avoids duplicate work and ensures the design is coherent
before you invest time in implementation.

For Codex entries and small bug fixes, go ahead and open a PR directly.

## Development setup

1. **Clone the repo:**

   ```sh
   git clone https://github.com/your-username/idle_vibes.git
   cd idle_vibes
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Build shared package first** (other packages depend on it):

   ```sh
   npm run build:shared
   ```

4. **Build the rest:**

   ```sh
   npm run build:ui
   npm run build:extension
   ```

5. **Run tests:**

   ```sh
   npm test
   ```

6. **(Optional) Set up cloud sync for local testing:**

   Cloud sync uses VS Code's GitHub auth — no manual setup needed.
   The game runs fully offline without it.

## Code style

- TypeScript strict mode is enabled
- ESLint and Prettier are configured — run `npm run lint` and `npm run format` before submitting
- Write comments that explain *why*, not *what*

## PR checklist

Before submitting your pull request:

- [ ] Tests pass locally (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Types check (`npm run typecheck`)
- [ ] No `.env` or secrets committed (CI will catch this too)
- [ ] CHANGELOG entry added via `npm run changeset`
- [ ] If adding a Codex entry: follows the entry schema in `packages/shared/src/codex/`

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when filing issues. Include your VS Code version, extension version, and steps to reproduce.

## Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). Be decent.
