/**
 * The page side of the Python worker: one worker for the whole app, runs answered in
 * order by id, and a status store that every exercise reads.
 *
 * Stopping a run terminates the worker (Python in WebAssembly cannot be interrupted
 * cooperatively without SharedArrayBuffer); the next run starts a fresh one.
 */
import type { RunOutcome, RunRequest, WorkerMessage, WorkerStatus } from "./protocol";

export interface RunOptions {
  code: string;
  check?: string | undefined;
  files?: readonly string[] | undefined;
  onOutput: (text: string) => void;
}

interface Pending {
  resolve: (outcome: RunOutcome) => void;
  onOutput: (text: string) => void;
}

const STOPPED: RunOutcome = {
  kind: "error",
  message: "Ejecución detenida.",
  traceback: "",
  lines: [],
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

let status: WorkerStatus = "idle";
const statusListeners = new Set<() => void>();

function setStatus(next: WorkerStatus): void {
  status = next;
  statusListeners.forEach((listener) => {
    listener();
  });
}

function handleMessage(event: MessageEvent<WorkerMessage>): void {
  const message = event.data;
  switch (message.type) {
    case "status":
      setStatus(message.status);
      return;
    case "stdout":
      pending.get(message.id)?.onOutput(`${message.text}\n`);
      return;
    case "done":
      pending.get(message.id)?.resolve(message.outcome);
      pending.delete(message.id);
      return;
    default: {
      const unreachable: never = message;
      throw new Error(`Unknown worker message ${JSON.stringify(unreachable)}`);
    }
  }
}

function getWorker(): Worker {
  if (worker === null) {
    worker = new Worker(new URL("./python.worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", handleMessage);
  }
  return worker;
}

export const pythonClient = {
  /** Starts downloading Pyodide before the first run, e.g. when an editor scrolls into view. */
  warmup: (): void => {
    if (status === "idle") getWorker().postMessage({ type: "warmup" });
  },

  run({ code, check, files = [], onOutput }: RunOptions): Promise<RunOutcome> {
    const id = nextId++;
    const request: RunRequest = { type: "run", id, code, check: check ?? null, files };
    return new Promise((resolve) => {
      pending.set(id, { resolve, onOutput });
      getWorker().postMessage(request);
    });
  },

  stop(): void {
    worker?.terminate();
    worker = null;
    pending.forEach(({ resolve }) => {
      resolve(STOPPED);
    });
    pending.clear();
    setStatus("idle");
  },

  // Arrow properties, not methods: they are passed around unbound (useSyncExternalStore, onFocus).
  subscribe: (listener: () => void): (() => void) => {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  },

  getStatus: (): WorkerStatus => status,
};
