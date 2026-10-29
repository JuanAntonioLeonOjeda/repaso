---
description: Testing conventions — Vitest and Testing Library, content consistency, algorithm tests and the exercise checker.
---

# Testing conventions

## Tools

- **Vitest** with **Testing Library** (`@testing-library/react`, `user-event`); query by role
  and accessible name.
- `scripts/check_exercises.py` runs every `CodeExercise` solution with its `check` and every
  `RunCode` example in a Python with the same packages as Pyodide.
- No snapshot tests of whole pages.

## What must be tested

- **Content consistency** (`src/content/content.test.ts`): file names match lesson order and
  slug; exercise ids in the catalog match the MDX; every simulation/diagram used exists; every
  code exercise has a solution and a check.
- **Algorithms** (`src/features/simulations/algorithms.test.ts`): each simulation's logic
  against hand-computed values, preferably the ones in the course slides.
- **Exercises UI**: right/wrong feedback, hints one at a time, progress marked.
- **Routes**: home, subject and not-found pages.
- Pure helpers (answer checking, progress parsing, traceback cleaning).

## Determinism

- Seeded random numbers (`createRng`) in simulations and tests. No network: Pyodide is not
  loaded in unit tests.

## Before saying something is done

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`, plus the exercise checker for any
lesson touched, plus a Docker rebuild (see `project-policies.md`).
