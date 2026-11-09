import { describe, expect, it } from "vitest";

import {
  alphaBarCosine,
  alphaBarLinear,
  noiseImage,
  noisy,
  sevenGlyph,
  STEPS,
  toGray,
} from "./diffusion";

describe("diffusion forward process", () => {
  const linear = alphaBarLinear();

  it("matches the ᾱ_t that PyTorch computed in scripts/tutorials/generativa.py", () => {
    // results.json → diffusion.alpha_bar (torch.cumprod of 1 − β, β linear 1e-4 → 0.02)
    const fromRun: [number, number][] = [
      [0, 0.9999],
      [50, 0.96995],
      [100, 0.89514],
      [250, 0.52142],
      [500, 0.0778],
      [750, 0.0033],
      [999, 4e-5],
    ];
    for (const [t, value] of fromRun) {
      expect(linear[t]).toBeCloseTo(value, 4);
    }
    expect(linear).toHaveLength(STEPS);
  });

  it("the cosine schedule matches Nichol & Dhariwal's formula, step by step", () => {
    // f(t) = cos²(((t/T + 0,008) / 1,008) · π/2); index t holds f(t + 1) / f(0) (computed by hand in Python)
    const cosine = alphaBarCosine();
    expect(cosine[0]).toBeCloseTo(0.9999587, 6);
    expect(cosine[0]).toBeLessThan(1);
    expect(cosine[249]).toBeCloseTo(0.8470122, 6);
    expect(cosine[499]).toBeCloseTo(0.4938436, 6);
    expect(cosine[749]).toBeCloseTo(0.1442721, 6);
  });

  it("matches the small tail values with a relative tolerance", () => {
    expect((linear[750] ?? 0) / 0.0033001584).toBeCloseTo(1, 5);
    expect((linear[999] ?? 0) / 4.0358298e-5).toBeCloseTo(1, 5);
  });

  it("the cosine schedule also goes from ~1 to ~0, but keeps more signal halfway", () => {
    const cosine = alphaBarCosine();
    expect(cosine[0]).toBeGreaterThan(0.999);
    expect(cosine[STEPS - 1]).toBeLessThan(1e-3);
    expect(cosine[499]).toBeGreaterThan(linear[499] ?? 1);
    for (let t = 1; t < STEPS; t++) expect(cosine[t]).toBeLessThanOrEqual(cosine[t - 1] ?? 1);
  });

  it("mixes image and noise with weights √ᾱ and √(1 − ᾱ)", () => {
    expect(noisy([1, -1], [0.5, 0.5], 1)).toEqual([1, -1]);
    expect(noisy([1, -1], [0.5, 0.5], 0)).toEqual([0.5, 0.5]);
    const [a] = noisy([1], [0], 0.25);
    expect(a).toBeCloseTo(0.5);
    const [b] = noisy([1], [2], 0.64);
    expect(b).toBeCloseTo(0.8 * 1 + 0.6 * 2); // √0,64 · 1 + √0,36 · 2
  });

  it("draws a 28×28 glyph in [−1, 1] and seeded noise", () => {
    const glyph = sevenGlyph();
    expect(glyph).toHaveLength(784);
    expect(Math.min(...glyph)).toBe(-1);
    expect(Math.max(...glyph)).toBe(1);
    // The top bar of the 7 is ink, the corner is background.
    expect(glyph[7 * 28 + 14]).toBe(1);
    expect(glyph[0]).toBe(-1);
    const ink = glyph.filter((v) => v > 0).length / glyph.length;
    expect(ink).toBeGreaterThan(0.05);
    expect(ink).toBeLessThan(0.3);
    const noise = noiseImage(28);
    expect(noise).toEqual(noiseImage(28));
    expect(noise).not.toEqual(noiseImage(28, 8));
    const mean = noise.reduce((a, b) => a + b, 0) / noise.length;
    const variance = noise.reduce((a, b) => a + (b - mean) ** 2, 0) / noise.length;
    expect(Math.abs(mean)).toBeLessThan(0.1);
    expect(variance).toBeGreaterThan(0.85);
    expect(variance).toBeLessThan(1.15);
    expect(toGray([-3, -1, 0, 1, 3])).toEqual([0, 0, 128, 255, 255]);
  });
});
