# ADR-0004: TFM patient-derived images stay on this machine

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The TFM section shows real radiographs of the LUMOS dataset, activation maps of LumosNet and
Grad-CAM heatmaps. All of them are derived from patients' medical images (health data), and the
repository is on GitHub (private). The author chose to keep these images local.

## Options considered

### Option A — Generate them locally into a git- and docker-ignored folder, mounted as a volume

- Pros: nothing patient-derived is committed or baked into the image; the section works fully
  on this machine; regenerating is one command.
- Cons: on a fresh clone the section shows notices until the export is run (needs the TFM
  project and its environment).

### Option B — Commit a few sample images

- Pros: the section works anywhere.
- Cons: health data in a remote repository, even if private; hard to undo once pushed.

### Option C — No patient images (synthetic only)

- Pros: no privacy risk at all.
- Cons: loses the most valuable part (what the real model sees).

## Decision

Option A. `scripts/tfm/export_assets.py` runs with the TFM's own environment, reads only from the
TFM project and writes to `public/tfm-local/` (ignored by git, Docker and Prettier). The compose
file mounts it read-only into nginx. Components read `manifest.json` and show a notice when it
is missing. Aggregate metrics (no patient-level data) are committed in
`src/content/tfm/metrics.ts`.

## Consequences

- The Docker image contains no patient-derived files (checked on 2026-10-30).
- Simulations that do not need real images use synthetic data (e.g. CLAHE on a synthetic spine).
- Revisit if the platform is ever shared: then Option C, or images with explicit authorisation.
