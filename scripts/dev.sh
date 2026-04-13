#!/usr/bin/env bash
set -e

# ── idle_vibes development environment ────────────────────────
#
# Starts everything needed for local development:
#   1. Supabase local (Postgres, Auth, Studio)
#   2. Vite dev server (HMR for the webview UI)
#   3. esbuild watch (rebuilds extension on change)
#   4. VS Code Extension Development Host (extension loaded, project as workspace)
#
# Ctrl+C tears down everything including Supabase containers.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Resolve the `code` CLI — it may not be in PATH
resolve_code_cli() {
  if command -v code &>/dev/null; then
    echo "code"
    return
  fi
  # macOS: VS Code installed in /Applications
  local vscode_bin="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
  if [[ -x "$vscode_bin" ]]; then
    echo "$vscode_bin"
    return
  fi
  # macOS: Cursor
  local cursor_bin="/Applications/Cursor.app/Contents/Resources/app/bin/code"
  if [[ -x "$cursor_bin" ]]; then
    echo "$cursor_bin"
    return
  fi
  echo ""
}

CODE_CLI="$(resolve_code_cli)"
if [[ -z "$CODE_CLI" ]]; then
  echo "[idle_vibes] ERROR: could not find VS Code CLI."
  echo "  Install it: Cmd+Shift+P → 'Shell Command: Install code command in PATH'"
  exit 1
fi

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

# ── 2. Build (first run) ─────────────────────────────────────
echo "[idle_vibes] Building shared types..."
npm run build:shared

echo "[idle_vibes] Building extension..."
npm run build:extension

# ── 3. Watchers (Vite + esbuild) ─────────────────────────────
echo "[idle_vibes] Starting Vite dev server + esbuild watch..."
npx concurrently -k -n vite,esbuild -c green,blue \
  "npm run dev:ui" \
  "npm run dev:extension" &
WATCHERS_PID=$!

# Give Vite a moment to start before opening VS Code
sleep 2

# ── 4. Launch Extension Development Host ─────────────────────
echo "[idle_vibes] Opening VS Code Extension Development Host..."
"$CODE_CLI" --extensionDevelopmentPath="$ROOT_DIR/packages/extension" "$ROOT_DIR"

echo ""
echo "  ✓ Vite dev server:   http://localhost:5175"
echo "  ✓ Supabase Studio:   http://localhost:54323"
echo "  ✓ Extension loaded in VS Code"
echo ""
echo "  Ctrl+C to stop everything."
echo ""

# Wait for watchers — Ctrl+C triggers cleanup via the trap
wait $WATCHERS_PID
