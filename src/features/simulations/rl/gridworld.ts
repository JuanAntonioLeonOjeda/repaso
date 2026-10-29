/**
 * A small GridWorld and tabular Q-learning, the algorithm DQN generalises.
 * Q(s,a) ← Q(s,a) + α · [r + γ · max_a' Q(s',a') − Q(s,a)]
 */

export const ACTIONS = [
  { name: "arriba", dr: -1, dc: 0, arrow: "↑" },
  { name: "derecha", dr: 0, dc: 1, arrow: "→" },
  { name: "abajo", dr: 1, dc: 0, arrow: "↓" },
  { name: "izquierda", dr: 0, dc: -1, arrow: "←" },
] as const;

export type Cell = "." | "#" | "G" | "X" | "S";

/** S start, G goal (+10), X pit (−10), # wall. Every step costs −0.1 to encourage short paths. */
export const MAP: readonly string[] = ["......", ".##.X.", "...#..", ".X....", "S..#.G"];

export const ROWS = MAP.length;
export const COLS = MAP[0]?.length ?? 0;

export function cellAt(r: number, c: number): Cell {
  return (MAP[r]?.[c] ?? "#") as Cell;
}

export function startState(): number {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (cellAt(r, c) === "S") return r * COLS + c;
  return 0;
}

export function envStep(
  state: number,
  action: number,
): { next: number; reward: number; done: boolean } {
  const r = Math.floor(state / COLS);
  const c = state % COLS;
  const a = ACTIONS[action] ?? ACTIONS[0];
  const nr = r + a.dr;
  const nc = c + a.dc;
  // Walls and edges: the agent stays where it was.
  const blocked = nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || cellAt(nr, nc) === "#";
  const next = blocked ? state : nr * COLS + nc;
  const cell = cellAt(Math.floor(next / COLS), next % COLS);
  if (cell === "G") return { next, reward: 10, done: true };
  if (cell === "X") return { next, reward: -10, done: true };
  return { next, reward: -0.1, done: false };
}

export function createQ(): number[][] {
  return Array.from({ length: ROWS * COLS }, () => [0, 0, 0, 0]);
}

export function greedy(q: readonly number[]): number {
  let best = 0;
  q.forEach((v, i) => {
    if (v > (q[best] ?? -Infinity)) best = i;
  });
  return best;
}

export function epsilonGreedy(q: readonly number[], epsilon: number, rng: () => number): number {
  return rng() < epsilon ? Math.floor(rng() * 4) : greedy(q);
}

export interface EpisodeResult {
  q: number[][];
  totalReward: number;
  steps: number;
  path: number[];
}

export function runEpisode(
  qIn: readonly number[][],
  { alpha, gamma, epsilon }: { alpha: number; gamma: number; epsilon: number },
  rng: () => number,
  maxSteps = 100,
): EpisodeResult {
  const q = qIn.map((row) => [...row]);
  let s = startState();
  let totalReward = 0;
  const path = [s];
  for (let t = 0; t < maxSteps; t++) {
    const a = epsilonGreedy(q[s] ?? [], epsilon, rng);
    const { next, reward, done } = envStep(s, a);
    const target = done ? reward : reward + gamma * Math.max(...(q[next] ?? [0]));
    const row = q[s];
    if (row) row[a] = (row[a] ?? 0) + alpha * (target - (row[a] ?? 0));
    totalReward += reward;
    s = next;
    path.push(s);
    if (done) return { q, totalReward, steps: t + 1, path };
  }
  return { q, totalReward, steps: maxSteps, path };
}
