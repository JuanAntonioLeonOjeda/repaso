/// <reference lib="webworker" />
/**
 * Runs learners' Python with Pyodide (CPython compiled to WebAssembly), off the main
 * thread so a long loop never freezes the page. See ADR-0002.
 *
 * Pyodide and its packages come from the jsDelivr CDN at a pinned version: the full
 * distribution with scikit-learn is hundreds of MB, too big to ship in the image.
 */
import type { PyodideAPI } from "pyodide";
import type { PyProxy } from "pyodide/ffi";

import type { RunOutcome, RunRequest, WorkerMessage, WorkerStatus } from "./protocol";
import { cleanTraceback, learnerLines } from "./traceback";

// Keep in step with the `pyodide` devDependency, which only provides the types.
const PYODIDE_VERSION = "314.0.7";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

declare const self: DedicatedWorkerGlobalScope;

/** Pyodide's FS is typed loosely; this is the one call used here. */
interface PyFs {
  writeFile: (path: string, data: Uint8Array) => void;
}

// Matplotlib renders to PNG in memory; figures are returned as data URLs after each run.
const PRELUDE = `
import os, sys, warnings
os.environ["MPLBACKEND"] = "AGG"
# Matplotlib's AGG backend under Pyodide passes floats internally; the warning is noise for learners.
warnings.filterwarnings("ignore", message="The [xy] parameter as float")
# plt.show() cannot open a window here; figures are collected and shown below the output instead.
warnings.filterwarnings("ignore", message="FigureCanvasAgg is non-interactive")
`;

const COLLECT_FIGURES = `
def __collect_figures():
    import sys
    if "matplotlib.pyplot" not in sys.modules:
        return []
    import base64, io
    import matplotlib.pyplot as plt
    out = []
    for num in plt.get_fignums():
        buf = io.BytesIO()
        plt.figure(num).savefig(buf, format="png", dpi=110, bbox_inches="tight")
        out.append("data:image/png;base64," + base64.b64encode(buf.getvalue()).decode())
    plt.close("all")
    return out
__collect_figures()
`;

// WebAssembly Python has no threads, but Starlette runs every `def` endpoint and dependency
// in a thread pool (anyio.to_thread). Running them inline gives the same results in a
// single-threaded page; the FastAPI lessons explain what changes on a real server (ADR-0005).
// The patch lasts for the worker's life (anyio stays imported); exercises load anyio through
// their imports, so it is in place before the learner's code runs.
const INLINE_THREADPOOL = `
import anyio.to_thread
async def __run_sync_inline(func, *args, abandon_on_cancel=False, cancellable=None, limiter=None):
    return func(*args)
anyio.to_thread.run_sync = __run_sync_inline
`;

let pyodidePromise: Promise<PyodideAPI> | null = null;
let isThreadpoolInlined = false;

function post(message: WorkerMessage): void {
  self.postMessage(message);
}

function setStatus(status: WorkerStatus): void {
  post({ type: "status", status });
}

async function loadRuntime(): Promise<PyodideAPI> {
  setStatus("loading");
  const module = (await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)) as {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideAPI>;
  };
  const pyodide = await module.loadPyodide({ indexURL: INDEX_URL });
  await pyodide.runPythonAsync(PRELUDE);
  setStatus("ready");
  return pyodide;
}

function getPyodide(): Promise<PyodideAPI> {
  pyodidePromise ??= loadRuntime().catch((error: unknown) => {
    pyodidePromise = null;
    setStatus("failed");
    throw error;
  });
  return pyodidePromise;
}

async function copyDatasets(pyodide: PyodideAPI, files: readonly string[]): Promise<void> {
  for (const name of files) {
    const response = await fetch(`/datasets/${name}`);
    if (!response.ok) throw new Error(`No se encontró el dataset ${name}`);
    (pyodide.FS as PyFs).writeFile(name, new Uint8Array(await response.arrayBuffer()));
  }
}

function toStringList(value: unknown): string[] {
  if (value && typeof value === "object" && "toJs" in value) {
    const js = (value as { toJs: () => unknown }).toJs();
    return Array.isArray(js) ? js.filter((x): x is string => typeof x === "string") : [];
  }
  return [];
}

async function execute(pyodide: PyodideAPI, request: RunRequest): Promise<RunOutcome> {
  const source = request.check === null ? request.code : `${request.code}\n${request.check}`;
  setStatus("installing");
  await pyodide.loadPackagesFromImports(source);
  if (!isThreadpoolInlined && "anyio" in pyodide.loadedPackages) {
    await pyodide.runPythonAsync(INLINE_THREADPOOL);
    isThreadpoolInlined = true;
  }
  await copyDatasets(pyodide, request.files);
  setStatus("ready");

  // A fresh namespace per run: earlier runs never leak variables into this one.
  const builtins = pyodide.globals as unknown as { get: (name: string) => unknown };
  const makeDict = builtins.get("dict") as () => PyProxy;
  const globals = makeDict();
  const forward = (text: string): void => {
    post({ type: "stdout", id: request.id, text });
  };
  pyodide.setStdout({ batched: forward });
  pyodide.setStderr({ batched: forward });
  try {
    try {
      await pyodide.runPythonAsync(request.code, { globals });
    } catch (error) {
      await pyodide.runPythonAsync(COLLECT_FIGURES);
      const raw = String(error);
      return { kind: "error", ...cleanTraceback(raw), lines: learnerLines(raw) };
    }
    if (request.check !== null) {
      try {
        // Its own file name keeps the check's frames apart from the learner's `<exec>` ones.
        await pyodide.runPythonAsync(request.check, { globals, filename: "<check>" });
      } catch (error) {
        const images = toStringList(await pyodide.runPythonAsync(COLLECT_FIGURES));
        const raw = String(error);
        const { message } = cleanTraceback(raw);
        return {
          kind: "check-failed",
          message: message.replace(/^AssertionError:?\s*/, ""),
          images,
          lines: learnerLines(raw),
        };
      }
    }
    const images = toStringList(await pyodide.runPythonAsync(COLLECT_FIGURES));
    return { kind: "ok", images };
  } finally {
    globals.destroy();
  }
}

self.addEventListener("message", (event: MessageEvent<RunRequest | { type: "warmup" }>) => {
  const request = event.data;
  if (request.type === "warmup") {
    getPyodide().catch(() => undefined);
    return;
  }
  getPyodide()
    .then((pyodide) => execute(pyodide, request))
    .then((outcome) => {
      post({ type: "done", id: request.id, outcome });
    })
    .catch((error: unknown) => {
      post({
        type: "done",
        id: request.id,
        outcome: { kind: "error", message: String(error), traceback: "", lines: [] },
      });
    });
});
