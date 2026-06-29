# Security Policy

## Supported versions

`ccjump` is pre-1.0. Security fixes are applied to the latest release only.

| Version | Supported          |
|---------|--------------------|
| latest  | :white_check_mark: |
| older   | :x:                |

Run `ccjump upgrade` to move to the latest release (it verifies the download's SHA-256 before replacing the binary).

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, use one of these private channels:

1. **GitHub Security Advisories** (preferred) — go to the repository's
   [**Security → Report a vulnerability**](https://github.com/codebuster22/ccjump/security/advisories/new) page.
2. **Email** — **mihirsinh@chainlabs.in** with the subject line `ccjump security`.

Please include, as much as you can:

- A description of the issue and its impact.
- Steps to reproduce (a proof-of-concept, command, or config that triggers it).
- The `ccjump --version`, your OS, and shell.
- Any suggested remediation.

You can expect an initial acknowledgement within a few days. We'll keep you
informed of progress and coordinate a disclosure timeline with you; please give
us a reasonable window to ship a fix before any public disclosure.

## What's in scope

`ccjump` runs locally and touches a few sensitive surfaces — reports about these are especially valuable:

- **Self-update path (`ccjump upgrade`)** — checksum verification, the atomic in-place binary replace, and temp-file handling.
- **Shell code generation (`ccjump init`)** — the emitted function definitions and the single-quote escaping of project names (shell-injection surface).
- **rc-file writes** — onboarding only edits `~/.bashrc` / `~/.zshrc` via an idempotent marker block; report anything that writes elsewhere or can be coerced into doing so.
- **Config handling** — parsing/recovery of `config.json`.

## Good to know

- ccjump's **default permission mode is `skip`**, which launches `claude` with `--dangerously-skip-permissions`. This is a deliberate, documented default chosen during onboarding — it is not a vulnerability in ccjump itself, but be aware of what it means for Claude Code's behavior. Choose `normal` during onboarding (or edit `permissions` in the config) if you don't want it.
- Release binaries are published with a `SHA256SUMS` manifest; `install.sh` and `ccjump upgrade` fetch from GitHub Releases over HTTPS.

Thank you for helping keep ccjump and its users safe.
