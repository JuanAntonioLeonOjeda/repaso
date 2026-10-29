---
name: spec-driven-phase
description: Process for any non-trivial change to the app (not for a single lesson) — short plan and wait, spec, tasks, implementation in small commits, tests, review and ADR.
---

# Spec-driven change

For changes to the platform itself (a new kind of exercise, progress export, search, a new
subject…). A new lesson follows `/new-lesson` instead.

## Steps

0. **Branch** from an up-to-date `develop` (`.claude/workflows/git-workflow.md`).
1. **Short plan, then stop.** In the conversation: goal, what will be built, decisions that
   need the author, risks, what must be verified first. **Wait for confirmation.**
2. **Spec** (`specs/<name>/spec.md`): what it solves, out of scope, acceptance criteria as
   given/when/then, open questions. Do not continue while questions remain.
3. **Tasks** (`specs/<name>/tasks.md`): ordered checklist, each task one or a few commits.
4. **Implement task by task**, committing as you go. Anything the plan did not foresee goes
   into the spec first.
5. **Tests** per `.claude/rules/testing-conventions.md`.
6. **Review**: `ts-reviewer`; `accessibility-reviewer` for UI; `content-reviewer` for
   lessons; `code-reviewer` for a general pass when the diff is large.
7. **Close**: update `AGENTS.md`; ADR if a decision was taken
   (`.claude/workflows/architecture-decision.md`); rebuild the Docker image.

## When to skip steps

Typos, wording, a number fix in a lesson or a dependency patch bump do not need a spec: a
branch, a small commit and green checks.
