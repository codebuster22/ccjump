# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2]

### Added
- Onboarding can skip the initial project registration (confirm prompt; add one later with `ccjump add`).
- Onboarding marks your current shell (from `$SHELL`) as "(current shell)" in the shell picker.
- `ccjump add` now prints how to activate the new command in your current shell (re-eval the init line, or use `ccjump run <name>`).

### Changed
- Onboarding's project step shows the current directory so it's clear what will be registered.

## [0.1.1]

### Fixed
- macOS bash: wire `~/.bash_profile` (login shells don't source `~/.bashrc`).
- Git Bash / MSYS2: resolve the home directory via the OS API on Windows (`$HOME` there is a POSIX path Win32 can't use).
- Git Bash: launch `claude` when it's installed as `claude.cmd`/`.bat` by routing through `cmd.exe /c`.
- Don't offer the `/dev/tty` (`forceTty`) workaround on native Windows, where it can't take effect.

### Changed
- Bare `ccjump` (when already configured) lists your registered projects and a usage hint instead of printing full help.

## [0.1.0]

Initial release of `ccjump`.

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

[Unreleased]: https://github.com/codebuster22/ccjump/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/codebuster22/ccjump/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/codebuster22/ccjump/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/codebuster22/ccjump/commits/v0.1.0
