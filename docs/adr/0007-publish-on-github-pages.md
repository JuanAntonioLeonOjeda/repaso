# ADR-0007: Publish the app on GitHub Pages from a public repository

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

Until now the app ran only on localhost in Docker (ADR-0001) and the repository was private.
The author wants it reachable on the web. It is a static build with no backend, so any static
host works; GitHub Pages is free and already next to the code. Constraints:

- On a GitHub Free account, Pages needs a public repository, and the published site is public
  on every plan except Enterprise.
- The app assumed it lived at the domain root; Pages serves a project site under `/repaso/`.
- Pages has no single-page-app fallback: a deep link like `/repaso/vision/evaluar` is a 404.

## Options considered

### Option A — Make `repaso` public and deploy with a GitHub Actions workflow

- Pros: one repository; the site is rebuilt on every push to `main`; no cost.
- Cons: the whole repository and its history become public (code, `.claude/`, commit emails,
  course-derived summaries, past exam questions, the TFM text).

### Option B — Keep `repaso` private and push only the build to a separate public repository

- Pros: code and history stay private.
- Cons: a second repository and a token to push to it; the site content is public anyway.

### Option C — GitHub Pro to serve Pages from the private repository

- Pros: code stays private with no second repository.
- Cons: a paid plan; the site is still public.

## Decision

Option A, chosen by the author, publishing all the content. The workflow
(`.github/workflows/deploy.yml`) lints, tests and builds with `BASE_PATH=/repaso/`, copies
`index.html` to `404.html` so deep links load the app, and deploys with the official Pages
actions. Vite's `base` drives the router `basename`, the worker's dataset URLs and the TFM
asset URLs; lesson Markdown links and images go through the MDX provider so they keep it.
Docker keeps building at `/`.

Before the repository was made public, its full history was checked: no `Asignaturas/`, no
`public/tfm-local/`, no `.env` and no secret patterns. Patient-derived TFM images are still
never committed (ADR-0004), so the public TFM pages show their "images only on the author's
machine" notice.

## Consequences

- What gets easier: the app is reachable from any device at
  `https://juanantonioleonojeda.github.io/repaso/`.
- What we accept: everything in the repository is public, including the author's email in
  commit metadata; deep links answer with HTTP 404 (served by `404.html`) before the app routes
  them; progress stays per browser (ADR-0003).
- What would make us revisit this: a request from the university or the LUMOS data owners to
  remove content (then move to Option B or C and drop that content from the site), or a need
  for access control (then a host with authentication).

## Verification

- 2026-11-09: `BASE_PATH=/repaso/ pnpm build` served under `/repaso/` by a local server that
  answers like Pages (404.html on missing paths): home, a deep link, the lesson image and the
  datasets resolve under `/repaso/`.
- 2026-11-09: GitHub Free cannot serve Pages from a private repository (the account plan has no
  Pages for private repositories); the repository was made public by the author.
