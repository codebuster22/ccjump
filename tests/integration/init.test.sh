#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
export XDG_CONFIG_HOME="$WORK/cfg"
PROJ="$WORK/titus-bot"; mkdir -p "$PROJ"
PROJ2="$WORK/2024-app"; mkdir -p "$PROJ2"

bun run "$HERE/src/index.ts" add "$PROJ" >/dev/null
bun run "$HERE/src/index.ts" add "$PROJ2" >/dev/null

check() { # $1 = shell
  local sh="$1"
  "$sh" -c "
    eval \"\$(bun run '$HERE/src/index.ts' init $sh)\"
    type titus-bot >/dev/null 2>&1 || { echo 'FAIL: titus-bot not defined in $sh'; exit 1; }
    # confirm the function body calls 'ccjump run'
    case \"\$(typeset -f titus-bot 2>&1)\" in *'ccjump run'*) ;; *) echo 'FAIL: wrong body in $sh'; exit 1;; esac
    # verify digit-first hyphenated project name also works
    type 2024-app >/dev/null 2>&1 || { echo 'FAIL: 2024-app not defined in $sh'; exit 1; }
    case \"\$(typeset -f 2024-app 2>&1)\" in *'ccjump run'*) ;; *) echo 'FAIL: wrong body for 2024-app in $sh'; exit 1;; esac
  "
}
check bash
if command -v zsh >/dev/null 2>&1; then check zsh; else echo "note: zsh not installed, skipped"; fi
echo "PASS"
