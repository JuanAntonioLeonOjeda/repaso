# Spec: "Expandir conocimientos" and the FastAPI tutorial

## What it solves

The author wants to learn tools used at work that the master did not cover, starting with
FastAPI, in the same hands-on format as the subjects: plain-language lessons, simulations
and exercises that run real Python in the browser.

## Scope

- A new home-page section, **"Expandir conocimientos"**, below the TFM, listing tutorials as
  cards. A tutorial is browsed like a subject (`/<slug>`, lessons, progress).
- The first tutorial, **FastAPI** (`/fastapi`), 12 lessons building one project: an API that
  serves a wine-quality model (users, models, predictions, database, tests, deployment).
- Exercises run FastAPI 0.136.1 inside Pyodide 314.0.7 and call the app with
  `httpx.AsyncClient(transport=httpx.ASGITransport(app=app))` (ADR-0005).
- Two simulations: the life of a request (which step answers with which status code) and
  the event loop (`def` vs `async def`, blocking vs awaiting).

## Out of scope

- Packages missing from Pyodide (PyJWT, python-multipart, SQLModel, pydantic-settings):
  shown in non-runnable code blocks, never in exercises.
- Running a real server from the app: lessons explain `uvicorn`, `pytest` and Docker for the
  author's machine.

## Acceptance criteria

- Given the home page, when it loads, then a section "Expandir conocimientos" shows a FastAPI
  card with lesson count and progress.
- Given a FastAPI exercise with a sync (`def`) endpoint, when it runs in the browser, then it
  answers as on a server (Starlette's thread pool is run inline in the worker).
- Given any FastAPI exercise, when `scripts/check_exercises.py fastapi` runs in CPython with
  the same package versions, then its solution passes its check (top-level `await` allowed).
- Given the content tests, when they run, then the tutorial's files, exercise ids and
  simulations are consistent like any subject's.

## Open questions

None (name, project and syllabus confirmed by the author on 2026-10-30).
