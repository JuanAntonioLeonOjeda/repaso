# Tasks

## Platform

- [x] Branch `feature/tutorials` from `develop`
- [x] Catalog: `extras` → `tutorials`; home section "Tutoriales"; i18n; tests
- [x] Move `Temario` to `features/lesson`, resolving links against every section
- [x] `vision` slug, colour tokens (light/dark, AA) and icon
- [x] ADR-0006 (Proposed): framework code verified offline, NumPy exercises in the browser

## Visión

- [x] `scripts/tutorials/vision.py`: the tutorial's code end to end, run and numbers recorded
- [x] Lessons with exercises, each passing the checker
- [x] `TrainingCurvesSim` with the run's real curves (`vision_curves.py` → `vision-runs.ts`)
- [x] Review (content, ts, a11y for the home change), checks, Docker rebuild

## Next deliveries (each its own review)

- [x] Texto: star rating of Spanish Amazon reviews (MARC es), 8 lessons, `scripts/tutorials/texto.py`
      with its own pinned environment (`scripts/tutorials/requirements.txt`: the TFM's lacks
      `transformers`); BETO fine-tuned on a 40.000-review subset (the train file is sorted by label:
      shuffled with a seed before subsetting)
- [x] IA generativa de imágenes: MNIST (AE, VAE, DCGAN, class-conditional DDPM with CFG, FID on a
      classifier's features) and SD-Turbo with diffusers (Stability AI Community License accepted by
      the author); `DiffusionNoiseSim`
- [x] Crea tu LLM: byte-level BPE (2.048) and a 6-block GPT (11,5 M) trained on Don Quijote, sampling,
      LoRA by hand to adapt it to Lazarillo de Tormes, base vs instruct with Qwen2.5-0.5B (Apache 2.0);
      `SamplingSim` on the GPT's real next-token distribution

## Close

- [x] README (section, badges if a dependency is added), AGENTS.md, project policies
