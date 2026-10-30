# ADR-0005: FastAPI exercises run in Pyodide with an inline thread pool

- **Status:** Proposed
- **Date:** 2026-10-30

## Context

The "Expandir conocimientos" section starts with a FastAPI tutorial whose exercises must run
real FastAPI, like every other exercise (ADR-0002). Two things do not work in WebAssembly
Python, which has no threads:

- `fastapi.testclient.TestClient`, the usual way to call an app in tests, runs the app through
  an anyio blocking portal in a thread.
- Starlette runs every `def` endpoint and every sync dependency in a thread pool
  (`anyio.to_thread.run_sync`), so even `httpx.AsyncClient` with `ASGITransport` fails on the
  first `def` endpoint.

## Options considered

### Option A — Only `async def` endpoints in the exercises

- Pros: no change to the runtime.
- Cons: teaches the wrong default (sync libraries such as SQLAlchemy's `Session`,
  scikit-learn or `requests` belong in `def` endpoints); hides the `def`/`async def` lesson.

### Option B — Run `anyio.to_thread.run_sync` inline in the worker

- Pros: `def` endpoints and dependencies (including `yield` ones) work unchanged; one small
  patch, applied once when anyio is loaded; exercises call the app with
  `httpx.AsyncClient(transport=httpx.ASGITransport(app=app))` and top-level `await`, which is
  FastAPI's documented "async tests" pattern.
- Cons: in the browser a slow `def` endpoint blocks the event loop, unlike on a server; the
  learner cannot see thread-pool concurrency by running code (a simulation shows it instead).

### Option C — Exercises without running the app (read-and-predict only)

- Pros: nothing to patch.
- Cons: the tutorial was asked to be very practical; it would lose most of its exercises.

## Decision

Option B. `python.worker.ts` replaces `anyio.to_thread.run_sync` with a coroutine that calls
the function directly, the first time a run loads anyio. Exercises use `httpx.AsyncClient`
and `await`; `TestClient` and pytest are taught in non-runnable code for the author's machine.
`scripts/check_exercises.py` compiles code with `PyCF_ALLOW_TOP_LEVEL_AWAIT` so the same
solutions run in CPython, where the real thread pool is used.

## Consequences

- What gets easier: any FastAPI feature that does not need threads, files or the network works
  in exercises (routing, Pydantic, dependencies, SQLAlchemy on in-memory SQLite, middleware,
  background tasks, lifespan via `app.router.lifespan_context`).
- What we accept: timing-sensitive behaviour of `def` endpoints differs from a server; the
  lessons say so and `EventLoopSim` models the real behaviour. Packages missing from Pyodide
  (PyJWT, python-multipart, SQLModel, pydantic-settings) appear only in non-runnable code.
- What would make us revisit this: a Pyodide release with thread support (then drop the
  patch), or exercises that need a real server (then a container, revisiting ADR-0001).

## Verification

- 2026-10-30: the Pyodide 314.0.7 lock file lists fastapi 0.136.1, starlette 1.0.0,
  pydantic 2.12.5, httpx 0.28.1, sqlalchemy 2.0.48 and bcrypt 5.0.0.
- In Chrome, `TestClient` and a `def` endpoint failed in `anyio.from_thread` /
  `anyio.to_thread`; with the patch, paths, validation (422), `yield` dependencies,
  middleware, background tasks, OAuth2 bearer and SQLAlchemy on SQLite all answered as in
  CPython. The lesson 5 exercises passed from the Docker image.
- Every FastAPI solution passes `scripts/check_exercises.py fastapi` in CPython 3.13 with the
  same package versions.
