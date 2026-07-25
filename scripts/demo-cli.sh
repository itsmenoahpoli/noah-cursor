#!/usr/bin/env bash
# Noah CLI end-to-end demo — runs non-interactive commands as a live preview.
# Usage: npm run demo
#        ./scripts/demo-cli.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NOAH_CURSOR_NO_BANNER="${NOAH_CURSOR_NO_BANNER:-0}"
export NOAH_HOME="${NOAH_HOME:-$ROOT/.test-tmp/demo-noah-home}"
export FORCE_COLOR="${FORCE_COLOR:-1}"

DEMO_DIR="$ROOT/.test-tmp/demo-project"
mkdir -p "$NOAH_HOME" "$DEMO_DIR"

# Prefer built CLI; fall back to tsx from source
if [[ -f "$ROOT/dist/index.js" ]]; then
  NOAH=(node "$ROOT/dist/index.js" --no-banner)
else
  NOAH=(npx tsx "$ROOT/src/index.ts" --no-banner)
fi

section() {
  echo
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo
}

run() {
  echo "› ${NOAH[*]} $*"
  echo
  "${NOAH[@]}" "$@" || true
  echo
}

# Fresh demo project every run
rm -rf "$DEMO_DIR"
mkdir -p "$DEMO_DIR"
cat >"$DEMO_DIR/package.json" <<'EOF'
{
  "name": "noah-demo-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^15.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
EOF
cat >"$DEMO_DIR/README.md" <<'EOF'
# Noah demo app
EOF
echo "node_modules" >"$DEMO_DIR/.gitignore"
mkdir -p "$DEMO_DIR/.github/workflows"
echo "name: ci" >"$DEMO_DIR/.github/workflows/ci.yml"

section "0 · Prepare (build if needed)"
if [[ ! -f "$ROOT/dist/index.js" ]]; then
  echo "Building CLI…"
  npm run build
  NOAH=(node "$ROOT/dist/index.js" --no-banner)
fi
echo "CLI: ${NOAH[*]}"
echo "Demo project: $DEMO_DIR"
echo "User store:    $NOAH_HOME"

section "1 · Discover — search / list / preview / explain / trending"
run search laravel
run list
run preview laravel-api
run explain commit-push
run trending

section "2 · Project awareness — analyze / doctor (in demo project)"
(
  cd "$DEMO_DIR"
  echo "› ${NOAH[*]} analyze"
  echo
  "${NOAH[@]}" analyze || true
  echo
  echo "› ${NOAH[*]} doctor"
  echo
  "${NOAH[@]}" doctor || true
  echo
)

section "3 · Bootstrap dry-run (no install)"
(
  cd "$DEMO_DIR"
  echo "› ${NOAH[*]} bootstrap --dry-run"
  echo
  "${NOAH[@]}" bootstrap --dry-run || true
  echo
)

section "4 · Bootstrap with confirm skipped (-y) — install recommendations"
(
  cd "$DEMO_DIR"
  echo "› ${NOAH[*]} bootstrap -y"
  echo
  "${NOAH[@]}" bootstrap -y || true
  echo
)

section "5 · Install / list installed / update dry-run"
(
  cd "$DEMO_DIR"
  echo "› ${NOAH[*]} install commit-push -y"
  echo
  "${NOAH[@]}" install commit-push -y || true
  echo
  echo "› ${NOAH[*]} list --installed"
  echo
  "${NOAH[@]}" list --installed || true
  echo
  echo "› ${NOAH[*]} update --dry-run -y"
  echo
  "${NOAH[@]}" update --dry-run -y || true
  echo
  echo "› ${NOAH[*]} diff laravel-api"
  echo
  "${NOAH[@]}" diff laravel-api || true
  echo
)

section "6 · Favorites / recent / dashboard / config"
(
  cd "$DEMO_DIR"
  echo "› ${NOAH[*]} favorite add laravel-api"
  echo
  "${NOAH[@]}" favorite add laravel-api || true
  echo
  echo "› ${NOAH[*]} favorites"
  echo
  "${NOAH[@]}" favorites || true
  echo
  echo "› ${NOAH[*]} recent"
  echo
  "${NOAH[@]}" recent || true
  echo
  echo "› ${NOAH[*]} dashboard"
  echo
  "${NOAH[@]}" dashboard || true
  echo
  echo "› ${NOAH[*]} config"
  echo
  "${NOAH[@]}" config || true
  echo
)

section "7 · Workspace / sync / auth / analytics / audit"
(
  cd "$DEMO_DIR"
  echo "› ${NOAH[*]} workspace show"
  echo
  "${NOAH[@]}" workspace show || true
  echo
  echo "› ${NOAH[*]} login demo-user"
  echo
  "${NOAH[@]}" login demo-user || true
  echo
  echo "› ${NOAH[*]} whoami"
  echo
  "${NOAH[@]}" whoami || true
  echo
  echo "› ${NOAH[*]} analytics"
  echo
  "${NOAH[@]}" analytics || true
  echo
  echo "› ${NOAH[*]} audit --limit 8"
  echo
  "${NOAH[@]}" audit --limit 8 || true
  echo
)

section "8 · Templates / plugins / try / uninstall / undo"
(
  cd "$DEMO_DIR"
  echo "› ${NOAH[*]} new marketing --dry-run"
  echo
  "${NOAH[@]}" new marketing --dry-run || true
  echo
  echo "› ${NOAH[*]} plugin add demo-hooks"
  echo
  "${NOAH[@]}" plugin add demo-hooks || true
  echo
  echo "› ${NOAH[*]} plugin list"
  echo
  "${NOAH[@]}" plugin list || true
  echo
  echo "› ${NOAH[*]} try generate-readme"
  echo
  "${NOAH[@]}" try generate-readme || true
  echo
  echo "› ${NOAH[*]} uninstall skill/test --yes --force  (may be a no-op)"
  echo
  "${NOAH[@]}" uninstall skill/test --yes --force 2>/dev/null || true
  echo
  echo "› ${NOAH[*]} undo -y"
  echo
  "${NOAH[@]}" undo -y || true
  echo
)

section "9 · Multi-target install (Claude)"
(
  cd "$DEMO_DIR"
  echo "› ${NOAH[*]} install generate-readme --target claude -y"
  echo
  "${NOAH[@]}" install generate-readme --target claude -y || true
  echo
  echo "› ${NOAH[*]} list --installed --ide claude-code"
  echo
  "${NOAH[@]}" list --installed --ide claude-code || true
  echo
)

section "Demo complete"
echo "Demo project left at: $DEMO_DIR"
echo "User store left at:    $NOAH_HOME"
echo
echo "Skipped (interactive only): browse, wizard, publish, home menu"
echo "Re-run with:  npm run demo"
echo
