# idle_vibes

An idle colony game that lives in your IDE.
While you code (or wait for the AI to finish), your underground colony mines,
builds, and survives — powered by your actual coding activity.

---

## What it actually does

- Reads your coding activity via the VS Code API (no keylogger, no network calls during parsing)
- Converts AI token generation, bug fixes, and commits into in-game resources
- Runs a 2D pixel-art colony in a sidebar panel or editor tab
- Syncs colony state to the cloud (Supabase) — optional, off by default

What the extension does **not** do:

- Does not read file contents — only change events, diagnostic counts, and Git metadata
- Does not send any code, file paths, or text to external servers
- Does not make network calls during parsing — all parsing is local
- Cloud sync is opt-in — the game works fully offline

## Install

Search "idle_vibes" in the VS Code Extension Marketplace, or:

```sh
code --install-extension idle-vibes.idle-vibes
```

## Setup (if you want cloud sync)

1. Copy `.env.example` to `.env`
2. Fill in your Supabase project URL and anon key (see [docs/setup.md](docs/setup.md))
3. Cloud sync is opt-in — the game works fully offline without it

## Project structure

This is a monorepo with npm workspaces:

| Package | Description |
|---------|-------------|
| `packages/shared` | Types, constants, and Codex definitions shared across packages |
| `packages/extension` | VS Code extension host — Smart Parser, bridge, storage |
| `packages/ui` | Svelte + PixiJS webview — rendering, stores, components |

## Development

```sh
npm install
npm run build:shared       # must run first — other packages depend on it
npm run build:ui
npm run build:extension
npm test
```

Lint and typecheck:

```sh
npm run lint
npm run typecheck
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The easiest entry point is
[adding a Codex entry](docs/extending-codex.md) — no engine knowledge required.

## License

[MIT](LICENSE)
