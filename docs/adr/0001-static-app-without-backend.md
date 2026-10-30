# ADR-0001: A static app without a backend

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The platform is for one person, on localhost, in Docker. It shows lessons, simulations and
exercises. The author asked explicitly for no authentication. The content changes only when a
lesson is written, which already means a rebuild.

## Options considered

### Option A — Static SPA (Vite + React), content compiled into the build

- Pros: one container (nginx), nothing to operate, no database, instant pages, works without a
  server process; lessons are versioned with the code.
- Cons: progress cannot be shared between browsers; every content change needs a rebuild.

### Option B — SPA + API (FastAPI) with a database

- Pros: progress shared across devices; content editable without rebuilding.
- Cons: two services, migrations and an API to maintain for a single user; no feature needs it
  today.

### Option C — A notebook server (JupyterLab) with the lessons as notebooks

- Pros: real Python with every library (TensorFlow included).
- Cons: no designed reading experience, simulations harder to build, heavy image.

## Decision

Option A. The project's value is the content and the interaction; a backend would add
operation cost without a feature that needs it. Lessons are MDX compiled at build time
(`@mdx-js/rollup`, KaTeX and Shiki also at build time), so the browser only gets HTML-ready
components.

## Consequences

- Easier: run with `docker compose up -d --build`; nothing else to keep alive.
- Harder: progress lives in one browser (ADR-0003); heavy Python libraries are not available
  (ADR-0002).
- Revisit if: progress must sync between devices, or lessons should be edited without a rebuild.

## Verification

- Build and container checked on 2026-10-29: `pnpm build` and `docker compose up -d --build`,
  pages served with HTTP 200 on port 3100.
