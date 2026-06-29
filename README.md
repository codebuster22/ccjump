<div align="center">

# ccjump

**Jump into a project and launch Claude Code with a single bare shell command.**

[![CI](https://github.com/codebuster22/ccjump/actions/workflows/ci.yml/badge.svg)](https://github.com/codebuster22/ccjump/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-fbf0df.svg?logo=bun)](https://bun.sh)
![Shells: bash · zsh](https://img.shields.io/badge/shells-bash%20·%20zsh-4EAA25)

</div>

> **Unofficial** — not affiliated with or endorsed by Anthropic. "Claude" is a trademark of Anthropic; the tool name avoids it deliberately.

`ccjump` registers your project directories and gives each one a **bare shell command equal to its folder name**. Type `my-app` in your terminal and you land in that project with Claude Code already running — with your preferred permission and pass-through behavior.

```sh
my-app                  # cd into ~/code/my-app and launch Claude Code
my-app resume           # …resuming the most recent session
my-app --model opus     # …passing extra flags straight through to claude
```

---

## Table of contents

- [Why ccjump](#why-ccjump)
- [Install](#install)
- [Usage](#usage)
- [How it works](#how-it-works)
- [Permissions](#permissions)
- [Configuration](#configuration)
- [Interactive-mode note](#interactive-mode-note)
- [Updating](#updating)
- [Windows](#windows)
- [Building from source](#building-from-source)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Why ccjump

- **One word to launch.** No aliases to hand-maintain, no `cd … && claude …` muscle memory — the command *is* the folder name.
- **Cross-shell, cross-OS.** bash + zsh on Linux/macOS (and Windows via Git Bash/WSL), from a single self-contained binary.
- **Yours to configure.** Permission mode, always-on launch flags, and per-launch pass-through are all under your control.
- **No runtime dependencies.** Shipped as a `bun build --compile` standalone binary — install with one `curl`, update with `ccjump upgrade` (checksum-verified).
- **Stays out of your way.** The only thing added to your shell is one idempotent `eval` line; remove it and ccjump leaves no trace.

## Install

Run the one-liner below. It detects your OS/arch, downloads the latest binary from GitHub Releases, installs it to `~/.local/bin`, and walks you through onboarding:

```sh
bash -c "$(curl -fsSL https://raw.githubusercontent.com/codebuster22/ccjump/main/install.sh)"
```

Alternative (onboarding falls back to `/dev/tty` for input):

```sh
curl -fsSL https://raw.githubusercontent.com/codebuster22/ccjump/main/install.sh | bash
```

Make sure `~/.local/bin` is on your `PATH` — the installer warns you if it isn't. To install elsewhere, set `CCJUMP_BIN_DIR`.

On macOS, `~/.local/bin` may not be on your `PATH` by default — add `export PATH="$HOME/.local/bin:$PATH"` to your shell profile (the installer warns if it isn't there).

> `ccjump` launches [Claude Code](https://claude.com/claude-code), so you'll want the `claude` CLI on your `PATH` too. ccjump prints a friendly pointer if it can't find it.

## Usage

First run (or `ccjump setup`) registers your first project and wires your shell (`~/.bashrc` / `~/.zshrc`). After that, every registered project has a bare command equal to its folder name.

```
ccjump — jump into a project and launch Claude Code

Usage:
  ccjump                     run onboarding (first time)
  ccjump add [path]          register a project (default: current dir; --name <x> to override)
  ccjump list                list registered projects
  ccjump remove <name>       unregister a project
  ccjump init bash|zsh       print shell functions (for eval)
  ccjump run <name> [args]   launch Claude Code in a project
  ccjump setup               re-run onboarding
  ccjump tty on|off|status   route Claude through /dev/tty (interactive-mode fix)
  ccjump upgrade             update ccjump to the latest release
  ccjump --version | --help
```

## How it works

A binary can `cd` and launch a process, but it can't create new *command names* in your parent shell — that one capability needs shell functions. So `ccjump` keeps **all logic in the binary** and adds exactly one line to your rc file:

```sh
# >>> ccjump >>>
eval "$(ccjump init zsh)"
# <<< ccjump <<<
```

`ccjump init <shell>` prints one tiny function per registered project:

```sh
my-app () { ccjump run 'my-app' "$@"; }
```

Calling `my-app` runs `ccjump run my-app …`, which resolves the path, `cd`s into it, and launches `claude` with your configured flags. Hyphenated and digit-leading folder names (`titus-bot`, `2024-app`) work in both shells.

For a project registered at `~/code/my-app`:

```sh
my-app                  # launch Claude in my-app (new session)
my-app resume           # resume the most recent session  (--resume)
my-app resume <id>      # resume a specific session by ID
my-app continue         # continue the most recent conversation  (--continue)
my-app --model opus     # extra flags pass straight through to claude
```

`resume` and `continue` are recognized **only** as the first argument; everything else (and everything after a mode word) is forwarded to `claude` verbatim.

> **Safe by design:** if the `eval` line is ever left behind after uninstalling, `ccjump init` exits silently (no output, status 0) so it never spams your shell startup.

## Permissions

ccjump supports three permission modes, chosen during onboarding (or by editing the config):

| Mode     | Flag passed to `claude`                    | Description                       |
|----------|--------------------------------------------|-----------------------------------|
| `skip`   | `--dangerously-skip-permissions` (default) | Skips all permission prompts      |
| `allow`  | `--allow-dangerously-skip-permissions`     | Allows skipping when prompted     |
| `normal` | _(none)_                                   | Standard Claude Code behaviour    |

The default is `skip`. `launchArgs` (default `["--verbose"]`) is passed on every launch, and anything after a recognized mode word is forwarded to `claude` verbatim — including `--dangerously-skip-permissions` itself if you want to force it per-launch.

## Configuration

Config lives at `${XDG_CONFIG_HOME:-~/.config}/ccjump/config.json` and is safe to hand-edit:

```jsonc
{
  "version": 1,
  "permissions": "skip",          // "skip" | "allow" | "normal"
  "launchArgs": ["--verbose"],    // always passed to claude
  "forceTty": false,              // route claude through /dev/tty (see below)
  "wiredShells": ["zsh", "bash"], // which rc files have the eval line
  "projects": {
    "my-app": { "path": "/home/you/code/my-app" }
  }
}
```

- **Project key** = the command name (folder basename by default; override with `ccjump add --name <x>`).
- Paths are stored absolute. A corrupt config is backed up to `config.json.bak` and recreated from defaults.

| Environment variable     | Effect                                                              |
|--------------------------|--------------------------------------------------------------------|
| `XDG_CONFIG_HOME`        | Base dir for the config (defaults to `~/.config`).                 |
| `CCJUMP_NO_UPDATE_CHECK` | Set to `1` to disable the once-a-day update check.                 |
| `CCJUMP_BIN_DIR`         | Install target for `install.sh` (defaults to `~/.local/bin`).      |

## Interactive-mode note

Some setups (e.g. WSL + oh-my-zsh) intermittently fail to hand a launched process a real terminal, causing Claude to exit immediately without entering interactive mode. ccjump detects this and **offers** to route Claude through `/dev/tty`, persisted as `forceTty`. It's opt-in — the majority who don't need it see no change. Toggle it manually any time:

```sh
ccjump tty on      # enable /dev/tty routing
ccjump tty off     # disable
ccjump tty status  # show current setting
```

## Updating

```sh
ccjump upgrade
```

Self-updates download the matching asset, **verify its SHA-256** against the release's `SHA256SUMS`, and replace the binary in place. ccjump also checks for updates once a day and prints a non-blocking notice if a newer version exists. Disable that check with:

```sh
export CCJUMP_NO_UPDATE_CHECK=1   # add to your shell rc to make it permanent
```

## Windows

v1 supports **Git Bash** and **WSL**, where the bash/zsh integration works unchanged. Native PowerShell (`install.ps1`, `ccjump init powershell`, `$PROFILE` wiring) is deferred to a later release.

**Known limitations:** Native Windows **ARM64** has no prebuilt binary yet — use the x64 build under emulation; a native arm64 binary is planned. Native PowerShell/cmd remains deferred.

## Building from source

ccjump is built with [Bun](https://bun.sh) + TypeScript.

```sh
git clone https://github.com/codebuster22/ccjump.git
cd ccjump
bun install
bun test                          # unit + integration tests
bun run start -- --help           # run the CLI from source
bun run build                     # cross-compile binaries into dist/
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, testing, and commit conventions.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before opening an issue or PR.

## Security

Found a vulnerability? Please **don't** open a public issue — see [SECURITY.md](SECURITY.md) for how to report it privately.

## License

[MIT](LICENSE) © 2026 Mihirsinh Parmar.

---

<div align="center"><sub>Unofficial — not affiliated with or endorsed by Anthropic.</sub></div>
