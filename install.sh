#!/bin/sh
# install.sh -- install ccjump. Non-interactive download; onboarding on first run.
set -eu

REPO="codebuster22/ccjump"
BINDIR="${CCJUMP_BIN_DIR:-$HOME/.local/bin}"

os="$(uname -s)"; arch="$(uname -m)"
case "$os" in
  Linux) OS=linux ;;
  Darwin) OS=darwin ;;
  MINGW*|MSYS*|CYGWIN*) OS=windows ;;
  *) echo "ccjump: unsupported OS: $os" >&2; exit 1 ;;
esac
case "$arch" in
  x86_64|amd64) ARCH=x64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) echo "ccjump: unsupported arch: $arch" >&2; exit 1 ;;
esac

ASSET="ccjump-$OS-$ARCH"
if [ "$OS" = windows ]; then ASSET="$ASSET.exe"; fi
URL="https://github.com/$REPO/releases/latest/download/$ASSET"
TARGET="$BINDIR/ccjump"
if [ "$OS" = windows ]; then TARGET="$BINDIR/ccjump.exe"; fi

mkdir -p "$BINDIR"
echo "ccjump: downloading $ASSET ..." >&2
curl -fsSL "$URL" -o "$TARGET"
chmod +x "$TARGET" 2>/dev/null || true
echo "ccjump: installed to $TARGET" >&2

case ":$PATH:" in
  *":$BINDIR:"*) ;;
  *) echo "ccjump: WARNING -- $BINDIR is not on your PATH. Add it, then restart your shell." >&2 ;;
esac

# onboarding: only with a real terminal
if [ -t 0 ]; then
  "$TARGET" setup || true
elif [ -e /dev/tty ]; then
  "$TARGET" setup < /dev/tty || true
else
  echo "ccjump: run 'ccjump' to finish setup." >&2
fi
