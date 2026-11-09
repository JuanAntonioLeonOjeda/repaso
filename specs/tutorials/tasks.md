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
- [ ] IA generativa de imágenes
- [ ] Crea tu LLM

## Close

- [x] README (section, badges if a dependency is added), AGENTS.md, project policies
