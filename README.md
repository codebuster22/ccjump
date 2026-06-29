# ccjump

Jump into a project and launch Claude Code via a bare shell command.

> Unofficial — not affiliated with or endorsed by Anthropic.

---

## Install

Run the one-liner below. It downloads the latest binary from GitHub Releases, installs it to `~/.local/bin`, and walks you through onboarding:

```sh
bash -c "$(curl -fsSL https://raw.githubusercontent.com/codebuster22/ccjump/main/install.sh)"
```

Alternative (onboarding falls back to `/dev/tty` for input):

```sh
curl -fsSL https://raw.githubusercontent.com/codebuster22/ccjump/main/install.sh | bash
```

Make sure `~/.local/bin` is on your `PATH`. The installer will warn you if it isn't.

---

## Usage

Onboarding registers your first project and wires your shell (`~/.bashrc` / `~/.zshrc`). After that, each registered project gets a bare shell function equal to its folder name:

```
ccjump — jump into a project and launch Claude Code

Usage:
  ccjump                     run onboarding (first time)
  ccjump add [path]          register a project (default: current dir)
  ccjump list                list registered projects
  ccjump remove <name>       unregister a project
  ccjump init bash|zsh       print shell functions (for eval)
  ccjump run <name> [args]   launch Claude Code in a project
  ccjump setup               re-run onboarding
  ccjump tty on|off|status   route Claude through /dev/tty (interactive-mode fix)
  ccjump upgrade             update ccjump to the latest release
  ccjump --version | --help
```

### How it works

`ccjump add` registers a project and gives you a shell function whose name is the folder name. That function `cd`s into the project directory and runs `claude` with your configured flags.

For example, if you register `~/code/my-app`:

```sh
my-app                  # launch Claude in my-app (new session)
my-app resume           # resume the most recent session (--resume)
my-app resume <id>      # resume a specific session by ID
my-app continue         # continue the most recent conversation (--continue)
my-app --model opus     # pass extra flags straight through to claude
```

Any argument after a recognized mode word (`resume`, `continue`) is passed through to `claude` verbatim.

---

## Permissions

ccjump supports three permission modes, configured during onboarding or by editing the config:

| Mode     | Flag passed to `claude`                    | Description                  |
|----------|--------------------------------------------|------------------------------|
| `skip`   | `--dangerously-skip-permissions` (default) | Skips all permission prompts |
| `allow`  | `--allow-dangerously-skip-permissions`     | Allows skipping when prompted|
| `normal` | _(none)_                                   | Standard Claude behaviour    |

The default mode is `skip`.

`launchArgs` (default: `["--verbose"]`) is always passed to `claude` on every launch. Everything after a recognized mode word in your command is forwarded to `claude` verbatim.

---

## Interactive-mode note

Some setups (e.g. WSL + oh-my-zsh) intermittently fail to hand a launched process a real terminal, causing Claude to exit immediately without entering interactive mode. ccjump detects this and offers to route Claude through `/dev/tty` to fix it.

You can also toggle this manually:

```sh
ccjump tty on      # enable /dev/tty routing
ccjump tty off     # disable
ccjump tty status  # show current setting
```

---

## Windows

v1 supports **Git Bash** and **WSL**. Native PowerShell support is deferred.

---

## Updating

```sh
ccjump upgrade
```

Self-updates are checksum-verified. ccjump checks for updates once a day and prints a notice if a newer version is available. To disable the check:

```sh
export CCJUMP_NO_UPDATE_CHECK=1
```

Add that to your shell rc file to suppress it permanently.
