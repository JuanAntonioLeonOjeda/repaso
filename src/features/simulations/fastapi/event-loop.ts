/**
 * n identical requests arrive at once; each needs `cpuMs` of Python work and then waits
 * `ioMs` for something outside (a database, another API). How long each one takes depends on
 * how the endpoint is written:
 *
 * - `await`: `async def` that awaits the I/O. One thread (the event loop) runs the Python
 *   work of every request in turn; the waits overlap.
 * - `blocking`: `async def` that calls something blocking (`time.sleep`, `requests.get`).
 *   The loop is stuck during the wait, so the requests go one after another.
 * - `threads`: plain `def`. FastAPI runs it in a thread pool of `threads` threads; waits
 *   overlap up to that limit, but the Python work still takes turns (the GIL).
 *
 * Simplified on purpose: requests take the CPU in arrival order and are not preempted.
 */
export type Mode = "await" | "blocking" | "threads";

export type SegmentKind = "queued" | "waiting-cpu" | "cpu" | "io";

export interface Segment {
  kind: SegmentKind;
  start: number;
  end: number;
}

export interface RequestTimeline {
  segments: Segment[];
  finish: number;
}

export interface Schedule {
  requests: RequestTimeline[];
  /** When the last response leaves. */
  total: number;
  meanLatency: number;
}

export interface ScheduleOptions {
  mode: Mode;
  n: number;
  cpuMs: number;
  ioMs: number;
  /** Size of the thread pool (`threads` mode only; Starlette's default is 40). */
  threads?: number;
}

function earliest(times: number[]): number {
  return times.reduce((best, t, i) => (t < (times[best] ?? Infinity) ? i : best), 0);
}

function segment(kind: SegmentKind, start: number, end: number): Segment[] {
  return end > start ? [{ kind, start, end }] : [];
}

export function schedule({ mode, n, cpuMs, ioMs, threads = 40 }: ScheduleOptions): Schedule {
  const slots = Array.from({ length: mode === "threads" ? Math.max(1, threads) : n }, () => 0);
  let cpuFree = 0;
  const requests: RequestTimeline[] = [];
  for (let i = 0; i < n; i++) {
    const slot = earliest(slots);
    const start = slots[slot] ?? 0;
    const cpuStart = Math.max(start, cpuFree);
    const cpuEnd = cpuStart + cpuMs;
    const finish = cpuEnd + ioMs;
    // A blocking call keeps the event loop busy for the whole wait.
    cpuFree = mode === "blocking" ? finish : cpuEnd;
    slots[slot] = finish;
    requests.push({
      segments: [
        ...segment("queued", 0, start),
        ...segment("waiting-cpu", start, cpuStart),
        ...segment("cpu", cpuStart, cpuEnd),
        ...segment("io", cpuEnd, finish),
      ],
      finish,
    });
  }
  const total = Math.max(0, ...requests.map((r) => r.finish));
  const meanLatency = n === 0 ? 0 : requests.reduce((sum, r) => sum + r.finish, 0) / n;
  return { requests, total, meanLatency };
}
