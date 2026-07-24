#!/usr/bin/env bash
# Render the portfolio demo GIF with VHS.
# Prerequisites: brew install vhs && npm run build
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v vhs >/dev/null 2>&1; then
  echo "vhs not found. Install with: brew install vhs" >&2
  exit 1
fi

if [[ ! -f dist/index.js ]]; then
  echo "Building CLI…"
  npm run build
fi

mkdir -p demos/bin
cat > demos/bin/noah-cursor <<EOF
#!/usr/bin/env bash
exec node "$ROOT/dist/index.js" "\$@"
EOF
chmod +x demos/bin/noah-cursor

# Help go-rod find Chrome on macOS if needed
if [[ -z "${ROD_BROWSER_BIN:-}" && -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  export ROD_BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

vhs demos/noah-cursor.tape
echo "Wrote demos/noah-cursor.gif"
