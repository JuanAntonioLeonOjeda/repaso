# ADR-0003: Learning progress in localStorage

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Marking lessons as done and remembering solved exercises makes the platform useful for
reviewing over weeks. There is no backend (ADR-0001).

## Options considered

### Option A — `localStorage`, read through a small external store

- Pros: zero infrastructure; instant; survives image rebuilds (it belongs to the origin
  `localhost:3100`).
- Cons: one browser only; lost if the browser data is cleared or the port changes.

### Option B — IndexedDB

- Pros: more space, structured.
- Cons: more code for a few kilobytes of data.

### Option C — A backend

- Rejected with ADR-0001.

## Decision

Option A, one JSON entry (`repaso-progress-v1`), parsed defensively (a corrupt entry resets to
empty progress instead of breaking the app). Exercise ids are listed in the catalog so
progress can be counted without loading each lesson; a test keeps them in sync with the MDX.

## Consequences

- Changing `REPASO_PORT` changes the origin and therefore starts with empty progress.
- Revisit if progress must move between devices: add an export/import button first, a backend
  only if that is not enough.
