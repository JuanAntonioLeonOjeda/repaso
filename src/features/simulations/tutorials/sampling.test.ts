import { describe, expect, it } from "vitest";

import { nextToken } from "./llm-next-token";
import { entropyBits, filtered, keptTokens, softmaxWithTemperature } from "./sampling";

describe("sampling from a next-token distribution", () => {
  const logits = [2, 1, 0, -1];

  it("softmax with temperature 1 matches the hand-computed values", () => {
    // e^2, e^1, e^0, e^-1 over their sum (11,4752)
    const p = softmaxWithTemperature(logits, 1);
    expect(p[0]).toBeCloseTo(0.6439, 4);
    expect(p[3]).toBeCloseTo(0.0321, 4);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it("low temperature sharpens, high temperature flattens", () => {
    expect(softmaxWithTemperature(logits, 0.1)[0]).toBeGreaterThan(0.9999);
    const hot = softmaxWithTemperature(logits, 100);
    expect(Math.max(...hot) - Math.min(...hot)).toBeLessThan(0.01);
    expect(entropyBits(hot)).toBeCloseTo(2, 2); // four tokens, almost uniform: 2 bits
  });

  it("top-k keeps the k most likely tokens", () => {
    const p = [0.1, 0.5, 0.15, 0.25];
    expect(keptTokens(p, 2, 1)).toEqual([false, true, false, true]);
  });

  it("top-p keeps a token while the probability accumulated before it is at most p", () => {
    const p = [0.1, 0.5, 0.15, 0.25];
    // before 0,25 the mass is 0,5 ≤ 0,7: kept; before 0,15 it is 0,75 > 0,7: out
    expect(keptTokens(p, 10, 0.7)).toEqual([false, true, false, true]);
    expect(keptTokens(p, 10, 0.3)).toEqual([false, true, false, false]);
    expect(keptTokens(p, 10, 1)).toEqual([true, true, true, true]);
  });

  it("at the boundary the rule keeps one more token (dyadic values: no rounding)", () => {
    // before the second token the mass is exactly 0,5 ≤ 0,5: kept, as in llm.py
    expect(keptTokens([0.5, 0.25, 0.125, 0.125], 10, 0.5)).toEqual([true, true, false, false]);
  });

  it("applies top-p to the top-k survivors renormalised, as generate() does", () => {
    // top-k 2 leaves [0,3; 0,3] → renormalised [0,5; 0,5]; before the second the mass is 0,5 > 0,4
    expect(keptTokens([0.3, 0.3, 0.2, 0.2], 2, 0.4)).toEqual([true, false, false, false]);
  });

  it("is stable with large logits and measures entropy in bits", () => {
    const p = softmaxWithTemperature([1000, 999], 1);
    expect(p[0]).toBeCloseTo(1 / (1 + Math.exp(-1)), 10);
    expect(entropyBits([1, 0, 0])).toBe(0);
    expect(entropyBits([0.5, 0.5])).toBe(1);
  });

  it("renormalises over the surviving tokens", () => {
    const f = filtered([0.1, 0.5, 0.15, 0.25], [false, true, false, true]);
    expect(f[1]).toBeCloseTo(2 / 3);
    expect(f[0]).toBe(0);
    expect(filtered([0.5, 0.5], [false, false])).toEqual([0, 0]);
  });

  it("the data comes from the tutorial's GPT: 30 tokens sorted by logit", () => {
    expect(nextToken.tokens).toHaveLength(30);
    expect(nextToken.logits).toHaveLength(30);
    for (let i = 1; i < 30; i++) {
      expect(nextToken.logits[i]).toBeLessThanOrEqual(nextToken.logits[i - 1] ?? Infinity);
    }
  });
});
