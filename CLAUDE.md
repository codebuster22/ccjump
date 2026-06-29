# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Northstar

`ccjump` exists to make launching Claude Code in any project a **single bare word**. You register a directory, and its folder name becomes a shell command that drops you into that project with `claude` already running — your permission mode and pass-through flags applied. Everything serves that goal:

- **Zero friction** — the command *is* the folder name; one word, no `cd … && claude …`.
- **Cross-shell, cross-OS** — bash + zsh on Linux / macOS / WSL / Git Bash, from one self-contained binary.
- **No runtime dependencies** — a `bun build --compile` standalone binary; install with one `curl`, update with `ccjump upgrade`.
- **Invisible when idle** — exactly one idempotent `eval` line in your rc; remove it and ccjump leaves no trace.

It is an **unofficial** tool: keep it free of Anthropic trademarks and keep the "not affiliated with or endorsed by Anthropic" disclaimer in user-facing surfaces. When changing anything, guard these properties — a feature that compromises "one word", "stays out of your way", or "works the same across the four shells/OSes" is probably wrong for this tool.

## Commands

- `bun install` — install deps (Bun only; no Node toolchain).
- `bun test` — full unit + integration suite. Single file: `bun test tests/launch.test.ts`. Single test by name: `bun test -t "buildArgs"`.
- `bash tests/install.test.sh` — installer os/arch + download-URL assertions.
- `bash tests/integration/init.test.sh` — emitted `init` defines callable functions in **real bash AND zsh** (needs zsh installed).
- `HOME="$(mktemp -d)" XDG_CONFIG_HOME="$(mktemp -d)" bun test` — **CI simulation; run this before declaring done.** Some tests pass on a dev box only because of an ambient `~/.config`/`~/.zshrc`; this catches that.
- `bun run start -- <args>` — run the CLI from source (e.g. `bun run start -- add .`).
- `bun run build` — cross-compile all 5 release binaries into `dist/`.
- Local install from source: `bun build --compile ./src/index.ts --outfile ~/.local/bin/ccjump`.

While developing, point `XDG_CONFIG_HOME`/`HOME` at temp dirs so you never touch your real config or rc files.

## Architecture (the big picture)

**All logic lives in the compiled binary; the shell layer is a thin generated wrapper.** A binary can `cd` and spawn `claude`, but it cannot create new *command names* in the parent shell — that single capability is the only reason shell functions exist. The rc file gets one idempotent block:

```
# >>> ccjump >>>
eval "$(ccjump init zsh)"
# <<< ccjump <<<
```

`ccjump init <shell>` reads the config and prints one function per project (`my-app () { ccjump run 'my-app' "$@"; }`); calling it runs `ccjump run`, which resolves the path, `cd`s, and spawns `claude`. Functions are generated at shell start, so **a newly `ccjump add`ed project is not live in an already-open shell until the init line is re-eval'd** — `ccjump add` prints how.

Module responsibilities (one job each): `index.ts` CLI dispatch + first-run/onboarding entrypoint · `platform.ts` OS/arch + home/config paths · `config.ts` typed config at `${XDG_CONFIG_HOME:-~/.config}/ccjump/config.json` (versioned; corrupt → `.bak` + recreate) · `registry.ts` add/list/remove + name validation · `shells.ts` allowlist + init codegen + idempotent rc wiring · `launch.ts` `buildArgs` (pure) + `run` (spawn, reactive `/dev/tty`) · `onboard.ts`/`tty.ts` onboarding + interactivity · `download.ts`/`upgrade.ts` release API + checksum-verified self-update · `install.sh` POSIX installer · `scripts/build.ts` cross-compile · `.github/workflows` CI + tag-driven release.

## Invariants that will bite you if you break them

- **`ccjump init` must fail inert:** no config → print *nothing* to stdout/stderr, exit 0 (a stale `eval` line must never spam shell startup). Unsupported/unknown shell arg → stderr + exit 1. Shell validation runs *before* the config check, deliberately.
- **rc edits are idempotent and scoped:** only the marker block, only `~/.bashrc`/`~/.zshrc` (macOS bash uses `~/.bash_profile`). Never touch other files.
- **Supported shells are bash + zsh only.** `$SHELL` is a hint, never wired blindly.
- **Exact `claude` flag mapping** (don't drift): perms `skip`→`--dangerously-skip-permissions` (default), `allow`→`--allow-dangerously-skip-permissions`, `normal`→none; `launchArgs` (default `["--verbose"]`) always passed; mode words `resume`/`continue` only at argv position 0, everything else passes through verbatim.
- **Bun `os.homedir()` caches `$HOME` at startup** and ignores runtime mutation — `homeDir()` reads `process.env.HOME` directly (except win32, where `$HOME` is a POSIX path so it uses `os.homedir()`). Tests rely on overriding `$HOME`; keep it that way.
- **`upgrade()` writes its temp file in `dirname(process.execPath)`** — required for the atomic `renameSync`. Do NOT move it to `os.tmpdir()` (cross-filesystem rename throws `EXDEV`). The SHA-256 (vs `SHA256SUMS`) is verified *before* the replace.
- **Platform-specific code is unit-tested via an injected `platform` param** (default `process.platform`) — the same dependency-injection pattern as `run(..., now = Date.now)` and `upgrade(self = process.execPath)`. Add new platform branches the same way so they're testable on Linux CI.

## Testing conventions

TDD: write the failing test first. Tests exercise real behavior (real temp dirs, real bash/zsh) over mocks of the unit under test; **no real network** (stub `globalThis.fetch`). Anything touching `$HOME`/`$XDG_CONFIG_HOME` must isolate to temp dirs and must never read/write the real `~/.bashrc`/`~/.zshrc`/`~/.config`. Keep test output **pristine** — suppress expected error messages (e.g. spy on `console.error`).

## Changelog rule (STRICT)

**Every change that affects the `ccjump` tool — a feature, fix, or user-visible behavior change in `src/`, `install.sh`, or `scripts/` — MUST add a `CHANGELOG.md` entry in the same commit/PR.** Put the bullet under the current unreleased version (the top-most `## [X.Y.Z]`), categorized `Added` / `Changed` / `Fixed` / `Removed` per [Keep a Changelog](https://keepachangelog.com/). Once a version is tagged/released, the next change starts a new `## [Unreleased]` section above it.

Pure repo tooling/docs (CI, `CLAUDE.md`, `README`, `CONTRIBUTING`, this rule) are **not** tool changes — they need neither a changelog entry nor a version bump. CI enforces this on pull requests (`.github/workflows/changelog.yml`); the `skip-changelog` label bypasses it for non-functional PRs.

## Versioning & releases

`package.json` `version` is the source of truth (embedded in the binary; `ccjump --version` reads it). Releases are tag-driven: bump `version` + `CHANGELOG.md`, commit, `git push origin main`, then `git tag vX.Y.Z && git push origin vX.Y.Z` (tag **must** start with `v` and equal the `package.json` version). The tag fires `release.yml`, which builds all 5 binaries + `SHA256SUMS` and publishes a GitHub Release that `install.sh` and `ccjump upgrade` consume. Commits follow Conventional Commits, one logical change each.
