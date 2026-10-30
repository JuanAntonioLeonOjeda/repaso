/**
 * A three-stage pipeline over 1..n: keep the even numbers, square them, take the first k.
 * The same work done two ways, as a list of events, so a simulation can replay it step by step.
 */
export type Stage = "source" | "filter" | "map" | "take";

export interface PipelineEvent {
  stage: Stage;
  value: number;
  /** For the filter: whether the value passes. */
  passed?: boolean;
  /** Values held in memory at this moment. */
  inMemory: number;
}

/** Eager (lists): each stage runs to the end and stores its whole result before the next one. */
export function eagerEvents(n: number, k: number): PipelineEvent[] {
  const events: PipelineEvent[] = [];
  const numbers = Array.from({ length: n }, (_, i) => i + 1);
  numbers.forEach((v, i) => events.push({ stage: "source", value: v, inMemory: i + 1 }));
  const evens: number[] = [];
  for (const v of numbers) {
    const passed = v % 2 === 0;
    if (passed) evens.push(v);
    events.push({ stage: "filter", value: v, passed, inMemory: n + evens.length });
  }
  const squares: number[] = [];
  for (const v of evens) {
    squares.push(v * v);
    events.push({ stage: "map", value: v * v, inMemory: n + evens.length + squares.length });
  }
  squares
    .slice(0, k)
    .forEach((v, i) =>
      events.push({ stage: "take", value: v, inMemory: n + evens.length + squares.length + i + 1 }),
    );
  return events;
}

/**
 * Lazy (generators): `take` asks for one value, which travels the whole chain; nothing is
 * stored and the source stops as soon as k values have come out.
 */
export function lazyEvents(n: number, k: number): PipelineEvent[] {
  const events: PipelineEvent[] = [];
  let taken = 0;
  for (let v = 1; v <= n && taken < k; v++) {
    events.push({ stage: "source", value: v, inMemory: 1 });
    const passed = v % 2 === 0;
    events.push({ stage: "filter", value: v, passed, inMemory: 1 });
    if (!passed) continue;
    events.push({ stage: "map", value: v * v, inMemory: 1 });
    taken += 1;
    events.push({ stage: "take", value: v * v, inMemory: 1 });
  }
  return events;
}
