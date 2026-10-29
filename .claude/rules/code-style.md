---
description: TypeScript and React code style — strictness, lint/format, errors, accessibility basics and comments.
---

# Code style

Complements `naming-conventions.md`, `import-conventions.md` and `atomic-functions-solid.md`.

## Language

Code, identifiers, comments, commits, ADRs and specs in **English**. User-facing strings in
Spanish: UI chrome in `src/i18n/es.ts`, lesson text in `src/content/`.

## TypeScript

- `strict: true`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`.
- No `any`. Unknown external data (localStorage, worker messages, Pyodide objects) is typed at
  the edge, with a parser or a narrow interface.
- No non-null assertions (`!`); model the absence (`?? fallback`).
- Explicit return types on exported functions; discriminated unions for states; exhaustive
  `switch` with a `never` check.

## React

- Function components and hooks. State as local as possible; derive instead of duplicating.
- External stores (progress, theme, Python status) are read with `useSyncExternalStore`.
- No effects to derive state; effects only to sync with things React does not own (the DOM of
  rendered MDX, canvas drawing, animation frames).
- No inline colours or sizes in components: tokens from `src/design/` (inline `style` that
  references a token, like `--subject-color`, is fine).
- Lazy-load heavy things (CodeMirror, each lesson, each simulation).

## Accessibility basics (reviewed by `accessibility-reviewer`)

- Semantic HTML first; ARIA only to fill gaps.
- Visible focus, keyboard operation for everything interactive, contrast per WCAG 2.2 AA in
  light and dark.
- Colour is never the only cue. Respect `prefers-reduced-motion`.

## Format and lint

- Prettier (print width 100) and ESLint (typescript-eslint type-aware, `react-hooks`,
  `jsx-a11y` strict). Zero warnings. No `eslint-disable` without a justification in the same
  comment.

## Errors

- Expected failures (Python errors, failed checks, CDN unreachable) are typed results shown in
  the UI; unexpected ones reach the route error boundary.
- Never an empty `catch` without a comment saying why it is safe.

## Comments

- Comment the **why**: algorithm choices, numerical tricks, accessibility decisions, ADR links.
- No commented-out code. `TODO` only with enough context to resume it.
