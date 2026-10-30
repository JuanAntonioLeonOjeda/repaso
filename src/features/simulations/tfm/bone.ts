/**
 * Numbers behind the TFM simulations. The BMD ↔ T-score line was fitted on the LUMOS
 * metadata (T = (BMD − 1.114) / 0.120), and the WHO thresholds (−1, −2.5) then fall at
 * BMD 0.994 and 0.814: exactly where LUMOS's classes change.
 */

export const YOUNG_ADULT_MEAN = 1.114;
export const YOUNG_ADULT_SD = 0.12;
export const CLASS_NAMES = ["Sano", "Osteopenia", "Osteoporosis"] as const;

export function tScore(bmd: number): number {
  return (bmd - YOUNG_ADULT_MEAN) / YOUNG_ADULT_SD;
}

export function bmdFromT(t: number): number {
  return YOUNG_ADULT_MEAN + t * YOUNG_ADULT_SD;
}

/** WHO classification: T ≥ −1 healthy, −2.5 < T < −1 osteopenia, T ≤ −2.5 osteoporosis. */
export function classFromT(t: number): 0 | 1 | 2 {
  if (t >= -1) return 0;
  if (t > -2.5) return 1;
  return 2;
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26 approximation, error < 1.5e-7). */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/**
 * If the regression head predicts BMD with Gaussian error of std `sigma`, the probability
 * that thresholding that prediction gives each class, for a patient whose real BMD is `bmd`.
 */
export function classProbabilitiesFromRegression(
  bmd: number,
  sigma: number,
): [number, number, number] {
  const lowCut = bmdFromT(-2.5);
  const highCut = bmdFromT(-1);
  const pOsteoporosis = normalCdf((lowCut - bmd) / sigma);
  const pHealthy = 1 - normalCdf((highCut - bmd) / sigma);
  return [pHealthy, Math.max(0, 1 - pHealthy - pOsteoporosis), pOsteoporosis];
}

/** Class weights as in the TFM's training/train.py (none, inverse frequency, effective number). */
export function classWeights(
  counts: readonly number[],
  scheme: "inverse" | "effective",
  beta = 0.999,
): number[] {
  const k = counts.length;
  if (scheme === "inverse") {
    const total = counts.reduce((s, c) => s + c, 0);
    return counts.map((c) => total / (k * c));
  }
  // Cui et al. 2019: effective number of samples E_n = (1 − β^n) / (1 − β)
  const raw = counts.map((c) => (1 - beta) / (1 - beta ** c));
  const sum = raw.reduce((s, w) => s + w, 0);
  return raw.map((w) => (w / sum) * k);
}
