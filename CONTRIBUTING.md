# Contributing to ccjump

Thanks for your interest in improving `ccjump`! This document explains how to set up your environment, the conventions we follow, and how to get a change merged.

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Ways to contribute

- **Report a bug** — open an issue with the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).
- **Request a feature** — open an issue with the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).
- **Improve docs** — typos, clarifications, and examples are all welcome.
- **Submit code** — fix a bug or build a feature (see below).

For anything beyond a trivial fix, please open an issue first so we can agree on the approach before you invest time.

## Development setup

ccjump is written in **TypeScript** and built with **[Bun](https://bun.sh)** (no Node toolchain required).

```sh
# install Bun: https://bun.sh
git clone https://github.com/codebuster22/ccjump.git
cd ccjump
bun install
```

Run the CLI straight from source:

```sh
bun run start -- --help
bun run start -- add .
```

> Tip: point `XDG_CONFIG_HOME` at a throwaway directory while developing so you don't touch your real config or rc files:
> ```sh
> XDG_CONFIG_HOME="$(mktemp -d)" HOME="$(mktemp -d)" bun run start -- setup --non-interactive
> ```

## Project layout

```
src/
  index.ts        # CLI entry + command dispatch
  constants.ts    # REPO_SLUG, rc markers, env var names
  version.ts      # VERSION (from package.json)
  platform.ts     # OS/arch detection, asset name, home/config paths
  config.ts       # Config type, load/save/migrate/recover
  registry.ts     # add/list/remove/validate
  shells.ts       # allowlist, rc paths, init codegen, idempotent wiring
  launch.ts       # buildArgs (pure) + run (resolve, cd, spawn claude)
  tty.ts          # isInteractive()
  onboard.ts      # onboarding wizard + pure helpers
  download.ts     # release API, asset url, download, sha256, checksums
  upgrade.ts      # isNewer, upgrade(), maybeNotify()
tests/            # bun unit tests + shell integration tests
scripts/build.ts  # cross-compile to dist/
install.sh        # POSIX installer
.github/workflows # ci + release
```

All logic lives in the binary; the shell layer is a thin set of generated functions. Keep each module to one clear responsibility.

## Testing

All changes must keep the suites green and the output pristine (no stray warnings).

```sh
bun test                              # unit + onboarding/config/launch/etc.
bash tests/install.test.sh            # install.sh os/arch + URL assertions
bash tests/integration/init.test.sh   # emitted init runs in real bash AND zsh
```

`zsh` must be installed for the integration test to cover both shells. To simulate a clean CI environment (no ambient config), run:

```sh
HOME="$(mktemp -d)" XDG_CONFIG_HOME="$(mktemp -d)" bun test
```

### Test-driven development

We follow TDD: write a failing test first, watch it fail for the right reason, then make it pass. Tests should verify real behavior (real temp dirs, real shells) rather than mocks of the unit under test. Tests that touch `$HOME`/`$XDG_CONFIG_HOME` must isolate to temp directories — they must never read or write your real `~/.bashrc`, `~/.zshrc`, or `~/.config`.

> **Bun gotcha:** `os.homedir()` caches `$HOME` at process startup and ignores runtime mutation. `homeDir()` reads `process.env.HOME` directly so tests can redirect it — keep it that way.

## Coding conventions

- **TypeScript, `strict` mode.** No Node-only assumptions — code must run under Bun and survive `bun build --compile`.
- **Supported shells are bash and zsh only.** `$SHELL` is a hint, never wired blindly.
- **`ccjump init` must fail inert:** missing config → no stdout/stderr, exit 0; unsupported/unknown shell arg → stderr + exit 1.
- **rc edits are idempotent** (the `# >>> ccjump >>>` … `# <<< ccjump <<<` marker block) and only ever touch `~/.bashrc` / `~/.zshrc`.
- Match the surrounding code's naming and density. Prefer small, focused functions.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add fish shell support
fix: clean up upgrade tmp on checksum mismatch
docs: clarify the permissions table
test: cover digit-first project names in zsh
ci: pin action versions to SHAs
chore: bump dependencies
```

Keep each commit focused. The subject is imperative and lower-case; explain the *why* in the body when it isn't obvious.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Make your change with tests; keep commits clean and conventional.
3. Run the full verification locally:
   ```sh
   bun test && bash tests/install.test.sh && bash tests/integration/init.test.sh
   ```
4. Update docs (README/CHANGELOG) if behavior changed.
5. Open a PR using the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) and link any related issue.

CI runs the same checks plus `shellcheck install.sh`. A maintainer will review; please be responsive to feedback (and feel free to push back with reasoning — see our review culture in the Code of Conduct).

## Releasing (maintainers)

Releases are tag-driven. Pushing a `vX.Y.Z` tag triggers `.github/workflows/release.yml`, which cross-compiles all targets, generates `SHA256SUMS`, and uploads them to a GitHub Release. Bump `version` in `package.json` and add a `CHANGELOG.md` entry in the same commit as the tag.

## A note on naming

`ccjump` deliberately avoids Anthropic trademarks. Please keep it that way: don't use "Claude" or Anthropic logos/wordmarks in the tool's branding, and keep the "Unofficial — not affiliated with or endorsed by Anthropic" disclaimer intact in user-facing surfaces.

---

Thank you for contributing! 💛
