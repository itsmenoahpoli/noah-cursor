# Noah Cursor — portfolio demo
# Render from repo root:  vhs demos/noah-cursor.tape
#
# Requires: vhs (brew install vhs), and a built CLI (npm run build)

Output demos/noah-cursor.gif

Set Shell "zsh"
Set FontSize 15
Set Width 1280
Set Height 720
Set Theme "Catppuccin Mocha"
Set Padding 24
Set Margin 0
Set MarginFill "#1e1e2e"
Set TypingSpeed 45ms
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

# 1 — Banner + list registry
Type `noah-cursor list`
Enter
Sleep 3.5s

Type `clear`
Enter
Sleep 400ms

# 2 — Search
Type `noah-cursor search "test"`
Enter
Sleep 2.5s

Type `clear`
Enter
Sleep 400ms

# 3 — Install a skill
Type `noah-cursor add --skill test --yes`
Enter
Sleep 3.5s

Type `clear`
Enter
Sleep 400ms

# 4 — Show what landed
Type `noah-cursor list --installed`
Enter
Sleep 2.5s

Type `clear`
Enter
Sleep 400ms

# 5 — Health check
Type `noah-cursor doctor`
Enter
Sleep 3s
