---
description: Import by alias, feature public entries only, no deep relative paths.
---

# Import conventions

- One alias, `@/` → `src/`. Relative imports only within the same folder (ESLint forbids
  `../`).
- A feature is imported through its `index.ts` (`@/features/exercises`), never through its
  internal files.
- Lessons import nothing: components reach them through the MDX provider.
- `import type` for type-only imports (enforced by `consistent-type-imports`).
- No barrel files outside feature entries.

## Why

Moving a file does not break importers, and the dependency direction
(`routes → features → design/content`) is visible in the path.
