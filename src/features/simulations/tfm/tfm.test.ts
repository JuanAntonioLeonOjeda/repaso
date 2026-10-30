import { describe, expect, it } from "vitest";

import {
  bmdFromT,
  classFromT,
  classProbabilitiesFromRegression,
  classWeights,
  tScore,
} from "./bone";
import { clahe, equalizeMapping } from "./clahe";
import { schedule } from "./LrScheduleSim";
import { simulateAggregation } from "./PatientAggregationSim";

describe("T-score in LUMOS", () => {
  it("puts the WHO thresholds where the dataset's classes change", () => {
    expect(bmdFromT(-1)).toBeCloseTo(0.994);
    expect(bmdFromT(-2.5)).toBeCloseTo(0.814);
    expect(classFromT(tScore(1.2))).toBe(0);
    expect(classFromT(tScore(0.9))).toBe(1);
    expect(classFromT(tScore(0.7))).toBe(2);
  });

  it("regression error spreads predictions over the classes", () => {
    const p = classProbabilitiesFromRegression(0.904, 0.13); // centre of the osteopenia band
    expect(p.reduce((s, v) => s + v, 0)).toBeCloseTo(1);
    expect(p[1]).toBeLessThan(0.55); // the band is narrow compared with the error
    expect(classProbabilitiesFromRegression(0.904, 0.01)[1]).toBeGreaterThan(0.99);
  });
});

describe("class weights (training/train.py)", () => {
  const counts = [406, 411, 314];

  it("inverse weights", () => {
    expect(classWeights(counts, "inverse")[2]).toBeCloseTo(1131 / (3 * 314));
  });

  it("effective-number weights average 1 and are softer than inverse", () => {
    const w = classWeights(counts, "effective", 0.999);
    const inv = classWeights(counts, "inverse");
    expect(w.reduce((s, v) => s + v, 0) / 3).toBeCloseTo(1);
    expect((w[2] ?? 0) / (w[1] ?? 1)).toBeLessThan((inv[2] ?? 0) / (inv[1] ?? 1));
  });
});

describe("CLAHE", () => {
  it("without clipping, equalisation maps the cumulative histogram to [0, 255]", () => {
    const hist = new Array<number>(256).fill(0);
    hist[10] = 50;
    hist[200] = 50;
    const map = equalizeMapping(hist, 0, 100);
    expect(map[10]).toBe(128);
    expect(map[200]).toBe(255);
  });

  it("raises the contrast of a low-contrast image and keeps its size", () => {
    const size = 32;
    const src = new Uint8Array(size * size).map((_, i) => 100 + ((i % size) % 8));
    const out = clahe(src, size, size, 2, 4);
    expect(out).toHaveLength(src.length);
    const range = (a: Uint8Array): number => Math.max(...a) - Math.min(...a);
    expect(range(out)).toBeGreaterThan(range(src));
  });
});

describe("TFM training and evaluation", () => {
  it("phased strategy freezes the backbone, then fine-tunes everything at 1e-4", () => {
    expect(schedule("phased", 3, 8)).toEqual({ backbone: 0, heads: 1e-3 });
    expect(schedule("phased", 9, 8)).toEqual({ backbone: 1e-4, heads: 1e-4 });
    expect(schedule("differential", 1, 8)).toEqual({ backbone: 1e-4, heads: 1e-3 });
  });

  it("averaging two views helps when their errors are independent", () => {
    const r = simulateAggregation(1.5, 0, 3);
    expect(r.patient).toBeGreaterThan(r.image);
  });
});
