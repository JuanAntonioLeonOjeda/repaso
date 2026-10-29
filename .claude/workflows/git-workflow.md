---
description: Permanent branches (main, develop), branch naming, Conventional Commits and small atomic commits.
---

# Git workflow

## Permanent branches

| Branch    | Purpose                                                                       |
| --------- | ----------------------------------------------------------------------------- |
| `main`    | Stable: what the author uses day to day. Only receives merges from `develop`. |
| `develop` | Integration branch. Every work branch starts from it and returns to it.       |

## Naming

| Kind of work                          | Branch                        | Example                       |
| ------------------------------------- | ----------------------------- | ----------------------------- |
| New or rewritten lessons              | `content/<subject>-<topic>`   | `content/refuerzo-sac`        |
| App feature or simulation             | `feature/<kebab-description>` | `feature/attention-heads-sim` |
| Bug fix (also a wrong formula)        | `fix/<kebab-description>`     | `fix/gae-lambda-sign`         |
| Config/tooling (`.claude/`, CI, deps) | `chore/<kebab-description>`   | `chore/bump-pyodide`          |
| Docs only                             | `docs/<kebab-description>`    | `docs/adr-progress-sync`      |

## Commits

- **Conventional Commits**: `<type>(<scope>): <subject>`, imperative, English, ≤ 72 chars.
  Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `perf`, `content`.
  Scopes: `content`, `sims`, `exercises`, `python`, `ui`, `a11y`, `adr`, `repo`.
- **Small and atomic**: one logical step per commit, building and passing tests on its own.
- Body when the why is not obvious; reference the ADR (`Refs: ADR-0002`).
- The assistant proposes commit messages and commits **only when the author asks**.

## What NOT to do

- No direct commits to `main`.
- No force-push to `develop` or `main`.
- Never commit `Asignaturas/`.
