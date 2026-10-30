import { useCallback, useState } from "react";

import { pythonClient, type RunOutcome } from "@/features/python";

export interface RunState {
  isRunning: boolean;
  output: string;
  outcome: RunOutcome | null;
  /** The code that produced `outcome`, to tell whether the editor still shows it. */
  code: string;
}

const INITIAL: RunState = { isRunning: false, output: "", outcome: null, code: "" };

const NO_LINES: readonly number[] = [];

/**
 * Lines to mark as errors in the editor. Only while it shows the code that failed: after an
 * edit the numbers may point at other lines, and undoing the edit brings the marks back.
 */
export function errorLines(state: RunState, code: string): readonly number[] {
  const { outcome } = state;
  if (outcome === null || outcome.kind === "ok" || state.code !== code) return NO_LINES;
  return outcome.lines;
}

export function useCodeRunner(files: readonly string[]): {
  state: RunState;
  run: (code: string, check?: string) => Promise<{ outcome: RunOutcome; output: string }>;
  stop: () => void;
} {
  const [state, setState] = useState<RunState>(INITIAL);

  const run = useCallback(
    async (code: string, check?: string) => {
      let output = "";
      setState({ isRunning: true, output: "", outcome: null, code });
      const outcome = await pythonClient.run({
        code,
        check,
        files,
        onOutput: (text) => {
          output += text;
          setState((s) => ({ ...s, output: s.output + text }));
        },
      });
      setState((s) => ({ ...s, isRunning: false, outcome }));
      return { outcome, output };
    },
    [files],
  );

  const stop = useCallback(() => {
    pythonClient.stop();
  }, []);

  return { state, run, stop };
}
