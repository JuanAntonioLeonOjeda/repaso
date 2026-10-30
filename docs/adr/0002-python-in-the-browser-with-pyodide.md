# ADR-0002: Python exercises in the browser with Pyodide in a Web Worker

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The author learns by doing: exercises must run real Python, with the libraries of the course
(numpy, pandas, scikit-learn, matplotlib), check the answer and show hints and a solution.
There is no backend (ADR-0001).

## Options considered

### Option A — Pyodide (CPython in WebAssembly) in a Web Worker, loaded from a CDN

- Pros: real CPython 3.14 with numpy, pandas, scikit-learn, scipy, matplotlib, networkx,
  Pillow (checked in the 314.0.7 lock file); runs off the main thread; no server.
- Cons: first load downloads tens of MB and needs internet; no TensorFlow or PyTorch; a
  runaway loop can only be stopped by terminating the worker.

### Option B — Self-host the Pyodide distribution inside the image

- Pros: works offline.
- Cons: the full distribution is hundreds of MB; the image becomes heavy for a feature that is
  used a few minutes at a time.

### Option C — A Python execution service (Jupyter kernel gateway) in a second container

- Pros: any library, including TensorFlow.
- Cons: a backend to run and secure (arbitrary code execution); contradicts ADR-0001.

## Decision

Option A, pinned to Pyodide 314.0.7 on jsDelivr. Deep-learning exercises are written with
numpy (forward/backward passes, convolutions, attention) or scikit-learn's `MLPClassifier`;
the course's Keras code is shown and explained instead of executed.

## Consequences

- Each run uses a fresh namespace; the learner's code and then the `check` code run in it;
  matplotlib figures are returned as PNGs.
- `scripts/check_exercises.py` runs every solution in a local Python with the same package
  versions, because exercises cannot be tested in Vitest.
- Revisit if offline use matters (switch to Option B with only the needed packages) or if
  TensorFlow/PyTorch exercises become essential (Option C).

## Verification

- 2026-10-29: Pyodide 314.0.7 lock file lists numpy 2.4.6, pandas 3.0.2, scikit-learn 1.8.0,
  matplotlib 3.10.8, networkx 3.6.1; an exercise and the k-means colour quantisation example
  (sklearn + Pillow + matplotlib) ran in Chrome from the Docker image.
