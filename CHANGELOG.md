# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Initial release of `ccjump` (targeting `0.1.0`).

### Added

- **Bare-command project launcher.** `ccjump add` registers a project directory and exposes a shell function named after the folder; calling it `cd`s into the project and launches Claude Code.
- **Shell integration** via `eval "$(ccjump init bash|zsh)"` — one generated function per project, hyphen- and digit-leading-name safe, added to your rc through an idempotent marker block. `ccjump init` fails inert (silent, exit 0) when no config exists.
- **Launch behavior** — three permission modes (`skip` default → `--dangerously-skip-permissions`, `allow`, `normal`), always-on `launchArgs` (default `["--verbose"]`), `resume`/`continue` mode words, and verbatim pass-through of all other arguments to `claude`.
- **Command surface** — `add`, `list`, `remove`, `init`, `run`, `setup`, `tty on|off|status`, `upgrade`, `--version`, `--help`.
- **TTY-aware onboarding** (interactive via `@clack/prompts`, with a non-interactive fallback for CI) that detects shells, chooses a permission mode, registers a first project, and wires the rc files.
- **Reactive `/dev/tty` handling** — opt-in `forceTty` for setups (e.g. WSL + oh-my-zsh) where a launched process doesn't get a real terminal; offered automatically on a detected quick-fail and toggleable with `ccjump tty`.
- **Self-update** — `ccjump upgrade` downloads the matching release asset, verifies its SHA-256 against `SHA256SUMS`, and replaces the binary atomically. An opt-out once-a-day update notifier (`CCJUMP_NO_UPDATE_CHECK=1` to disable).
- **Configuration** at `${XDG_CONFIG_HOME:-~/.config}/ccjump/config.json`, versioned, with corrupt-config back-up and recovery.
- **Installer** — POSIX `install.sh` with `uname`-based OS/arch detection, install to `~/.local/bin` (overridable via `CCJUMP_BIN_DIR`), and TTY-aware onboarding.
- **Distribution** — `bun build --compile` standalone binaries for linux/darwin (x64/arm64) and windows-x64; GitHub Actions for CI (tests, shellcheck, bash/zsh integration) and tag-driven releases with checksums.

[Unreleased]: https://github.com/codebuster22/ccjump/commits/main
