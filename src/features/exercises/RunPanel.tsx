import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { usePythonStatus } from "@/features/python";
import { es } from "@/i18n/es";

import type { RunState } from "./useCodeRunner";
import styles from "./Exercise.module.css";

/** Python status line plus the console and the figures of the last run. */
export function RunPanel({ state }: { state: RunState }): ReactNode {
  const status = usePythonStatus();
  const { outcome, output, isRunning } = state;
  const images = outcome !== null && outcome.kind !== "error" ? outcome.images : [];
  const hasConsole = isRunning || outcome !== null;

  return (
    <>
      {isRunning && (status === "loading" || status === "installing") && (
        <p className={styles.status} role="status">
          <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" />
          {status === "loading" ? es.exercise.pythonLoading : es.exercise.pythonPackages}
        </p>
      )}
      {status === "failed" && (
        <p className={styles.feedback} data-kind="bad" role="alert">
          {es.exercise.pythonError}
        </p>
      )}
      {hasConsole && (
        <div className={styles.console}>
          <span className={styles.consoleLabel}>{es.exercise.output}</span>
          <pre className={styles.consoleText} aria-live="polite">
            {output === "" && !isRunning ? es.exercise.noOutput : output}
            {outcome?.kind === "error" && (outcome.traceback || outcome.message)}
          </pre>
          {images.length > 0 && (
            <div className={styles.figures}>
              {images.map((src, i) => (
                <img key={i} src={src} alt={es.exercise.figure(i + 1)} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
