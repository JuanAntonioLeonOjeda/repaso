import { useId, useState, type ReactNode } from "react";

import { es } from "@/i18n/es";

import { isCorrectAnswer } from "./answer-check";
import { ExerciseFrame } from "./ExerciseFrame";
import { useExerciseProgress } from "./exercise-scope";
import { HintsAndSolution } from "./HintsAndSolution";
import styles from "./Exercise.module.css";

interface Props {
  id: string;
  title?: string;
  /** The question, usually with a code block showing what to predict. */
  children: ReactNode;
  /** Accepted answers (a string, or several equivalent ones). */
  answer: string | readonly string[];
  /** For numeric answers: how far from the exact value still counts as right. */
  tolerance?: number;
  explanation: ReactNode;
  hints?: readonly ReactNode[];
  placeholder?: string;
}

/** "Work it out on paper and write the result": values, outputs, shapes, counts. */
export function Predict({
  id,
  title = es.exercise.predictTitle,
  children,
  answer,
  tolerance,
  explanation,
  hints = [],
  placeholder,
}: Props): ReactNode {
  const inputId = useId();
  const { isSolved, markSolved } = useExerciseProgress(id);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"ok" | "bad" | null>(null);
  const accepted = typeof answer === "string" ? [answer] : answer;

  function check(): void {
    const ok = isCorrectAnswer(value, { accepted, tolerance });
    setResult(ok ? "ok" : "bad");
    if (ok) markSolved();
  }

  return (
    <ExerciseFrame title={title} isSolved={isSolved}>
      <div className={styles.prompt}>{children}</div>
      <form
        className={styles.answerRow}
        onSubmit={(event) => {
          event.preventDefault();
          check();
        }}
      >
        <label htmlFor={inputId} className="visually-hidden">
          {es.exercise.answerLabel}
        </label>
        <input
          id={inputId}
          className={styles.answerInput}
          value={value}
          placeholder={placeholder ?? es.exercise.answerLabel}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setValue(event.target.value);
            setResult(null);
          }}
        />
        <button
          type="submit"
          className={`${styles.button} ${styles.primary}`}
          disabled={value.trim() === ""}
        >
          {es.exercise.check}
        </button>
      </form>
      <HintsAndSolution
        hints={hints}
        solution={
          <div className={styles.reveal}>
            <span className={styles.revealLabel}>{es.exercise.solutionLabel}</span>
            <div>
              <code>{accepted[0]}</code>
            </div>
            <div className={styles.explanation}>{explanation}</div>
          </div>
        }
      />
      {result !== null && (
        <div className={styles.feedback} data-kind={result} role="status">
          <strong>{result === "ok" ? es.exercise.quizCorrect : es.exercise.tryAgain}</strong>
          {result === "ok" && explanation}
        </div>
      )}
    </ExerciseFrame>
  );
}
