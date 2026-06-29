<!--
Thanks for contributing to ccjump! Please fill this out so reviewers have the
context they need. See CONTRIBUTING.md for the development workflow.
-->

## Summary

What does this PR change, and why?

## Related issue

Closes #<!-- issue number, or remove this line -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Docs / chore / CI

## How was this tested?

Describe what you ran and the result.

```text
bun test
bash tests/install.test.sh
bash tests/integration/init.test.sh
```

## Checklist

- [ ] `bun test` passes and output is pristine (no stray warnings)
- [ ] `bash tests/install.test.sh` and `bash tests/integration/init.test.sh` pass (zsh installed)
- [ ] Added/updated tests for the change
- [ ] Followed the conventions in CONTRIBUTING.md (TypeScript strict, inert `init`, idempotent rc writes, supported shells = bash/zsh)
- [ ] Commits use Conventional Commits
- [ ] Added a `CHANGELOG.md` entry under the current unreleased version (or applied the `skip-changelog` label for a non-functional change)
- [ ] Updated README if behavior changed
- [ ] Kept the "Unofficial — not affiliated with Anthropic" disclaimer and avoided Anthropic trademarks
