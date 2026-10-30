---
description: What this project is, its scope, commands, the Docker rebuild rule, language and what not to do.
---

# Project policies and context

## What this is

**Repaso**: a private study platform to review the subjects of the author's AI master's
degree (MIAR). Seven subjects (Python for AI, supervised, unsupervised, deep learning,
reinforcement learning, optimisation algorithms, approximate reasoning), each a sequence of lessons that summarise the
course material in plain language, with interactive simulations and exercises that run real
Python in the browser.

- It runs on localhost in Docker. **No accounts, no backend, no telemetry** (ADR-0001).
- Progress lives in the browser's `localStorage` (ADR-0003).
- Python exercises run in Pyodide inside a Web Worker, loaded from the jsDelivr CDN
  (ADR-0002). The machine needs internet access the first time an exercise runs.
- The **TFM section** (`src/content/tfm/`) tells the author's master's thesis (LumosNet, in
  `../tfm` and `../tfm-memoria`). Images derived from LUMOS patients (radiographs, activation
  maps, Grad-CAM) are generated locally by `scripts/tfm/export_assets.py` into
  `public/tfm-local/` and **never committed or baked into the image** (ADR-0004). Only
  aggregate metrics are committed. Scripts read from `../tfm` and never write there.
- The original course material is in `Asignaturas/` (slides, notebooks, datasets). It is the
  **source** for the lessons, is git-ignored and never shipped. Python for AI is the exception:
  its notebooks, exams and practices live in `../asignaturas/python-para-ia/` (only its PDF is
  in `Asignaturas/Python para IA/`). That subject is deliberately practical: most exercises
  are past exam questions.
- **Expandir conocimientos** (`extras` in `catalog.ts`): practical tutorials beyond the
  syllabus, browsed like a subject. The first is FastAPI (`src/content/fastapi/`). Its
  exercises run FastAPI in Pyodide with an inline thread pool and call the app with
  `httpx.AsyncClient` and top-level `await` (ADR-0005); `TestClient` and pytest appear only in
  non-runnable code.

Priority: **correct and useful content over features**. A wrong formula or a broken exercise
is a bug of the highest severity; a missing feature is not.

## Content principles (the reason the project exists)

The author found the master too academic. Every lesson must therefore:

- explain in close, plain Spanish (not a copy of the slides), with examples and pictures;
- say **how it is done at work** and **why** (`<Callout kind="real">`);
- reuse the course notebooks as examples and exercises where they exist;
- have exercises with hints and a solution, and simulations where moving a parameter teaches
  something.

Authoring rules: `.claude/rules/content-authoring.md`. Simulations:
`.claude/rules/simulations.md`.

## Commands

```bash
pnpm install
pnpm dev               # Vite dev server on :5173
pnpm lint
pnpm typecheck
pnpm test              # Vitest: content consistency, algorithms, UI
pnpm build
python scripts/check_exercises.py [filtro]   # runs every exercise solution + check (see README)
docker compose up -d --build                 # the app on http://localhost:3100
```

### Rebuild the Docker image after every change

The author uses the app through the container (`repaso-web-1`, port `REPASO_PORT`, 3100 by
default), which serves the image built at that moment: `pnpm dev` or green tests do not update
it. After any change in `src/`, `public/`, styles, `index.html`, `nginx.conf` or dependencies,
and before saying the work is done, run `docker compose up -d --build` and say in the final
message that the image was rebuilt (or why it was not).

## Dependencies

- Versions are pinned exactly and come from the registry, never from memory.
- pnpm enforces a minimum release age: do not bypass it (no `minimumReleaseAgeExclude`);
  pick an older version instead.
- The Pyodide version is pinned in two places that must agree: the `pyodide` devDependency
  (types) and `PYODIDE_VERSION` in `src/features/python/python.worker.ts`. Packages used in
  exercises must exist in that Pyodide release (numpy, pandas, scikit-learn, scipy,
  matplotlib, networkx, Pillow, nltk without corpora, opencv-python, beautifulsoup4, fastapi,
  starlette, httpx, sqlalchemy, bcrypt…); TensorFlow, PyTorch, seaborn, PyJWT,
  python-multipart, SQLModel and pydantic-settings do not.
- When a main dependency is added or upgraded, update its badge in the README.

## Language

- Conversation with the author: Spanish.
- Code, identifiers, comments, commits, ADRs, specs and `.claude/`: English.
- Everything the user reads (UI strings in `src/i18n/es.ts`, lessons in `src/content/`): Spanish.

## What NOT to do

- Do not add a backend, accounts or analytics.
- Do not copy slides verbatim or reproduce long passages of the course material: summarise.
- Do not publish exercises whose solution has not passed `scripts/check_exercises.py`.
- Do not add dependencies without saying why; prefer small hand-written SVG over chart
  libraries for simulations.
- Do not commit `Asignaturas/`, secrets or `.env`.
- Do not create content in `.claude/` just to fill a folder: add it when the need is real.
