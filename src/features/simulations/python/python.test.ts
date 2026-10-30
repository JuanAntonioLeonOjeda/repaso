import { describe, expect, it } from "vitest";

import { broadcastShapes } from "./broadcasting";
import { histogram, kde, median, scottBandwidth } from "./histogram";
import { addSaturate, addWrap, blend, edges, makeScene, type GrayImage } from "./image";
import { fillMissing } from "./missing";
import { eagerEvents, lazyEvents } from "./pipeline";
import { reduceMatrix } from "./reductions";
import { SCENARIOS } from "./references";
import { sliceIndices } from "./slicing";
import { groupBy, merge, type Row } from "./tables";
import { bigrams, mostCommon, processTokens, stem, tokenize } from "./text";

// Expected values below were produced by running the same operations in Python 3.13,
// NumPy 2.4, pandas 3.0 and SciPy.

describe("Python slices", () => {
  const cases: [number | null, number | null, number, number[]][] = [
    [null, null, -1, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]],
    [2, 8, 2, [2, 4, 6]],
    [-3, null, 1, [7, 8, 9]],
    [8, 2, -2, [8, 6, 4]],
    [null, null, -3, [9, 6, 3, 0]],
    [-100, 100, 1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
    [5, null, -1, [5, 4, 3, 2, 1, 0]],
    [-1, -11, -1, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]],
  ];
  it.each(cases)("range(10)[%s:%s:%s]", (start, stop, step, expected) => {
    expect(sliceIndices(10, start, stop, step)).toEqual(expected);
  });
});

describe("NumPy", () => {
  it("broadcasts shapes aligned on the right", () => {
    expect(broadcastShapes([3, 1], [4])).toEqual({ ok: true, shape: [3, 4] });
    expect(broadcastShapes([2, 3], [3])).toEqual({ ok: true, shape: [2, 3] });
    expect(broadcastShapes([2, 3], [2])).toEqual({ ok: false, axis: 1, sizes: [3, 2] });
  });

  it("reduces along an axis", () => {
    const m = [
      [1, 5, 2],
      [4, 0, 6],
    ];
    expect(reduceMatrix(m, "sum", 0)).toEqual([5, 5, 8]);
    expect(reduceMatrix(m, "sum", 1)).toEqual([8, 10]);
    expect(reduceMatrix(m, "argmax", "none")).toEqual([5]);
    expect(reduceMatrix(m, "argmax", 0)).toEqual([1, 0, 1]);
  });
});

describe("pandas", () => {
  it("fills gaps like pandas", () => {
    const s = [null, 2, null, null, 8, null];
    expect(fillMissing(s, "interpolate")).toEqual([null, 2, 4, 6, 8, 8]);
    expect(fillMissing(s, "ffill")).toEqual([null, 2, 2, 2, 8, 8]);
    expect(fillMissing(s, "bfill")).toEqual([2, 2, 8, 8, 8, null]);
    expect(fillMissing(s, "fillna-mean")).toEqual([5, 2, 5, 5, 8, 5]);
    expect(fillMissing(s, "dropna")).toEqual([2, 8]);
  });

  const left: Row[] = [
    { k: "b", x: 1 },
    { k: "a", x: 2 },
    { k: "c", x: 3 },
    { k: "a", x: 4 },
  ];
  const right: Row[] = [
    { k: "a", y: 10 },
    { k: "d", y: 20 },
    { k: "a", y: 30 },
    { k: "b", y: 40 },
  ];
  const flat = (how: "inner" | "left" | "right" | "outer"): (string | number | null)[][] =>
    merge(left, right, "k", how).map((m) => [
      (m.left ?? m.right)?.k ?? null,
      m.left?.x ?? null,
      m.right?.y ?? null,
    ]);

  it("merges with pandas' row order and multiplicity", () => {
    expect(flat("inner")).toEqual([
      ["b", 1, 40],
      ["a", 2, 10],
      ["a", 2, 30],
      ["a", 4, 10],
      ["a", 4, 30],
    ]);
    expect(flat("left")).toHaveLength(6);
    expect(flat("left")[3]).toEqual(["c", 3, null]);
    expect(flat("right")).toEqual([
      ["a", 2, 10],
      ["a", 4, 10],
      ["d", null, 20],
      ["a", 2, 30],
      ["a", 4, 30],
      ["b", 1, 40],
    ]);
    expect(flat("outer").map((r) => r[0])).toEqual(["a", "a", "a", "a", "b", "c", "d"]);
  });

  it("groups, sorts keys and skips NaN", () => {
    const rows: Row[] = [
      { g: "y", v: 3 },
      { g: "x", v: 1 },
      { g: "y", v: null },
      { g: null, v: 9 },
      { g: "x", v: 5 },
    ];
    expect(groupBy(rows, "g", "v", "mean").map((g) => [g.key, g.value])).toEqual([
      ["x", 3],
      ["y", 3],
    ]);
    expect(groupBy(rows, "g", "v", "count").map((g) => g.value)).toEqual([2, 1]);
  });
});

describe("histogram and KDE", () => {
  const d = [1, 2, 2, 3, 7, 8, 9, 10];
  it("bins like np.histogram", () => {
    expect(histogram(d, 3).map((b) => b.count)).toEqual([4, 0, 4]);
    expect(histogram(d, 3).at(-1)?.to).toBe(10);
  });
  it("matches scipy's gaussian_kde", () => {
    expect(scottBandwidth(d)).toBeCloseTo(2.3853, 4);
    expect(kde(d, 5, scottBandwidth(d))).toBeCloseTo(0.070431, 5);
    expect(median(d)).toBe(5);
  });
});

describe("generators", () => {
  it("lazy pipeline stops early and holds one value", () => {
    const lazy = lazyEvents(100, 3);
    expect(lazy.filter((e) => e.stage === "take").map((e) => e.value)).toEqual([4, 16, 36]);
    expect(lazy.filter((e) => e.stage === "source")).toHaveLength(6);
    expect(Math.max(...lazy.map((e) => e.inMemory))).toBe(1);
  });
  it("eager pipeline does all the work and stores every stage", () => {
    const eager = eagerEvents(100, 3);
    expect(eager.filter((e) => e.stage === "source")).toHaveLength(100);
    expect(eager.filter((e) => e.stage === "take").map((e) => e.value)).toEqual([4, 16, 36]);
    expect(eager.at(-1)?.inMemory).toBe(100 + 50 + 50 + 3);
  });
});

describe("text", () => {
  it("tokenizes, filters and counts", () => {
    expect(tokenize("¡Muy buen café, el café!")).toEqual(["muy", "buen", "café", "el", "café"]);
    const tokens = processTokens("El café y el té. El café.", {
      removeStopwords: true,
      stemming: false,
    });
    expect(tokens).toEqual(["café", "té", "café"]);
    expect(mostCommon(tokens, 1)).toEqual([["café", 2]]);
    expect(bigrams(["a", "b", "c"])).toEqual(["a b", "b c"]);
  });
  it("stems only when a stem of three letters remains", () => {
    expect(stem("cafeterías")).toBe("cafeterí");
    expect(stem("rápidamente")).toBe("rápid");
    expect(stem("sol")).toBe("sol");
  });
});

describe("images", () => {
  const img: GrayImage = { width: 2, height: 1, pixels: [200, 10] };
  it("wraps in uint8 arithmetic and saturates in OpenCV", () => {
    expect(addWrap(img, 100).pixels).toEqual([44, 110]);
    expect(addSaturate(img, 100).pixels).toEqual([255, 110]);
    expect(addSaturate(img, -50).pixels).toEqual([150, 0]);
  });
  it("blends with weights", () => {
    expect(blend(img, { ...img, pixels: [0, 110] }, 0.25).pixels).toEqual([50, 85]);
  });
  it("loses negative slopes when Sobel goes straight to uint8", () => {
    const scene = makeScene(32);
    const uint8 = edges(scene, "uint8").pixels.filter((v) => v > 0).length;
    const abs = edges(scene, "float-abs").pixels.filter((v) => v > 0).length;
    expect(abs).toBeGreaterThan(uint8);
  });
});

describe("reference traces", () => {
  it("every name and reference points to an object that exists", () => {
    for (const scenario of SCENARIOS) {
      for (const frame of scenario.frames) {
        const ids = new Set(frame.objects.map((o) => o.id));
        for (const target of Object.values(frame.names)) expect(ids).toContain(target);
        for (const o of frame.objects) for (const r of o.refs ?? []) expect(ids).toContain(r);
        expect(frame.line).toBeLessThan(scenario.code.length);
      }
    }
  });
});
