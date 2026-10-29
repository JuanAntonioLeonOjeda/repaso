/** Travelling salesman helpers shared by the simulated annealing and genetic algorithm demos. */
import { createRng, distance, range, type Point } from "@/features/simulations/kit";

export type Tour = number[];

export function makeCities(n: number, seed: number): Point[] {
  const rng = createRng(seed);
  return range(n).map(() => ({ x: 20 + rng() * 460, y: 20 + rng() * 300 }));
}

export function tourLength(cities: readonly Point[], tour: readonly number[]): number {
  return tour.reduce((s, c, i) => {
    const a = cities[c];
    const b = cities[tour[(i + 1) % tour.length] ?? 0];
    return a && b ? s + distance(a, b) : s;
  }, 0);
}

export function randomTour(n: number, rng: () => number): Tour {
  const t = range(n);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [t[i], t[j]] = [t[j] ?? 0, t[i] ?? 0];
  }
  return t;
}

/** 2-opt move: reverse the segment between i and j (removes one crossing). */
export function twoOptNeighbour(tour: readonly number[], rng: () => number): Tour {
  const n = tour.length;
  let i = Math.floor(rng() * n);
  let j = Math.floor(rng() * n);
  if (i > j) [i, j] = [j, i];
  if (i === j) return [...tour];
  return [...tour.slice(0, i), ...tour.slice(i, j + 1).reverse(), ...tour.slice(j + 1)];
}

/** Order crossover (OX): keep a slice of parent A, fill the rest in parent B's order. */
export function orderCrossover(
  a: readonly number[],
  b: readonly number[],
  rng: () => number,
): Tour {
  const n = a.length;
  let i = Math.floor(rng() * n);
  let j = Math.floor(rng() * n);
  if (i > j) [i, j] = [j, i];
  const slice = a.slice(i, j + 1);
  const taken = new Set(slice);
  const rest = b.filter((c) => !taken.has(c));
  return [...rest.slice(0, i), ...slice, ...rest.slice(i)];
}

export function swapMutation(tour: readonly number[], rng: () => number): Tour {
  const t = [...tour];
  const i = Math.floor(rng() * t.length);
  const j = Math.floor(rng() * t.length);
  [t[i], t[j]] = [t[j] ?? 0, t[i] ?? 0];
  return t;
}
