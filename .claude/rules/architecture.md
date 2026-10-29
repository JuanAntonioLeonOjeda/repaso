---
description: App layout, feature folders, how lessons, exercises, simulations and the Python worker fit together, and the dependency rules.
---

# Architecture

A static single-page app (Vite + React + React Router). No server code: nginx serves the build.

## Layout

```
src/
  content/              # the lessons
    catalog.ts          # subjects in home-page order
    define-lesson.ts    # catalog entry + lazy component per lesson
    <subject>/index.ts  # the subject and its lessons (metadata, exercise ids, sources)
    <subject>/NN-<slug>.mdx
  design/               # tokens (light/dark), base styles, prose (lesson typography)
  i18n/es.ts            # every UI string (lesson text lives in the MDX)
  features/
    shell/              # header, footer, theme
    catalog/            # queries over the catalog, progress ring, subject icons
    lesson/             # lesson page, sidebar, table of contents, MDX component map
    exercises/          # Quiz, Predict, CodeExercise, RunCode, answer checking
    python/             # Pyodide worker, its client and status store
    progress/           # localStorage progress store
    simulations/        # kit/ (frame, controls, plot helpers) + one folder per subject
    illustrations/      # static SVG diagrams used by lessons
    ui/                 # Callout, Figure
  routes/               # route tree and pages (home, subject, lesson, not found)
```

## How a lesson works

1. `content/<subject>/index.ts` declares the lesson with `defineLesson`, which wraps the MDX
   import in `React.lazy`: each lesson is its own chunk.
2. MDX is compiled at build time (`@mdx-js/rollup`) with GFM, KaTeX (math) and Shiki (code,
   both themes as CSS variables): no highlighter or math engine ships to the browser.
3. `features/lesson/mdx-components.tsx` exposes, by name, everything a lesson may use without
   importing it: callouts, figures, exercises, every simulation and every illustration.
4. Simulations are registered in `features/simulations/registry.tsx`, each lazily loaded.

## Exercises and Python

- `CodeExercise` runs the learner's code and then the `check` code (asserts) **in the same
  namespace** inside a Web Worker (`python.worker.ts`). A fresh namespace per run.
- The worker loads Pyodide from the CDN on first use, auto-installs packages from the imports,
  copies datasets from `/datasets/` into its file system and returns stdout and matplotlib
  figures (PNG data URLs). "Stop" terminates the worker.
- CodeMirror is lazy-loaded with the first editor on a page.

## Dependency rules

- `routes → features → design / i18n / content types`. Features import other features only
  through their `index.ts`.
- `content/` may import only `define-lesson` and types; lessons never import components (the
  MDX provider supplies them).
- Simulation logic that can be wrong (algorithms) lives in plain `.ts` modules or exported pure
  functions and is unit-tested; components only draw.

## When NOT to apply this literally

- Tiny presentational components do not need a folder each.
- Do not create a context or a global store before two features need the same state.
