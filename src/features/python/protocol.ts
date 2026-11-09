/** Messages between the page and the Python worker. */

export interface RunRequest {
  type: "run";
  id: number;
  code: string;
  /** Optional Python run after `code` in the same namespace; assertions decide the outcome. */
  check: string | null;
  /** Dataset files under `<base>/datasets/` copied into Python's working directory first. */
  files: readonly string[];
}

export type WorkerStatus = "idle" | "loading" | "installing" | "ready" | "failed";

/** `lines`: 1-based lines of the learner's code in the traceback (empty for a bare assert). */
export type RunOutcome =
  | { kind: "ok"; images: string[] }
  | { kind: "check-failed"; message: string; images: string[]; lines: number[] }
  | { kind: "error"; message: string; traceback: string; lines: number[] };

export type WorkerMessage =
  | { type: "status"; status: WorkerStatus }
  | { type: "stdout"; id: number; text: string }
  | { type: "done"; id: number; outcome: RunOutcome };
