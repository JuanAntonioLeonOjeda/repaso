/**
 * The simulations are only useful if their maths is right. These tests pin each algorithm
 * to hand-computed values, most of them taken from the course slides.
 */
import { describe, expect, it } from "vitest";

import { discountedReturns } from "./rl/ReturnsSim";
import { clippedObjective } from "./rl/PpoClipSim";
import { createQ, envStep, greedy, runEpisode, startState } from "./rl/gridworld";
import { createRng } from "./kit";
import { agglomerative, assign, cutTree, dbscan, updateCentroids } from "./unsupervised/clustering";
import { emStep } from "./unsupervised/GmmEmSim";
import { pagerankStep } from "./unsupervised/PageRankSim";
import { principalAngle } from "./unsupervised/PcaSim";
import { accuracy, createMlp, makeDataset, trainStep } from "./deep/mlp";
import { iou, nms, type Box } from "./deep/IouNmsSim";
import { convolve } from "./deep/ConvolutionSim";
import { softmax } from "./deep/AttentionSim";
import { initState, optimizerStep } from "./deep/optimizers";
import { sortFrames, type SortName } from "./optimization/sorting";
import { knapsackTable } from "./optimization/KnapsackSim";
import { queensFrames } from "./optimization/NQueensSim";
import { orderCrossover, tourLength, twoOptNeighbour } from "./optimization/tsp";
import { posterior } from "./reasoning/BayesSim";
import { combineCf } from "./reasoning/CertaintyFactorSim";
import { belief, combine, plausibility } from "./reasoning/dempster-shafer";
import { infer, SERVICE } from "./reasoning/fuzzy";
import { fitPolynomial, mse } from "./supervised/polyfit";
import { gini } from "./supervised/GiniSplitSim";
import { ols } from "./supervised/LinearRegressionSim";
import { confusion } from "./supervised/ThresholdSim";

describe("supervised", () => {
  it("OLS recovers an exact line", () => {
    const { w, b } = ols([1, 2, 3, 4], [3, 5, 7, 9]);
    expect(w).toBeCloseTo(2);
    expect(b).toBeCloseTo(1);
  });

  it("a cubic fits cubic data exactly", () => {
    const xs = [-1, -0.5, 0, 0.3, 0.7, 1];
    const ys = xs.map((x) => 1 - 2 * x + 0.5 * x ** 3);
    expect(mse(fitPolynomial(xs, ys, 3), xs, ys)).toBeLessThan(1e-8);
  });

  it("Gini of a 6/4 node is 0.48", () => {
    expect(gini([0, 0, 0, 0, 0, 0, 1, 1, 1, 1])).toBeCloseTo(0.48);
  });

  it("confusion counts and precision", () => {
    const c = confusion(
      [
        { score: 0.9, positive: true },
        { score: 0.8, positive: false },
        { score: 0.3, positive: true },
        { score: 0.1, positive: false },
      ],
      0.5,
    );
    expect([c.tp, c.fp, c.fn, c.tn]).toEqual([1, 1, 1, 1]);
    expect(c.precision).toBeCloseTo(0.5);
  });
});

describe("unsupervised", () => {
  it("one k-means iteration", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 10, y: 0 },
      { x: 10, y: 2 },
    ];
    const labels = assign(points, [
      { x: 1, y: 1 },
      { x: 9, y: 1 },
    ]);
    expect(labels).toEqual([0, 0, 1, 1]);
    expect(
      updateCentroids(points, labels, [
        { x: 1, y: 1 },
        { x: 9, y: 1 },
      ]),
    ).toEqual([
      { x: 0, y: 1 },
      { x: 10, y: 1 },
    ]);
  });

  it("DBSCAN separates two dense groups and marks the outlier as noise", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0.1, y: 0 },
      { x: 0, y: 0.1 },
      { x: 5, y: 5 },
      { x: 5.1, y: 5 },
      { x: 5, y: 5.1 },
      { x: 20, y: 20 },
    ];
    const { labels, roles } = dbscan(points, 0.3, 3);
    expect(new Set(labels.slice(0, 3)).size).toBe(1);
    expect(labels[0]).not.toBe(labels[3]);
    expect(labels[6]).toBe(-1);
    expect(roles[6]).toBe("noise");
  });

  it("cutting the dendrogram below the big gap gives the two groups", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 10, y: 0 },
      { x: 10, y: 1 },
    ];
    const merges = agglomerative(points, "single");
    expect(merges).toHaveLength(3);
    expect(cutTree(4, merges, 2)).toEqual([0, 0, 1, 1]);
    expect(new Set(cutTree(4, merges, 100)).size).toBe(1);
  });

  it("EM never decreases the log-likelihood", () => {
    const rng = createRng(1);
    const xs = Array.from({ length: 200 }, (_, i) => (i < 100 ? -2 : 2) + (rng() - 0.5));
    let comps = [
      { mu: -0.5, sigma: 1, pi: 0.5 },
      { mu: 0.5, sigma: 1, pi: 0.5 },
    ];
    let last = -Infinity;
    for (let i = 0; i < 10; i++) {
      const step = emStep(xs, comps);
      expect(step.logLik).toBeGreaterThanOrEqual(last - 1e-9);
      last = step.logLik;
      comps = step.comps;
    }
    expect(Math.min(...comps.map((c) => Math.abs(Math.abs(c.mu) - 2)))).toBeLessThan(0.2);
  });

  it("PCA finds the diagonal of perfectly correlated data", () => {
    expect(principalAngle([1, 2, 3, 4], [1, 2, 3, 4])).toBeCloseTo(Math.PI / 4);
  });

  it("PageRank stays a probability distribution", () => {
    let rank = [0.2, 0.2, 0.2, 0.2, 0.2];
    for (let i = 0; i < 50; i++) rank = pagerankStep(rank, 0.85);
    expect(rank.reduce((s, r) => s + r, 0)).toBeCloseTo(1);
  });
});

describe("deep learning", () => {
  it("a small MLP learns XOR", () => {
    const data = makeDataset("xor");
    const mask = [true, true, true, true];
    let net = createMlp(4, 1);
    for (let i = 0; i < 1500; i++) net = trainStep(net, data, 0.5, mask);
    expect(accuracy(net, data, mask)).toBeGreaterThan(0.9);
  });

  it("IoU and NMS", () => {
    const a: Box = { x: 0, y: 0, w: 10, h: 10, score: 0.9, object: 0 };
    const b: Box = { x: 5, y: 5, w: 10, h: 10, score: 0.8, object: 0 };
    expect(iou(a, b)).toBeCloseTo(25 / 175);
    expect(nms([a, { ...a, x: 1, score: 0.7 }, b], 0.5, 0)).toEqual([a, b]);
  });

  it("convolution output size and a vertical edge", () => {
    const img = Array.from({ length: 6 }, () => [0, 0, 0, 1, 1, 1]);
    const out = convolve(
      img,
      [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ],
      1,
      0,
    );
    expect(out).toHaveLength(4);
    expect(out[0]).toEqual([0, 4, 4, 0]);
    expect(convolve(img, [[1]], 2, 0)).toHaveLength(3);
  });

  it("softmax sums to one", () => {
    expect(softmax([1, 2, 3]).reduce((s, v) => s + v, 0)).toBeCloseTo(1);
  });

  it("Adam's first step moves by the learning rate", () => {
    const st = optimizerStep("adam", initState({ x: 0, y: 0 }), { x: -6, y: 0.001 }, 0.1);
    expect(st.p.x).toBeCloseTo(0.1);
    expect(st.p.y).toBeCloseTo(-0.1);
  });
});

describe("reinforcement learning", () => {
  it("discounted returns", () => {
    const G = discountedReturns([0, 0, 10], 0.9);
    [8.1, 9, 10].forEach((v, i) => {
      expect(G[i]).toBeCloseTo(v);
    });
  });

  it("PPO clips the ratio", () => {
    expect(clippedObjective(1.5, 1, 0.2)).toBeCloseTo(1.2);
    expect(clippedObjective(0.5, -1, 0.2)).toBeCloseTo(-0.8);
    expect(clippedObjective(1.1, 1, 0.2)).toBeCloseTo(1.1);
  });

  it("Q-learning reaches the goal greedily after training", () => {
    const rng = createRng(3);
    let q = createQ();
    for (let i = 0; i < 400; i++)
      q = runEpisode(q, { alpha: 0.5, gamma: 0.95, epsilon: 0.2 }, rng).q;
    let s = startState();
    let reward = 0;
    for (let t = 0; t < 30; t++) {
      const r = envStep(s, greedy(q[s] ?? []));
      reward = r.reward;
      s = r.next;
      if (r.done) break;
    }
    expect(reward).toBe(10);
  });
});

describe("optimisation", () => {
  it.each<SortName>(["bubble", "insertion", "selection", "merge", "quick"])("%s sorts", (name) => {
    const input = [5, 3, 9, 1, 7, 2, 8];
    expect(sortFrames(name, input).at(-1)?.array).toEqual([1, 2, 3, 5, 7, 8, 9]);
  });

  it("bubble sort worst case does n(n-1)/2 comparisons", () => {
    expect(sortFrames("bubble", [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]).at(-1)?.comparisons).toBe(45);
  });

  it("knapsack best value with capacity 7 is 46", () => {
    expect(knapsackTable(7).at(-1)?.[7]).toBe(46);
  });

  it("N-queens ends with a valid solution", () => {
    const last = queensFrames(6).at(-1);
    expect(last?.event).toBe("solution");
    const q = last?.queens ?? [];
    for (let a = 0; a < q.length; a++) {
      for (let b = a + 1; b < q.length; b++) {
        expect(q[a]).not.toBe(q[b]);
        expect(Math.abs((q[a] ?? 0) - (q[b] ?? 0))).not.toBe(b - a);
      }
    }
  });

  it("TSP operators keep permutations", () => {
    const rng = createRng(2);
    const tour = [0, 1, 2, 3, 4, 5, 6, 7];
    expect([...twoOptNeighbour(tour, rng)].sort()).toEqual(tour);
    expect([...orderCrossover(tour, [...tour].reverse(), rng)].sort()).toEqual(tour);
    expect(
      tourLength(
        [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 3, y: 4 },
        ],
        [0, 1, 2],
      ),
    ).toBeCloseTo(12);
  });
});

describe("approximate reasoning", () => {
  it("Bayes: the meningitis-style base-rate effect", () => {
    expect(posterior(0.01, 0.95, 0.9)).toBeCloseTo(0.0876, 3);
  });

  it("MYCIN combination (slides)", () => {
    expect(combineCf(0.8, 0.7)).toBeCloseTo(0.94);
    expect(combineCf(0.8, -0.4)).toBeCloseTo(0.6667, 3);
    expect(combineCf(-0.16, -0.24)).toBeCloseTo(-0.3616);
  });

  it("Dempster's rule reproduces Watson's case (slides)", () => {
    const B = 1;
    const J = 2;
    const S = 4;
    const m1 = new Map([
      [B, 0.1],
      [J, 0.2],
      [S, 0.1],
      [B | J, 0.1],
      [B | S, 0.1],
      [J | S, 0.3],
      [B | J | S, 0.1],
    ]);
    const m2 = new Map([
      [B, 0.2],
      [J, 0.1],
      [S, 0.05],
      [B | J, 0.05],
      [B | S, 0.3],
      [J | S, 0.1],
      [B | J | S, 0.2],
    ]);
    const { masses, conflict } = combine(m1, m2);
    expect(conflict).toBeCloseTo(0.245, 3);
    expect(masses.get(B)).toBeCloseTo(0.225, 3);
    expect(belief(m1, B | J)).toBeCloseTo(0.4);
    expect(plausibility(m1, B)).toBeCloseTo(1 - belief(m1, J | S));
  });

  it("fuzzy memberships and the tipping controller", () => {
    expect(SERVICE.bueno(6.5)).toBeCloseTo(0.5);
    expect(SERVICE.excelente(6.5)).toBeCloseTo(1 / 6);
    const low = infer(1, 1);
    const high = infer(9.5, 9.5);
    expect(low.centroid).toBeLessThan(8);
    expect(high.centroid).toBeGreaterThan(18);
    expect(infer(5, 5).sugeno).toBeCloseTo(13);
  });
});
