# AGENTS.md — Repaso (study platform for the AI master's degree)

Route index.

Project context, scope, commands, the Docker rebuild rule and what not to do live in
`.claude/rules/project-policies.md`. How the assistant must collaborate (verify, explain,
practice mode) lives in `.claude/rules/ai-collaboration.md`. Both are always loaded with this
index. Writing lessons: `.claude/rules/content-authoring.md` (loaded when touching
`src/content/`). Building simulations: `.claude/rules/simulations.md`.

## Code map

Status: ⏳ planned (does not exist yet) · 🚧 in progress · ✅ done.
Update the status column when a change creates or finishes a path.

| Path                                                                | Content                                                                                                                                                                                                             | Status |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json` | pnpm project, Vite with MDX (GFM, KaTeX, Shiki at build time), strict TypeScript, `@/` alias                                                                                                                        | ✅     |
| `src/content/`                                                      | the lessons: `catalog.ts` (six subjects in order), `define-lesson.ts`, one folder per subject with `index.ts` (lessons, sources, exercise ids) and `NN-<slug>.mdx`; `content.test.ts` keeps catalog and MDX in sync | ✅     |
| `src/content/supervisado/`                                          | 7 lessons: project flow, cleaning, validation, metrics, regression, classifiers, feature extraction                                                                                                                 | ✅     |
| `src/content/no-supervisado/`                                       | 9 lessons: distances and evaluation, k-means, hierarchical, density, spectral, GMM and semi-supervised, PCA/ICA, PageRank and association rules, deep clustering                                                    | ✅     |
| `src/content/deep-learning/`                                        | 9 lessons: perceptron and MLP, training, optimisers and regularisation, first Keras network, CNN, augmentation and transfer learning, advanced vision, text and sequences, GANs                                     | ✅     |
| `src/content/refuerzo/`                                             | 6 lessons: RL basics, Q-learning, DQN, policy gradient, actor-critic, DDPG/PPO and model-based                                                                                                                      | ✅     |
| `src/content/optimizacion/`                                         | 7 lessons: complexity, sorting, design techniques, problem types and search, gradient descent, metaheuristics, genetic algorithms                                                                                   | ✅     |
| `src/content/razonamiento/`                                         | 5 lessons: Bayes, certainty factors and Dempster-Shafer, fuzzy sets, fuzzy relations and inference, fuzzy control                                                                                                   | ✅     |
| `src/design/`                                                       | tokens (light/dark, subject hues, plot palette, the "task" highlighter), base styles, `prose.css` for lessons; fonts from `@fontsource-variable`                                                                    | ✅     |
| `src/i18n/es.ts`                                                    | every UI string (lesson text lives in the MDX)                                                                                                                                                                      | ✅     |
| `src/features/shell/`                                               | header, footer, theme (light/dark, stored, applied before first paint by `index.html`)                                                                                                                              | ✅     |
| `src/features/catalog/`                                             | queries over the catalog and progress, progress ring, subject icons                                                                                                                                                 | ✅     |
| `src/features/lesson/`                                              | lesson page: sidebar, header with sources, MDX provider, table of contents, done button, prev/next                                                                                                                  | ✅     |
| `src/features/exercises/`                                           | `Quiz`, `Predict`, `CodeExercise`, `RunCode`, hints and solution, answer checking, lazy CodeMirror editor                                                                                                           | ✅     |
| `src/features/python/`                                              | Pyodide 314.0.7 in a Web Worker (ADR-0002): protocol, worker, client, status hook, traceback cleaning                                                                                                               | ✅     |
| `src/features/progress/`                                            | progress store in localStorage (ADR-0003)                                                                                                                                                                           | ✅     |
| `src/features/simulations/`                                         | `kit/` (frame, controls, axes, seeded RNG, animation hook), 39 simulations in `supervised/`, `unsupervised/`, `deep/`, `rl/`, `optimization/`, `reasoning/`, `registry.tsx`, `algorithms.test.ts`                   | ✅     |
| `src/features/illustrations/`                                       | static SVG diagrams (CRISP-DM, autoencoder, CNN, transfer learning, GAN, RL loop, fuzzy controller)                                                                                                                 | ✅     |
| `src/features/ui/`                                                  | `Callout`, `Figure`                                                                                                                                                                                                 | ✅     |
| `src/routes/`                                                       | route tree, home, subject page, lesson route, not found, error boundary                                                                                                                                             | ✅     |
| `public/datasets/`                                                  | datasets used by exercises (red wine quality, mall customers), copied from `Asignaturas/`                                                                                                                           | ✅     |
| `scripts/check_exercises.py`                                        | runs every exercise solution with its check and every runnable example                                                                                                                                              | ✅     |
| `Dockerfile`, `nginx.conf`, `docker-compose.yml`, `.dockerignore`   | build with pnpm, serve with unprivileged nginx on 8080; host port `REPASO_PORT` (3100)                                                                                                                              | ✅     |
| `docs/adr/`                                                         | ADRs 0001–0003 (Proposed), index and template                                                                                                                                                                       | ✅     |
| `Asignaturas/`                                                      | original course material (slides, notebooks, datasets); git-ignored, source for the lessons                                                                                                                         | ✅     |

Dependency rules: `.claude/rules/architecture.md` and `.claude/rules/import-conventions.md`.

## `.claude/` map and agent config

| Path                                         | What it holds                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `.claude/settings.json`                      | team permissions: allowed checks and Docker rebuild, `.env` blocked                                     |
| `.claude/rules/project-policies.md`          | what this is, content principles, commands, Docker rebuild rule, dependencies, language, what not to do |
| `.claude/rules/ai-collaboration.md`          | verify before writing, explain like a colleague, practice mode, small commits                           |
| `.claude/rules/architecture.md`              | layout, how lessons, exercises, Python and simulations fit together, dependency rules                   |
| `.claude/rules/content-authoring.md`         | (path-scoped to `src/content/`) tone, structure, components, exercise rules, MDX pitfalls               |
| `.claude/rules/simulations.md`               | (path-scoped) pure tested logic, the kit, tokens, accessibility and motion                              |
| `.claude/rules/code-style.md`                | strict TypeScript, React, accessibility basics, lint/format, errors                                     |
| `.claude/rules/naming-conventions.md`        | files, lessons, exercise ids, sims, tokens                                                              |
| `.claude/rules/import-conventions.md`        | `@/` alias, feature public entries                                                                      |
| `.claude/rules/atomic-functions-solid.md`    | atomic functions and the SOLID that applies here                                                        |
| `.claude/rules/testing-conventions.md`       | Vitest, content consistency, algorithm tests, the exercise checker                                      |
| `.claude/agents/content-reviewer.md`         | lesson reviewer (read-only): correctness, exercises, pragmatism, tone                                   |
| `.claude/agents/ts-reviewer.md`              | app reviewer (read-only): algorithms, boundaries, typed edges, React, a11y in sims                      |
| `.claude/agents/accessibility-reviewer.md`   | WCAG 2.2 AA reviewer (read-only)                                                                        |
| `.claude/agents/code-reviewer.md`            | generic reviewer (read-only): security, correctness, performance, maintainability                       |
| `.claude/commands/new-lesson.md`             | `/new-lesson <subject> <topic>`: from course material to a verified lesson                              |
| `.claude/commands/defend.md`                 | `/defend <topic>`: ML interview drill on a topic, in Spanish                                            |
| `.claude/commands/create-pr.md`              | `/create-pr`: PR with `gh`, local checks, generated description                                         |
| `.claude/commands/new-adr.md`                | `/new-adr <title>`: ADR skeleton filled in with the author                                              |
| `.claude/workflows/spec-driven-phase.md`     | plan (and wait) → spec → tasks → implementation → tests → review → ADR                                  |
| `.claude/workflows/git-workflow.md`          | `main`/`develop`, branch naming, Conventional Commits                                                   |
| `.claude/workflows/architecture-decision.md` | when an ADR is needed and how to write one                                                              |
| `.claude/skills/frontend-design/`            | design guidance for new UI                                                                              |
| `.claude/skills/ui-ux-pro-max/`              | (link to `.agents/skills/`) UI/UX reference data and search scripts                                     |
