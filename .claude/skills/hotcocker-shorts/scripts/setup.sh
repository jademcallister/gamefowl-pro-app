#!/usr/bin/env bash
# Set up a HOTCOCKER film workspace with Papermorph (free, MIT) in one go.
#   bash setup.sh [WORKDIR]      default WORKDIR: ~/hotcocker-films
# Safe to run again: it reuses an existing checkout and workspace.
set -euo pipefail
W="${1:-$HOME/hotcocker-films}"
SRC="${PAPERMORPH_SRC:-$HOME/.cache/papermorph}"

if [ ! -d "$SRC/.git" ]; then
  GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/DozenTwelve/Papermorph "$SRC"
fi
mkdir -p "$W/.claude/skills" "$W/engine"
[ -d "$W/.claude/skills/papermorph" ] || cp -r "$SRC/.claude/skills/papermorph" "$W/.claude/skills/"
cp -r "$SRC/engine/." "$W/engine/"

# Edge TTS behind an HTTPS proxy (cloud sandboxes): aiohttp ignores HTTPS_PROXY unless told.
TTS="$W/.claude/skills/papermorph/scripts/tts.py"
if ! grep -q 'proxy=os.environ.get("HTTPS_PROXY")' "$TTS"; then
  python3 - "$TTS" <<'EOF'
import sys
p = sys.argv[1]; s = open(p).read()
old = 'comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")'
new = ('import os   # reach Edge through the HTTPS proxy when one is set\n'
       '    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary",\n'
       '                                proxy=os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy"))')
assert old in s, "tts.py changed upstream: patch by hand"
open(p, "w").write(s.replace(old, new))
print("patched tts.py for proxies")
EOF
fi

# Browsers: use an installed Chromium when Playwright's own is missing.
if [ -z "${CHROME:-}" ]; then
  for c in /opt/pw-browsers/chromium-*/chrome-linux64/chrome /usr/bin/chromium /usr/bin/google-chrome; do
    [ -x "$c" ] && { echo "export CHROME=$c"; break; }
  done
fi
for t in uv ffmpeg python3; do command -v "$t" >/dev/null || echo "MISSING: $t"; done
echo "workspace ready: $W  (skill: $W/.claude/skills/papermorph)"
