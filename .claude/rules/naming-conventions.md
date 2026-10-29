---
description: Naming conventions for files, components, hooks, lessons, exercise ids and tokens.
---

# Naming conventions

- Components `PascalCase.tsx`; hooks `useXxx.ts`; everything else `kebab-case.ts`.
- Simulations `XxxSim.tsx` and illustrations `XxxDiagram`: the MDX tag is the same name.
- Lessons `src/content/<subject>/NN-<slug>.mdx`; the slug is the URL segment, in Spanish,
  kebab-case, without accents (`augmentation-y-transfer-learning`).
- Exercise ids: short kebab-case, unique within the lesson (`fit-transform`, `q-learning`).
- One main responsibility per file; `utils.ts` or `helpers.ts` is a smell.
- Tests next to the code: `<file>.test.ts(x)`.
- `PascalCase` types and components, `camelCase` variables and functions,
  `SCREAMING_SNAKE_CASE` only for true module constants.
- Booleans as affirmative questions: `isSolved`, `hasConsole`, `isPlaying`.
- i18n keys: `area.element` (`exercise.showSolution`).
- Design tokens: semantic names (`--color-task`, `--subject-color`, `--plot-3`), never
  `--yellow-300` in components.
