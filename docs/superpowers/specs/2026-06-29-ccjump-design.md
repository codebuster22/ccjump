# ccjump — Design Spec

- **Date:** 2026-06-29
- **Status:** Draft for review
- **Author:** Mihirsinh Parmar (with Claude)
- **One-liner:** A small, public CLI that registers project directories and gives you bare shell commands (`my-app`, `my-app resume`, …) to jump into a project and launch Claude Code — in bash & zsh, on Linux/macOS (Windows via Git Bash/WSL).

> Unofficial tool. Not affiliated with or endorsed by Anthropic. ("Claude" is Anthropic's trademark; the tool name avoids it deliberately.)

---

## 1. Purpose & scope

Replace the personal `~/.claude-cc.sh` zsh launcher with a distributable, cross-shell, cross-OS tool that anyone can install and register their own projects into. The author's `titus-bot` / `titus-intelligence` entries become example/personal config, not baked-in.

**Core value:** type a bare command (the project's folder name) in your shell and land in that project with Claude Code running, with your preferred permission and pass-through behavior.

## 2. Locked decisions

| Decision | Choice |
|----------|--------|
| Tool / binary name | **`ccjump`** (npm-free, no command collision, avoids "claude"/"cl" trademark+clash) |
| Language / build | **Bun + TypeScript**, shipped via `bun build --compile` (single binary, no rewrite) |
| Shell integration | **`eval`-init** model (zoxide-style): binary emits per-shell functions |
| Shells (v1) | **bash + zsh** |
| Install channels (v1) | **`curl`-install script + GitHub Releases** (npm / Homebrew deferred) |
| Onboarding | **Interactive, TTY-aware, runs during install** (non-interactive fallback for CI) |
| Home-guard ("cd to ~ first") | **Dropped** |
| Permissions default | Onboarding **offers 3**, default = **always-skip** (`--dangerously-skip-permissions`) |
| Interactive-TTY handling | Default normal stdio; **reactive opt-in** to `/dev/tty` (`forceTty`) on detected failure, + `ccjump tty on/off/status` |
| Windows (v1) | **Git Bash / WSL** (ship Windows binary; native PowerShell deferred to v1.1) |

## 3. Architecture

```
                       ~/.config/ccjump/config.json   (registry + settings)
                                  ▲
   install.sh ──downloads──▶  ccjump (single binary)
                                  │
   rc: eval "$(ccjump init zsh)" ─┤ init  → prints shell functions to stdout
                                  │ run   → resolve name → chdir → spawn claude (stdio inherit; opt-in /dev/tty)
                                  │ add/list/remove → mutate config
                                  └ setup (onboarding) → wire shells, add first project
```

- **All logic lives in the binary** — testable, single source of truth. The shell layer is a thin set of generated functions.
- **Why shell functions at all:** a binary can `chdir`+launch Claude fine, but it cannot create bare command *names* in the parent shell — that one capability requires `eval`-init functions. We do **not** need the parent shell to stay in the project dir (home-guard dropped), so functions are minimal wrappers.
- **No zsh special-var traps:** logic moved out of shell, so the `path`/`PATH` footgun that broke the original script cannot recur.

## 4. Config schema

Path: `${XDG_CONFIG_HOME:-~/.config}/ccjump/config.json`

```jsonc
{
  "version": 1,
  "permissions": "skip",            // "skip" | "allow" | "normal"
  "launchArgs": ["--verbose"],      // always passed to claude (user-editable)
  "forceTty": false,                // route claude through /dev/tty (interactive-mode fix; opt-in)
  "wiredShells": ["zsh", "bash"],   // which rc files we added the eval line to
  "projects": {
    "titus-bot":          { "path": "/home/u/codebase/products/titus-bot" },
    "titus-intelligence": { "path": "/home/u/codebase/products/titus-intelligence" }
  }
}
```

- Project key = command name (folder basename by default; overridable via `--name`).
- Paths stored absolute. Corrupt/unreadable config → back up to `config.json.bak` and recreate.

## 5. Shell integration

`ccjump init bash|zsh` reads the registry and prints one function per project to stdout:

```sh
# bash & zsh (function bodies identical; both accept hyphenated names)
titus-bot ()          { ccjump run "titus-bot" "$@"; }
titus-intelligence () { ccjump run "titus-intelligence" "$@"; }
```

- rc line (added by onboarding, idempotent — marker + grep):
  ```sh
  # >>> ccjump >>>
  eval "$(ccjump init zsh)"
  # <<< ccjump <<<
  ```
- Re-eval safe: re-sourcing just redefines functions. No directory hooks needed (unlike zoxide), so no hook-dedup logic required.
- **On error** (unknown shell, missing config), `init` prints **nothing to stdout**, writes the error to stderr, exits non-zero → `eval "$(ccjump init …)"` degrades to `eval ""`, a harmless no-op even if the binary is missing or stale.

## 6. Launch behavior — `ccjump run <name> [mode] [args…]`

Called by the generated functions; also usable directly as a no-shell-integration fallback.

1. Resolve `<name>` → path (error if unknown).
2. Verify path exists (error if deleted/moved).
3. Verify `claude` is on PATH (friendly error + install pointer if not).
4. Build argv: `claude <permsFlag> <launchArgs…> <modeFlag> <passthrough…>`
   - `permsFlag`: `skip`→`--dangerously-skip-permissions`, `allow`→`--allow-dangerously-skip-permissions`, `normal`→ (none)
   - `modeFlag`: first arg is a mode **only** if it's `resume`/`continue` → `--resume`/`--continue` (and is consumed); anything else is passthrough.
   - `passthrough`: all remaining args forwarded verbatim (session id, `--model`, even `--dangerously-skip-permissions` to force it per-launch).
5. Spawn claude with `cwd=path` and **wait**, propagating its exit code (spawn-and-wait, not POSIX `exec` — uniform across platforms). Stdio:
   - If `forceTty` is set → hand claude the controlling terminal (`/dev/tty`), falling back to inherited stdio if it can't be opened.
   - Otherwise → inherited stdio. If claude **exits immediately with a non-zero code in an interactive terminal** (the signature of failing to start its TUI), print a short explanation and **offer** to enable `/dev/tty` handling; on yes, persist `forceTty=true` and re-launch via `/dev/tty`.
   *(Task 0 spike: inherited stdio is intermittent on some setups — incl. the author's WSL + oh-my-zsh — where claude drops to non-interactive/`--print`; `/dev/tty` fixes it. Kept opt-in so the majority who don't need it see no change. Toggle anytime with `ccjump tty on|off|status`.)*

Examples:
```
my-app                    → claude --dangerously-skip-permissions --verbose
my-app resume             → … --resume
my-app resume <id>        → … --resume <id>
my-app continue           → … --continue
my-app --model opus       → … --model opus           (passthrough; not a mode)
```

## 7. Command surface (v1)

| Command | Purpose |
|---------|---------|
| `ccjump` (no config) | Run onboarding |
| `ccjump add [path]` | Register project (default = cwd; name = basename; `--name <x>` to override / resolve collision) |
| `ccjump list` | Table of registered projects: command → path |
| `ccjump remove <name>` | Unregister |
| `ccjump init bash\|zsh` | Emit shell functions (for `eval`) |
| `ccjump run <name> …` | Launcher (internal + fallback) |
| `ccjump setup` | Re-run onboarding explicitly |
| `ccjump tty on\|off\|status` | Enable/disable/show `/dev/tty` handling for launches (`forceTty`) |
| `ccjump upgrade` | Self-update to latest release (verify checksum, atomic in-place replace) |
| `ccjump --version` / `--help` | Standard |

## 8. Onboarding (TTY-aware)

Triggered by `ccjump` with no config, by `ccjump setup`, or by the installer.

**Input selection (the key to working from `curl | bash`):**
1. If `process.stdin.isTTY` → prompt on stdin (covers `bash -c "$(curl …)"` and direct runs).
2. Else if `/dev/tty` opens → prompt via `/dev/tty` (covers `curl … | bash` in a real terminal).
3. Else (no terminal — CI/Docker) → **non-interactive**: write defaults, skip prompts, print "run `ccjump` to finish setup."

**Steps:**
1. Detect OS (Windows → note Git Bash/WSL).
2. Detect shells (allowlist ∩ present: `~/.bashrc`, `~/.zshrc`, `$SHELL` hint) → **multi-select** which to wire.
3. **Permissions** prompt — 3 options, default = always-skip.
4. Add first project (default = cwd; confirm/edit path).
5. Append the `eval` line to each chosen rc (idempotent), print restart hint + the new command name.

Prompt UI: `@clack/prompts` (bundles under `bun build --compile`).

## 9. Install — `curl` script + GitHub Releases

- **`install.sh`** (POSIX sh): detect OS/arch via `uname` (`Linux`/`Darwin`/`MINGW*`/`MSYS*` → os; `x86_64`→`x64`, `aarch64`/`arm64`→`arm64`), download the matching release asset, `chmod +x`, install to `~/.local/bin` (warn if not on PATH), then run `ccjump` for onboarding (TTY-aware as above).
- **Documented one-liner** (robust form — stdin stays the terminal, so onboarding is interactive):
  ```sh
  bash -c "$(curl -fsSL https://<host>/install.sh)"
  ```
  `curl -fsSL https://<host>/install.sh | bash` also works (onboarding falls back to `/dev/tty`).
- **Release assets:** `ccjump-{linux,darwin}-{x64,arm64}`, `ccjump-windows-x64.exe`.
- **CI:** GitHub Actions on tag → `bun build --compile --target=bun-<os>-<arch>` per target → upload assets → publish `install.sh` pointing at latest.

## 10. Safety guards (consolidated)

- **Shell allowlist:** supported = `{bash, zsh}` (Unix/Git Bash/WSL). Only offer shells both supported **and** detected. `$SHELL` is a hint only, never wired blindly.
- **Unsupported `$SHELL`** (fish/dash/nu/PowerShell): do not wire; print clear notice + `ccjump run <name>` fallback; still offer supported shells found.
- **`init` failure is inert:** empty stdout on any error. Missing config → fully silent (no stdout/stderr, exit 0) so a leftover `eval` line never spams shell startup; unsupported shell arg → stderr + exit 1.
- **rc writes:** only confirmed, supported, detected rc files; idempotent marker+grep; never touch unknown files.
- **Name validation:** function names checked valid for the target shell; invalid/empty → require `--name`. Collisions on `add` → prompt for `--name`.
- **Launch-time checks:** unknown project name, missing path, or missing `claude` → explicit, actionable errors.
- **Interactive-TTY workaround is opt-in:** never forced; offered only on a detected quick-fail in an interactive terminal, persisted as `forceTty`, reversible via `ccjump tty off`.
- **Config safety:** versioned; corrupt → back up + recreate.

## 11. Windows (v1 = Git Bash / WSL)

- Ship `ccjump-windows-x64.exe`; it runs under Git Bash/WSL where the bash/zsh `eval`-init works unchanged. `install.sh` detects `MINGW*`/`MSYS*`.
- **Deferred to v1.1:** native PowerShell (`install.ps1` + `irm|iex`, `ccjump init powershell`, `$PROFILE` wiring) and `cmd`/Clink.

## 12. Versioning, cross-compilation & releases

- **Source control:** new standalone **git repo `ccjump`** (public). Conventional commits; trunk-based with release tags.
- **Tool versioning (semver):** version lives in `package.json`, embedded into the binary at build time; `ccjump --version` reads it. Tags `vX.Y.Z` drive releases.
- **Release pipeline:** GitHub Actions on tag `vX.Y.Z` → build matrix `bun-{linux,darwin}-{x64,arm64}` + `bun-windows-x64` (~57 MB each; `--compile` limits don't affect this fs+spawn tool) → upload assets → `install.sh` resolves "latest" (or a pinned `CCJUMP_VERSION`).
- **Config versioning:** `config.json.version` (separate from tool version) gates schema migrations.
- **Updates (v1):** the tool owns updates (curl channel has no package manager).
  - `ccjump upgrade`: query Releases API for latest → download matching OS/arch asset → **verify SHA256** (published as `SHA256SUMS` in the release) → **atomic in-place replace** (Unix: rename-over running binary; Windows: rename-self then move new in).
  - **Opt-out update-notifier:** once-a-day cached check (stores last-check time + latest-seen tag), prints "vX.Y.Z available — run `ccjump upgrade`"; non-blocking, auto-skipped in non-interactive/CI, disabled via `CCJUMP_NO_UPDATE_CHECK=1`.
  - In-place replace only (no `versions/` dir); `upgrade --rollback` deferred.

## 13. Testing

- **Unit (`bun test`):** name resolution, mode/flag composition (incl. perms variants & pass-through), the `shouldOfferTty` reactive-offer decision (forceTty gating + quick-fail window), `forceTty` config round-trip + `ccjump tty` toggle, config read/write/migrate/recover, `install.sh` OS/arch mapping (table-driven), and **snapshot tests of emitted bash/zsh** from `init`.
- **Integration (CI):** source emitted init in **real bash and real zsh**; assert each function is defined and invokes `ccjump run <name>` with forwarded args — including **hyphenated names** (`titus-bot`) in both shells.
- **Onboarding:** test the input-selection logic (stdin TTY / `/dev/tty` / non-interactive) with a stubbed prompt layer.

## 14. Out of scope (v1) / future

- npm global, Homebrew tap, Scoop/WinGet (v1.1+).
- Native Windows PowerShell/cmd (v1.1).
- `ccjump doctor` (PATH/rc/claude diagnostics), `ccjump rename`, last-used/sort, fuzzy match, fish support (later).

## 15. Open items

- **Repo location:** intended as a **new standalone public repo `ccjump`**. This spec lives in `titus-bot/docs/superpowers/specs/` per process; the implementation repo is created at plan time.
- **Commit of this spec:** pending user direction (titus-bot's convention is commit-on-request only).
