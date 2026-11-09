import { createRng, gaussian } from "@/features/simulations/kit";

/** Number of diffusion steps, as in DDPM and in scripts/tutorials/generativa.py. */
export const STEPS = 1000;

/**
 * ᾱ_t of DDPM's linear schedule: β grows linearly from 1e-4 to 0.02 and ᾱ_t = Π (1 − β_s)
 * for s = 0…t. `alphaBarLinear()[t]` is the share of the original signal's variance left at t.
 * Index 0 is ᾱ after the first step. Needs steps ≥ 2.
 */
export function alphaBarLinear(steps = STEPS, betaStart = 1e-4, betaEnd = 0.02): number[] {
  const out: number[] = [];
  let product = 1;
  for (let t = 0; t < steps; t++) {
    const beta = betaStart + ((betaEnd - betaStart) * t) / (steps - 1);
    product *= 1 - beta;
    out.push(product);
  }
  return out;
}

/**
 * ᾱ_t of the cosine schedule (Nichol & Dhariwal, 2021): destroys the signal more evenly.
 * Same indexing as the linear one (index 0 = after the first step). The paper clips β_t at
 * 0,999 for sampling; a visualisation does not need it, so ᾱ simply reaches ~0 at the end.
 */
export function alphaBarCosine(steps = STEPS, s = 0.008): number[] {
  const f = (t: number): number => Math.cos(((t / steps + s) / (1 + s)) * (Math.PI / 2)) ** 2;
  const f0 = f(0);
  return Array.from({ length: steps }, (_, t) => f(t + 1) / f0);
}

/** x_t = √ᾱ_t · x_0 + √(1 − ᾱ_t) · ε: any step of the forward process in a single jump. */
export function noisy(x0: readonly number[], eps: readonly number[], alphaBar: number): number[] {
  const a = Math.sqrt(alphaBar);
  const b = Math.sqrt(1 - alphaBar);
  return x0.map((v, i) => a * v + b * (eps[i] ?? 0));
}

/** One fixed noise image (seeded), so moving t changes only how much of it is mixed in. */
export function noiseImage(size: number, seed = 7): number[] {
  const rng = createRng(seed);
  return Array.from({ length: size * size }, () => gaussian(rng));
}

/** A 28×28 handwritten-looking "7" in [−1, 1] (background −1), drawn as two thick strokes. */
export function sevenGlyph(size = 28): number[] {
  const strokes: [number, number, number, number][] = [
    [7, 7, 21, 7], // top bar
    [21, 7, 12, 23], // diagonal
  ];
  const distToSegment = (
    px: number,
    py: number,
    [x1, y1, x2, y2]: (typeof strokes)[number],
  ): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };
  const out: number[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.min(...strokes.map((s) => distToSegment(x, y, s)));
      // Ink fades out between 1.2 and 2.4 px from the stroke: a soft pen, like MNIST.
      const ink = Math.max(0, Math.min(1, (2.4 - d) / 1.2));
      out.push(ink * 2 - 1);
    }
  }
  return out;
}

/** [−1, 1] → 0–255, clipped, for drawing. */
export function toGray(values: readonly number[]): number[] {
  return values.map((v) => Math.round(Math.max(0, Math.min(1, (v + 1) / 2)) * 255));
}
