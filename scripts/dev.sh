#!/usr/bin/env bash
set -e

# ── idle_vibes development environment ────────────────────────
#
#   1. Starts Supabase local (Postgres, Auth, Studio)
#   2. Builds shared types, UI, and extension
#   3. Watches for changes (UI + extension auto-rebuild)
#   4. Opens VS Code Extension Development Host
#
# UI edits → vite rebuild → auto-copy to media/ → webview auto-reloads
# Extension edits → esbuild rebuild → use 'Developer: Reload Window'
#
# Ctrl+C tears down everything including Supabase containers.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ── Resolve VS Code CLI ──────────────────────────────────────
resolve_code_cli() {
  if command -v code &>/dev/null; then
    echo "code"; return
  fi
  local vscode_bin="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
  if [[ -x "$vscode_bin" ]]; then
    echo "$vscode_bin"; return
  fi
  local cursor_bin="/Applications/Cursor.app/Contents/Resources/app/bin/code"
  if [[ -x "$cursor_bin" ]]; then
    echo "$cursor_bin"; return
  fi
  echo ""
}

CODE_CLI="$(resolve_code_cli)"
if [[ -z "$CODE_CLI" ]]; then
  echo "[idle_vibes] ERROR: could not find VS Code CLI."
  echo "  Install it: Cmd+Shift+P → 'Shell Command: Install code command in PATH'"
  exit 1
fi

# ── Cleanup ───────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "[idle_vibes] Shutting down..."
  kill $WATCHERS_PID 2>/dev/null || true
  wait $WATCHERS_PID 2>/dev/null || true
  supabase stop 2>/dev/null || true
  echo "[idle_vibes] Done."
}
trap cleanup EXIT

# ── 1. Supabase ───────────────────────────────────────────────
echo "[idle_vibes] Starting Supabase..."
supabase start

# ── 2. Initial build ─────────────────────────────────────────
echo "[idle_vibes] Building shared types..."
npm run build:shared

echo "[idle_vibes] Building UI (+ copy to extension/media/)..."
npm run build:ui

echo "[idle_vibes] Building extension..."
npm run build:extension

# ── 3. Watchers ───────────────────────────────────────────────
echo "[idle_vibes] Starting watchers..."
npx concurrently -k -n ui,ext -c green,blue \
  "npm run dev:ui" \
  "npm run dev:extension" &
WATCHERS_PID=$!

sleep 1

# ── 4. Launch Extension Development Host ─────────────────────
echo "[idle_vibes] Opening VS Code Extension Development Host..."
"$CODE_CLI" --new-window --extensionDevelopmentPath="$ROOT_DIR/packages/extension" "$ROOT_DIR"

cat <<'BANNER'

  ✓ Supabase Studio:   http://localhost:54323
  ✓ UI watch:          vite build --watch → auto-copy to media/
  ✓ Extension watch:   esbuild --watch

  Edit Svelte/TS in ui/  → auto-rebuild + auto-reload webview
  Edit extension TS      → auto-rebuild + 'Developer: Reload Window'
  Simulate AI activity   → Cmd+Shift+P → 'idle_vibes [DEV]: Simulate'

  Ctrl+C to stop everything.

BANNER

wait $WATCHERS_PID
