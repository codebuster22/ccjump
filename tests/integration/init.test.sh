#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
export XDG_CONFIG_HOME="$WORK/cfg"
PROJ="$WORK/titus-bot"; mkdir -p "$PROJ"

bun run "$HERE/src/index.ts" add "$PROJ" >/dev/null

check() { # $1 = shell
  local sh="$1"
  "$sh" -c "
    eval \"\$(bun run '$HERE/src/index.ts' init $sh)\"
    type titus-bot >/dev/null 2>&1 || { echo 'FAIL: titus-bot not defined in $sh'; exit 1; }
    # confirm the function body calls 'ccjump run'
    case \"\$(typeset -f titus-bot 2>&1)\" in *'ccjump run'*) ;; *) echo 'FAIL: wrong body in $sh'; exit 1;; esac
  "
}
check bash
if command -v zsh >/dev/null 2>&1; then check zsh; else echo "note: zsh not installed, skipped"; fi
echo "PASS"
