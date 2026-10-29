---
description: Create a pull request into develop with conventional commits, local checks and a generated description
allowed-tools: Bash, Read
---

# Create PR

Create a pull request with `gh` from the current branch into `develop` (never into `main`,
except the `develop → main` release PR).

## Workflow

1. Check the branch name follows `.claude/workflows/git-workflow.md`.
2. Run the local checks and stop if any fails: `pnpm lint`, `pnpm typecheck`, `pnpm test`,
   `pnpm build`, and `python scripts/check_exercises.py` for the lessons changed. Report the
   exact output of failures.
3. Analyse the commits (`git log develop..HEAD`) and the diff (`git diff develop...HEAD`). If
   there are uncommitted changes, ask before committing them, and propose a Conventional
   Commit message `<type>(<scope>): <subject>` (scopes: `content`, `sims`, `exercises`,
   `python`, `ui`, `a11y`, `adr`, `repo`).
4. Generate the title and description:
   - **Context**: what and why.
   - **Changes**: grouped by area (lessons, simulations, app).
   - **Decisions**: ADRs added or updated (links). If the change contains a decision without
     an ADR, say so.
   - **How to verify**: commands and the pages to open.
   - **Checklist** (below).
5. Show title and description and **wait for confirmation** before publishing.
6. `gh pr create --base develop --title ... --body ...`.

## PR checklist

- [ ] Commits are small and follow Conventional Commits
- [ ] Lint, typecheck, tests, build and the exercise checker pass locally
- [ ] Numbers and formulas in changed lessons were recomputed
- [ ] `AGENTS.md` code map updated if paths were created or finished
- [ ] No `Asignaturas/`, secrets or `.env` in the diff
