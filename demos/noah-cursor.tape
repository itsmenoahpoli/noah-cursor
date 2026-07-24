# Noah Cursor — portfolio demo
# Render from repo root:  ./demos/render.sh
# Requires: vhs (brew install vhs), and a built CLI (npm run build)

Output demos/noah-cursor.gif

Set Shell "zsh"
Set FontSize 14
Set Width 1280
Set Height 900
Set Theme "Catppuccin Mocha"
Set Padding 20
Set Margin 0
Set MarginFill "#1e1e2e"
Set TypingSpeed 40ms
Set PlaybackSpeed 1.0
Set Framerate 30
Set CursorBlink true

Hide
Type `export PATH="$PWD/demos/bin:$PATH"`
Enter
Type `rm -rf /tmp/noah-cursor-demo && mkdir -p /tmp/noah-cursor-demo && cd /tmp/noah-cursor-demo`
Enter
Sleep 600ms
Show

Type `clear`
Enter
Sleep 400ms

# ─────────────────────────────────────────────
# 1 — Survey the registry
# ─────────────────────────────────────────────
Type `noah-cursor list`
Enter
Sleep 4s

Type `clear`
Enter
Sleep 400ms

# ─────────────────────────────────────────────
# 2 — Search for a specific asset
# ─────────────────────────────────────────────
Type `noah-cursor search "test"`
Enter
Sleep 3s

Type `clear`
Enter
Sleep 400ms

# ─────────────────────────────────────────────
# 3 — Browse: pick categories, assets, confirm
# ─────────────────────────────────────────────
Type `noah-cursor browse`
Enter
Sleep 3s

# Categories — select Skills, then Rules
Sleep 800ms
Space
Sleep 700ms
Down
Sleep 500ms
Space
Sleep 700ms
Enter
Sleep 2s

# Skills — select test, commit-push, generate-readme
Sleep 800ms
Space
Sleep 600ms
Down
Sleep 450ms
Space
Sleep 600ms
Down 5
Sleep 450ms
Space
Sleep 700ms
Enter
Sleep 2s

# Rules — select test, stack-architecture, laravel-api
Sleep 800ms
Space
Sleep 600ms
Down
Sleep 450ms
Space
Sleep 600ms
Down 2
Sleep 450ms
Space
Sleep 700ms
Enter
Sleep 2.5s

# Installation summary → confirm Continue?
Sleep 1s
Enter
Sleep 5s

Type `clear`
Enter
Sleep 400ms

# ─────────────────────────────────────────────
# 4 — Verify what was installed
# ─────────────────────────────────────────────
Type `noah-cursor list --installed`
Enter
Sleep 3.5s

Type `clear`
Enter
Sleep 400ms

# ─────────────────────────────────────────────
# 5 — One-shot add (non-interactive)
# ─────────────────────────────────────────────
Type `noah-cursor add --skill node-doctor-fix --yes`
Enter
Sleep 3.5s

Type `clear`
Enter
Sleep 400ms

# ─────────────────────────────────────────────
# 6 — Health check
# ─────────────────────────────────────────────
Type `noah-cursor doctor`
Enter
Sleep 3.5s
