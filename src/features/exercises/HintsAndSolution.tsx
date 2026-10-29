import { Eye, EyeOff, Lightbulb } from "lucide-react";
import { useState, type ReactNode } from "react";

import { es } from "@/i18n/es";

import styles from "./Exercise.module.css";

interface Props {
  hints: readonly ReactNode[];
  /** What "see solution" reveals. */
  solution: ReactNode;
  /** Extra buttons rendered in the same row (run, check…), before hints. */
  leading?: ReactNode;
}

/**
 * Hints come one at a time (asking for a hint should cost something), the solution
 * at once. Both stay visible once revealed so they can be compared with one's answer.
 */
export function HintsAndSolution({ hints, solution, leading }: Props): ReactNode {
  const [shownHints, setShownHints] = useState(0);
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const hasMoreHints = shownHints < hints.length;

  return (
    <>
      <div className={styles.actions}>
        {leading}
        {hints.length > 0 && (
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setShownHints((n) => n + 1);
            }}
            disabled={!hasMoreHints}
          >
            <Lightbulb size={16} aria-hidden="true" />
            {shownHints === 0
              ? es.exercise.hint
              : hasMoreHints
                ? es.exercise.nextHint
                : es.exercise.noMoreHints}
          </button>
        )}
        <button
          type="button"
          className={styles.button}
          aria-expanded={isSolutionShown}
          onClick={() => {
            setIsSolutionShown((v) => !v);
          }}
        >
          {isSolutionShown ? (
            <EyeOff size={16} aria-hidden="true" />
          ) : (
            <Eye size={16} aria-hidden="true" />
          )}
          {isSolutionShown ? es.exercise.hideSolution : es.exercise.showSolution}
        </button>
      </div>
      {shownHints > 0 && (
        <div className={styles.reveal} aria-live="polite">
          {hints.slice(0, shownHints).map((hint, i) => (
            <div key={i}>
              <span className={styles.revealLabel}>
                {es.exercise.hint} {i + 1}
              </span>
              <div>{hint}</div>
            </div>
          ))}
        </div>
      )}
      {isSolutionShown && <div className={styles.solution}>{solution}</div>}
    </>
  );
}
