#!/usr/bin/env bash
set -e

# ── idle_vibes development environment ────────────────────────
#
#   1. Starts Cloudflare Worker local dev (wrangler)
#   2. Builds shared types, UI, and extension
#   3. Watches for changes (UI + extension auto-rebuild)
#   4. Opens VS Code Extension Development Host with project folder
#
# Close the Extension Development Host window or Ctrl+C to stop everything.

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
WATCHERS_PID=""
WRANGLER_PID=""
cleanup() {
  echo ""
  echo "[idle_vibes] Shutting down..."
  if [[ -n "$WATCHERS_PID" ]]; then
    kill $WATCHERS_PID 2>/dev/null || true
    wait $WATCHERS_PID 2>/dev/null || true
  fi
  if [[ -n "$WRANGLER_PID" ]]; then
    kill $WRANGLER_PID 2>/dev/null || true
    wait $WRANGLER_PID 2>/dev/null || true
  fi
  echo "[idle_vibes] Done."
}
trap cleanup EXIT

# ── 1. Cloudflare Worker (local) ─────────────────────────────
echo "[idle_vibes] Starting local API (wrangler dev)..."
npm run dev -w packages/api &
WRANGLER_PID=$!

# ── 2. Initial build ─────────────────────────────────────────
echo "[idle_vibes] Building shared types..."
npm run build:shared

echo "[idle_vibes] Building UI..."
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
# --wait blocks until the window is closed, then cleanup runs.
echo "[idle_vibes] Opening VS Code Extension Development Host..."
echo ""
echo "  API (wrangler):    http://localhost:8787"
echo "  Watchers running:  UI (vite build --watch) + extension (esbuild --watch)"
echo ""
echo "  Close the VS Code window or Ctrl+C here to stop everything."
echo ""

"$CODE_CLI" --new-window --wait \
  "$ROOT_DIR" \
  --extensionDevelopmentPath="$ROOT_DIR/packages/extension"

# When the Extension Development Host window closes, we reach here
# and the EXIT trap handles cleanup.
