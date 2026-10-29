import { Play, RotateCcw, Square, TerminalSquare } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { pythonClient } from "@/features/python";
import { es } from "@/i18n/es";

import { CodeEditor } from "./CodeEditor";
import { dedent } from "./dedent";
import { RunPanel } from "./RunPanel";
import { useCodeRunner } from "./useCodeRunner";
import styles from "./Exercise.module.css";

interface Props {
  code: string;
  title?: string;
  files?: readonly string[];
}

/** An editable, runnable example: nothing to solve, everything to play with. */
export function RunCode({ code, title = es.exercise.example, files = [] }: Props): ReactNode {
  const initial = useMemo(() => dedent(code), [code]);
  const [value, setValue] = useState(initial);
  const { state, run, stop } = useCodeRunner(files);

  return (
    <section className={styles.example} aria-label={title}>
      <div className={styles.exampleHead}>
        <TerminalSquare size={16} aria-hidden="true" />
        <strong>{title}</strong>
        <span>{es.exercise.exampleHint}</span>
      </div>
      <CodeEditor value={value} onChange={setValue} onFocus={pythonClient.warmup} />
      <div className={styles.actions}>
        {state.isRunning ? (
          <button type="button" className={styles.button} onClick={stop}>
            <Square size={16} aria-hidden="true" />
            {es.exercise.stop}
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => void run(value)}
          >
            <Play size={16} aria-hidden="true" />
            {es.exercise.run}
          </button>
        )}
        {value !== initial && (
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setValue(initial);
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            {es.exercise.reset}
          </button>
        )}
      </div>
      <RunPanel state={state} />
    </section>
  );
}
