# ADR-0006: Deep learning tutorials: PyTorch code verified offline, NumPy exercises in the browser

- **Status:** Proposed
- **Date:** 2026-11-09

## Context

The "Tutoriales" section adds four deep learning tutorials (vision, text, generative images,
building an LLM) that train real networks step by step. The author chose PyTorch as their
framework (it is what the TFM and the LLM/diffusion ecosystem use). Two constraints clash:

- Every exercise runs in Pyodide (ADR-0002), and Pyodide 314.0.7 ships neither PyTorch,
  torchvision, TensorFlow nor transformers. Training a CNN on CIFAR-10 in the browser would
  take hours even if it did.
- Every claim in a lesson must be checkable (`ai-collaboration.md`): code that is never run
  and accuracy numbers that are never measured are exactly the bugs the project fears most.

## Options considered

### Option A — Framework code only as reading, no verification

- Pros: no extra tooling.
- Cons: snippets drift into code that does not run; quoted numbers are guesses.

### Option B — Framework code verified by a script per tutorial, NumPy exercises in the browser

- Pros: the lessons' PyTorch code comes from `scripts/tutorials/<slug>.py`, which trains and
  evaluates every model on the author's machine (the TFM's environment has torch) and writes
  the numbers the lessons quote; exercises keep running in the browser by practising the
  pieces (convolution, cross-entropy, attention, BPE, sampling…) in NumPy, checked by
  `scripts/check_exercises.py` like any other.
- Cons: a lesson snippet and its script can drift (they are kept side by side and reviewed
  together); verification needs a machine with torch and a few downloads (datasets, weights).

### Option C — Train in the browser with a JavaScript framework (TensorFlow.js, ONNX Runtime Web)

- Pros: real training interactively.
- Cons: a new heavy dependency and a second language for the learner; not the framework the
  author uses at work; still far too slow for CIFAR-10 or a transformer.

## Decision

Option B. The browser keeps doing what it does well (small, exact exercises with instant
feedback) and the author's machine does what only it can (real training). Each tutorial has
one script under `scripts/tutorials/`, run with its own pinned environment
(`scripts/tutorials/requirements.txt`; the TFM's environment works for Visión but lacks
`transformers`, and `../tfm` is read-only);
its downloads and checkpoints go to directories given on the command line, never into the
repository. Lessons state the hardware, seed and epochs behind every number.

## Consequences

- What gets easier: tutorials can show production-shaped PyTorch (Dataset/DataLoader, a
  training loop, checkpoints, transfer learning) without pretending it runs in the page.
- What we accept: the numbers are from one run (MPS is not bit-for-bit deterministic) and the
  lessons say so; framework snippets are not editable or runnable in the app.
- What would make us revisit this: a Pyodide release with PyTorch, or a need for interactive
  training (then a simulation, not a framework in the browser).

## Verification

- 2026-11-09: the Pyodide 314.0.7 lock file (`pyodide-lock.json` on jsDelivr) has no
  `torch`, `torchvision`, `tensorflow` or `transformers`; it has numpy 2.4.6 and
  scikit-learn 1.8.0.
- 2026-11-09: the TFM's environment has torch 2.13.0 and torchvision 0.28.0 with MPS
  available; `scripts/tutorials/vision.py` runs the Visión tutorial end to end there.
- 2026-11-09: `scripts/tutorials/requirements.txt` (torch 2.13.0, transformers 5.20.2,
  scikit-learn 1.9.1) runs `scripts/tutorials/texto.py`, including fine-tuning BETO on MPS.
