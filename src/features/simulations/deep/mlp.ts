/**
 * A tiny multilayer perceptron (2 inputs → H tanh units → 1 sigmoid output) trained with
 * full-batch gradient descent on binary cross-entropy. Written out by hand so the
 * forward and backward passes can be read next to the lesson's equations.
 */
import { createRng, gaussian, range, sigmoid, type Point } from "@/features/simulations/kit";

export interface Mlp {
  /** w1[h] = [weight from x1, weight from x2] */
  w1: [number, number][];
  b1: number[];
  w2: number[];
  b2: number;
}

export type Sample = Point & { label: 0 | 1 };

export function createMlp(hidden: number, seed: number): Mlp {
  const rng = createRng(seed);
  // Xavier-like scale keeps tanh out of saturation at the start.
  return {
    w1: range(hidden).map(() => [gaussian(rng) * 0.9, gaussian(rng) * 0.9]),
    b1: range(hidden).map(() => gaussian(rng) * 0.1),
    w2: range(hidden).map(() => gaussian(rng) * 0.9),
    b2: 0,
  };
}

export function forward(
  net: Mlp,
  p: Point,
  mask: readonly boolean[],
): { h: number[]; out: number } {
  const h = net.w1.map((w, j) =>
    mask[j] === false ? 0 : Math.tanh(w[0] * p.x + w[1] * p.y + (net.b1[j] ?? 0)),
  );
  const z = h.reduce((s, hj, j) => s + hj * (net.w2[j] ?? 0), net.b2);
  return { h, out: sigmoid(z) };
}

export function loss(net: Mlp, data: readonly Sample[], mask: readonly boolean[]): number {
  return (
    -data.reduce((s, d) => {
      const p = Math.min(1 - 1e-9, Math.max(1e-9, forward(net, d, mask).out));
      return s + (d.label ? Math.log(p) : Math.log(1 - p));
    }, 0) / data.length
  );
}

export function accuracy(net: Mlp, data: readonly Sample[], mask: readonly boolean[]): number {
  return (
    data.filter((d) => (forward(net, d, mask).out >= 0.5 ? 1 : 0) === d.label).length / data.length
  );
}

/** One gradient-descent step over the whole dataset. Masked neurons neither fire nor learn. */
export function trainStep(
  net: Mlp,
  data: readonly Sample[],
  lr: number,
  mask: readonly boolean[],
): Mlp {
  const H = net.w2.length;
  const gw1 = range(H).map(() => [0, 0] as [number, number]);
  const gb1 = new Array<number>(H).fill(0);
  const gw2 = new Array<number>(H).fill(0);
  let gb2 = 0;
  for (const d of data) {
    const { h, out } = forward(net, d, mask);
    // dL/dz for sigmoid + cross-entropy simplifies to (prediction − label)
    const dz = out - d.label;
    gb2 += dz;
    for (let j = 0; j < H; j++) {
      if (mask[j] === false) continue;
      const hj = h[j] ?? 0;
      gw2[j] = (gw2[j] ?? 0) + dz * hj;
      // chain rule through w2 and tanh'(a) = 1 − tanh(a)²
      const da = dz * (net.w2[j] ?? 0) * (1 - hj * hj);
      const g = gw1[j];
      if (g) {
        g[0] += da * d.x;
        g[1] += da * d.y;
      }
      gb1[j] = (gb1[j] ?? 0) + da;
    }
  }
  const n = data.length;
  return {
    w1: net.w1.map((w, j) => [
      w[0] - (lr * (gw1[j]?.[0] ?? 0)) / n,
      w[1] - (lr * (gw1[j]?.[1] ?? 0)) / n,
    ]),
    b1: net.b1.map((b, j) => b - (lr * (gb1[j] ?? 0)) / n),
    w2: net.w2.map((w, j) => w - (lr * (gw2[j] ?? 0)) / n),
    b2: net.b2 - (lr * gb2) / n,
  };
}

export type DatasetName = "linear" | "xor" | "circle" | "spiral";

export function makeDataset(name: DatasetName, seed = 3): Sample[] {
  const rng = createRng(seed);
  const jitter = (): number => gaussian(rng) * 0.12;
  switch (name) {
    case "linear":
      return range(120).map(() => {
        const x = rng() * 4 - 2;
        const y = rng() * 4 - 2;
        return { x, y, label: x + y + jitter() * 3 > 0 ? 1 : 0 };
      });
    case "xor":
      return range(140).map(() => {
        const x = rng() * 4 - 2;
        const y = rng() * 4 - 2;
        return { x: x + jitter(), y: y + jitter(), label: x * y > 0 ? 1 : 0 };
      });
    case "circle":
      return range(160).map(() => {
        const x = rng() * 4 - 2;
        const y = rng() * 4 - 2;
        return { x, y, label: Math.hypot(x, y) + jitter() < 1.15 ? 1 : 0 };
      });
    case "spiral":
      return range(160).map((i) => {
        const label = (i % 2) as 0 | 1;
        const t = (Math.floor(i / 2) / 80) * 3.2 * Math.PI;
        const r = 0.25 + (t / (3.2 * Math.PI)) * 1.6;
        const a = t + label * Math.PI;
        return { x: r * Math.cos(a) + jitter() * 0.5, y: r * Math.sin(a) + jitter() * 0.5, label };
      });
    default: {
      const unreachable: never = name;
      return unreachable;
    }
  }
}
