# Spec: the "Tutoriales" section and the deep learning tutorials

## What it solves

The subjects explain each idea on its own; the author wants to see them **together**, step by
step, the way a model is built at work: data, model, training, evaluation, serving. Each step
must say where in the syllabus that idea was studied, with a link to the lesson.

## Scope

- The home-page section **"Expandir conocimientos" becomes "Tutoriales"** (decided by the
  author on 2026-11-09). It lists every tutorial as a card; a tutorial is browsed like a
  subject (`/<slug>`, lessons, progress). FastAPI moves into it unchanged (its URL and the
  progress stored for it stay the same).
- Four deep learning tutorials, in this order, written with **PyTorch** (author's choice:
  it is what the TFM and the LLM/diffusion ecosystem use; a "En Keras" note maps each step
  to what the course did):
  1. **Visión** (`/vision`): classify CIFAR-10 images, from the dataset to a served model.
     Mirrors the course's Deep Vision practice (MLP vs CNN, augmentation, transfer learning).
  2. **Texto** (`/texto`): classify texts, from a TF-IDF baseline to fine-tuning a
     pretrained transformer.
  3. **IA generativa de imágenes** (`/generativa`): autoencoder, VAE, GAN, diffusion.
  4. **Crea tu LLM** (`/llm`): BPE tokenizer, bigram model, self-attention, a small GPT,
     pretraining, sampling, instruction tuning and LoRA. Text generation lives here (an LLM
     is generative AI for text), so there is no separate "generative text" tutorial.
- Every step of the four tutorials ends its main sections with a **"Del temario"** box
  linking to the lessons where the idea was studied. The `Temario` component moves from
  `features/tfm` to `features/lesson` so the TFM and the tutorials share it, and its links
  may point at any section (subjects, TFM, tutorials).
- Code that needs PyTorch, torchvision or Hugging Face cannot run in Pyodide: it is shown in
  plain code blocks. Each tutorial has a script in `scripts/tutorials/` that runs that code
  end to end on the author's machine; every number the lessons quote (accuracy, parameters,
  shapes) comes from a run of that script, stating epochs, seed and hardware.
- Runnable exercises practise the pieces in NumPy (a convolution, softmax and cross-entropy,
  a backprop step, attention with a causal mask, BPE merges, temperature sampling, the
  diffusion noise schedule…) and pass `scripts/check_exercises.py`, like any other.
- Delivered one tutorial at a time, each reviewed before the next: this spec's first
  delivery is the platform change plus **Visión**.

## Out of scope

- Running PyTorch in the browser (no Pyodide build; see ADR-0006).
- Downloading datasets or model weights from the app.
- Rewriting the subject lessons: tutorials link to them instead of repeating them.

## Acceptance criteria

- Given the home page, when it loads, then a section "Tutoriales" lists FastAPI and every
  deep learning tutorial delivered so far, each with lesson count and progress, and there is
  no "Expandir conocimientos" heading.
- Given a learner with FastAPI progress stored before this change, when they open the home
  page, then that progress is still shown (slug unchanged).
- Given a tutorial lesson with a "Del temario" box, when the content tests run, then every
  link resolves to an existing lesson of any section.
- Given the TFM lessons, when they render, then their "Del temario" boxes look and behave as
  before.
- Given any tutorial exercise, when `scripts/check_exercises.py <slug>` runs, then its solution
  passes its check.
- Given `scripts/tutorials/vision.py`, when the author runs it with the TFM's environment,
  then it trains and evaluates every model the Visión lessons describe and prints the
  numbers they quote.

## Open questions

None (framework, chapters, placement and order confirmed by the author on 2026-11-09).
