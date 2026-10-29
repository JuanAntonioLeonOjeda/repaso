import { useCallback, useState } from "react";

import { pythonClient, type RunOutcome } from "@/features/python";

export interface RunState {
  isRunning: boolean;
  output: string;
  outcome: RunOutcome | null;
}

const INITIAL: RunState = { isRunning: false, output: "", outcome: null };

export function useCodeRunner(files: readonly string[]): {
  state: RunState;
  run: (code: string, check?: string) => Promise<{ outcome: RunOutcome; output: string }>;
  stop: () => void;
} {
  const [state, setState] = useState<RunState>(INITIAL);

  const run = useCallback(
    async (code: string, check?: string) => {
      let output = "";
      setState({ isRunning: true, output: "", outcome: null });
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
