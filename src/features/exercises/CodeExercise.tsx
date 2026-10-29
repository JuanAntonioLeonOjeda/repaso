import { Play, RotateCcw, ShieldCheck, Square } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { pythonClient } from "@/features/python";
import { es } from "@/i18n/es";

import { sameOutput } from "./answer-check";
import { CodeEditor } from "./CodeEditor";
import { dedent } from "./dedent";
import { ExerciseFrame } from "./ExerciseFrame";
import { useExerciseProgress } from "./exercise-scope";
import { HintsAndSolution } from "./HintsAndSolution";
import { RunPanel } from "./RunPanel";
import { useCodeRunner } from "./useCodeRunner";
import styles from "./Exercise.module.css";

interface Props {
  id: string;
  title?: string;
  /** What to do. */
  children: ReactNode;
  /** Code the editor starts with, usually with `___` gaps to fill. */
  starter: string;
  solution: string;
  hints?: readonly ReactNode[];
  /** Python run after the learner's code in the same namespace; `assert` decides. */
  check?: string;
  /** Alternatively, the exact output the code must print. */
  expectedOutput?: string;
  /** Datasets (from /datasets) available in the working directory. */
  files?: readonly string[];
}

type Verdict = { kind: "ok" } | { kind: "bad"; message: string } | null;

export function CodeExercise({
  id,
  title = "Completa el código",
  children,
  starter,
  solution,
  hints = [],
  check,
  expectedOutput,
  files = [],
}: Props): ReactNode {
  const initialCode = useMemo(() => dedent(starter), [starter]);
  const solutionCode = useMemo(() => dedent(solution), [solution]);
  const [code, setCode] = useState(initialCode);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const { isSolved, markSolved } = useExerciseProgress(id);
  const { state, run, stop } = useCodeRunner(files);
  const isCheckable = check !== undefined || expectedOutput !== undefined;

  async function verify(): Promise<void> {
    setVerdict(null);
    const { outcome, output } = await run(code, check === undefined ? undefined : dedent(check));
    if (outcome.kind === "error") {
      setVerdict({ kind: "bad", message: outcome.message });
      return;
    }
    if (outcome.kind === "check-failed") {
      setVerdict({ kind: "bad", message: outcome.message || es.exercise.tryAgain });
      return;
    }
    if (expectedOutput !== undefined && !sameOutput(output, dedent(expectedOutput))) {
      setVerdict({ kind: "bad", message: es.exercise.tryAgain });
      return;
    }
    setVerdict({ kind: "ok" });
    markSolved();
  }

  const runButtons = (
    <>
      {state.isRunning ? (
        <button type="button" className={styles.button} onClick={stop}>
          <Square size={16} aria-hidden="true" />
          {es.exercise.stop}
        </button>
      ) : (
        <>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setVerdict(null);
              void run(code);
            }}
          >
            <Play size={16} aria-hidden="true" />
            {es.exercise.run}
          </button>
          {isCheckable && (
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              onClick={() => void verify()}
            >
              <ShieldCheck size={16} aria-hidden="true" />
              {es.exercise.check}
            </button>
          )}
        </>
      )}
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          setCode(initialCode);
          setVerdict(null);
        }}
      >
        <RotateCcw size={16} aria-hidden="true" />
        {es.exercise.reset}
      </button>
    </>
  );

  return (
    <ExerciseFrame title={title} isSolved={isSolved}>
      <div className={styles.prompt}>{children}</div>
      <div className={styles.solution}>
        <CodeEditor value={code} onChange={setCode} onFocus={pythonClient.warmup} />
      </div>
      <HintsAndSolution
        hints={hints}
        leading={runButtons}
        solution={
          <div className={styles.reveal}>
            <span className={styles.revealLabel}>{es.exercise.solutionLabel}</span>
            <CodeEditor value={solutionCode} isReadOnly label={es.exercise.solutionLabel} />
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setCode(solutionCode);
                setVerdict(null);
              }}
            >
              {es.exercise.loadSolution}
            </button>
          </div>
        }
      />
      <RunPanel state={state} />
      {verdict !== null && (
        <div className={styles.feedback} data-kind={verdict.kind} role="status">
          <strong>{verdict.kind === "ok" ? es.exercise.solved : es.exercise.checkFailed}</strong>
          {verdict.kind === "bad" && verdict.message}
        </div>
      )}
    </ExerciseFrame>
  );
}
