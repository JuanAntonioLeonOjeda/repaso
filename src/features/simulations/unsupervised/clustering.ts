/** Clustering algorithms used by the simulations: small, readable, deterministic. */
import { distance, type Point } from "@/features/simulations/kit";

// ---------- K-means ----------

export function assign(points: readonly Point[], centroids: readonly Point[]): number[] {
  return points.map((p) => {
    let best = 0;
    let bestD = Infinity;
    centroids.forEach((c, i) => {
      const d = distance(p, c);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  });
}

export function updateCentroids(
  points: readonly Point[],
  labels: readonly number[],
  centroids: readonly Point[],
): Point[] {
  return centroids.map((c, k) => {
    const members = points.filter((_, i) => labels[i] === k);
    if (members.length === 0) return c; // an empty cluster keeps its centroid
    return {
      x: members.reduce((s, p) => s + p.x, 0) / members.length,
      y: members.reduce((s, p) => s + p.y, 0) / members.length,
    };
  });
}

export function inertia(
  points: readonly Point[],
  labels: readonly number[],
  centroids: readonly Point[],
): number {
  return points.reduce((s, p, i) => {
    const c = centroids[labels[i] ?? 0];
    return c ? s + distance(p, c) ** 2 : s;
  }, 0);
}

/** k-means++: each new centroid is drawn with probability ∝ D(x)², far from the chosen ones. */
export function kmeansPlusPlus(points: readonly Point[], k: number, rng: () => number): Point[] {
  const first = points[Math.floor(rng() * points.length)];
  if (first === undefined) return [];
  const centroids: Point[] = [first];
  while (centroids.length < k) {
    const d2 = points.map((p) => Math.min(...centroids.map((c) => distance(p, c) ** 2)));
    const total = d2.reduce((s, v) => s + v, 0);
    let r = rng() * total;
    let index = 0;
    for (; index < d2.length - 1; index++) {
      r -= d2[index] ?? 0;
      if (r <= 0) break;
    }
    centroids.push(points[index] ?? first);
  }
  return centroids;
}

// ---------- DBSCAN ----------

export type DbscanRole = "core" | "border" | "noise";

export function dbscan(
  points: readonly Point[],
  eps: number,
  minPts: number,
): { labels: number[]; roles: DbscanRole[] } {
  const neighbours = points.map((p) =>
    points
      .map((q, j) => ({ j, d: distance(p, q) }))
      .filter((n) => n.d <= eps)
      .map((n) => n.j),
  );
  const isCore = neighbours.map((n) => n.length >= minPts); // the point counts itself, as sklearn
  const labels = new Array<number>(points.length).fill(-1);
  let cluster = 0;
  points.forEach((_, i) => {
    if (!isCore[i] || labels[i] !== -1) return;
    const queue = [i];
    labels[i] = cluster;
    while (queue.length > 0) {
      const current = queue.pop() ?? i;
      if (!isCore[current]) continue;
      for (const j of neighbours[current] ?? []) {
        if (labels[j] === -1) {
          labels[j] = cluster;
          queue.push(j);
        }
      }
    }
    cluster++;
  });
  const roles: DbscanRole[] = points.map((_, i) =>
    isCore[i] ? "core" : labels[i] === -1 ? "noise" : "border",
  );
  return { labels, roles };
}

// ---------- Agglomerative ----------

export type Linkage = "single" | "complete" | "average" | "ward";

export interface Merge {
  a: number;
  b: number;
  height: number;
  id: number;
  size: number;
}

/** Naive O(n³) agglomerative clustering; fine for the few dozen points of a demo. */
export function agglomerative(points: readonly Point[], linkage: Linkage): Merge[] {
  const clusters = new Map<number, number[]>(points.map((_, i) => [i, [i]]));
  const merges: Merge[] = [];
  let nextId = points.length;
  const centroid = (members: readonly number[]): Point => ({
    x: members.reduce((s, i) => s + (points[i]?.x ?? 0), 0) / members.length,
    y: members.reduce((s, i) => s + (points[i]?.y ?? 0), 0) / members.length,
  });
  const linkDistance = (A: readonly number[], B: readonly number[]): number => {
    if (linkage === "ward") {
      const ca = centroid(A);
      const cb = centroid(B);
      // Increase in within-cluster variance when merging (Lance–Williams form for Ward).
      return Math.sqrt(((2 * A.length * B.length) / (A.length + B.length)) * distance(ca, cb) ** 2);
    }
    const ds = A.flatMap((i) =>
      B.map((j) => distance(points[i] ?? { x: 0, y: 0 }, points[j] ?? { x: 0, y: 0 })),
    );
    if (linkage === "single") return Math.min(...ds);
    if (linkage === "complete") return Math.max(...ds);
    return ds.reduce((s, d) => s + d, 0) / ds.length;
  };
  while (clusters.size > 1) {
    let best = { a: -1, b: -1, d: Infinity };
    const ids = [...clusters.keys()];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i] ?? 0;
        const b = ids[j] ?? 0;
        const d = linkDistance(clusters.get(a) ?? [], clusters.get(b) ?? []);
        if (d < best.d) best = { a, b, d };
      }
    }
    const members = [...(clusters.get(best.a) ?? []), ...(clusters.get(best.b) ?? [])];
    clusters.delete(best.a);
    clusters.delete(best.b);
    clusters.set(nextId, members);
    merges.push({ a: best.a, b: best.b, height: best.d, id: nextId, size: members.length });
    nextId++;
  }
  return merges;
}

/** Flat labels obtained by cutting the dendrogram at `height`. */
export function cutTree(n: number, merges: readonly Merge[], height: number): number[] {
  const parent = new Map<number, number>();
  for (const m of merges) {
    if (m.height > height) break;
    parent.set(m.a, m.id);
    parent.set(m.b, m.id);
  }
  const root = (i: number): number => {
    let r = i;
    for (let p = parent.get(r); p !== undefined; p = parent.get(r)) r = p;
    return r;
  };
  const ids = new Map<number, number>();
  return Array.from({ length: n }, (_, i) => {
    const r = root(i);
    if (!ids.has(r)) ids.set(r, ids.size);
    return ids.get(r) ?? 0;
  });
}
