/** Small numeric helpers shared by the simulations. Pure and deterministic. */

export interface Point {
  x: number;
  y: number;
}

/** Seeded PRNG (mulberry32): the same seed always draws the same dataset. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box–Muller). */
export function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function linearScale(
  [d0, d1]: readonly [number, number],
  [r0, r1]: readonly [number, number],
): (value: number) => number {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (value) => r0 + (value - d0) * k;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
}

export function std(values: readonly number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** Blobs of 2D points around centres, for clustering and classification demos. */
export function makeBlobs(
  rng: () => number,
  centres: readonly Point[],
  perCluster: number,
  spread: number,
): (Point & { label: number })[] {
  return centres.flatMap((c, label) =>
    range(perCluster).map(() => ({
      x: c.x + gaussian(rng) * spread,
      y: c.y + gaussian(rng) * spread,
      label,
    })),
  );
}

export function format(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

/** Categorical colours from the design tokens, for clusters, classes and series. */
export const PLOT_COLOURS = [
  "var(--plot-1)",
  "var(--plot-2)",
  "var(--plot-3)",
  "var(--plot-4)",
  "var(--plot-5)",
  "var(--plot-6)",
  "var(--plot-7)",
  "var(--plot-8)",
] as const;

export function plotColour(i: number): string {
  if (i < 0) return "var(--plot-noise)";
  return PLOT_COLOURS[i % PLOT_COLOURS.length] ?? "var(--plot-1)";
}
