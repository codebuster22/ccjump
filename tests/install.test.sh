#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

# stub uname + curl on PATH; capture the URL curl is asked to fetch
cat > "$WORK/uname" <<'EOF'
#!/bin/sh
case "$1" in -s) echo Linux;; -m) echo x86_64;; *) echo Linux;; esac
EOF
cat > "$WORK/curl" <<'EOF'
#!/bin/sh
# record args, create the output file so chmod/onboard steps don't fail
for a in "$@"; do prev="$cur"; cur="$a"; if [ "$prev" = "-o" ]; then out="$a"; fi; done
echo "$@" >> "$WORK_LOG"
: > "$out" 2>/dev/null || true
EOF
chmod +x "$WORK/uname" "$WORK/curl"

export WORK_LOG="$WORK/curl.log"
# run installer with stubs first on PATH, no TTY, custom bin dir
CCJUMP_BIN_DIR="$WORK/bin" PATH="$WORK:$PATH" sh "$HERE/install.sh" </dev/null >/dev/null 2>&1 || true

grep -q "github.com/codebuster22/ccjump/releases/latest/download/ccjump-linux-x64" "$WORK_LOG" || { echo "FAIL: expected full download URL in curl log"; cat "$WORK_LOG"; exit 1; }
test -f "$WORK/bin/ccjump" || { echo "FAIL: binary not placed"; exit 1; }
echo "PASS"
