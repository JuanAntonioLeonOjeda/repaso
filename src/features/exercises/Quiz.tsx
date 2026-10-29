import { useId, useState, type ReactNode } from "react";

import { es } from "@/i18n/es";

import { ExerciseFrame } from "./ExerciseFrame";
import { useExerciseProgress } from "./exercise-scope";
import { HintsAndSolution } from "./HintsAndSolution";
import styles from "./Exercise.module.css";

interface Props {
  id: string;
  title?: string;
  /** The question. */
  children: ReactNode;
  options: readonly ReactNode[];
  /** Index of the correct option. */
  answer: number;
  /** Why the answer is right (and the others are not). Shown after checking. */
  explanation: ReactNode;
  hints?: readonly ReactNode[];
}

export function Quiz({
  id,
  title = "Pregunta rápida",
  children,
  options,
  answer,
  explanation,
  hints = [],
}: Props): ReactNode {
  const name = useId();
  const { isSolved, markSolved } = useExerciseProgress(id);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<number | null>(null);
  const isCorrect = checked === answer;

  function check(): void {
    if (selected === null) return;
    setChecked(selected);
    if (selected === answer) markSolved();
  }

  return (
    <ExerciseFrame title={title} isSolved={isSolved}>
      {/* The question may hold paragraphs or code, which a <legend> cannot contain. */}
      <div id={`${name}-q`} className={styles.prompt}>
        {children}
      </div>
      <fieldset className={styles.options} aria-labelledby={`${name}-q`}>
        {options.map((option, i) => (
          <label
            key={i}
            className={styles.option}
            data-result={checked === i ? (isCorrect ? "correct" : "wrong") : undefined}
          >
            <input
              type="radio"
              name={name}
              checked={selected === i}
              onChange={() => {
                setSelected(i);
                setChecked(null);
              }}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <HintsAndSolution
        hints={hints}
        leading={
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={check}
            disabled={selected === null}
          >
            {es.exercise.quizCheck}
          </button>
        }
        solution={
          <div className={styles.reveal}>
            <span className={styles.revealLabel}>{es.exercise.solutionLabel}</span>
            <div>{options[answer]}</div>
            <div className={styles.explanation}>{explanation}</div>
          </div>
        }
      />
      {checked !== null && (
        <div className={styles.feedback} data-kind={isCorrect ? "ok" : "bad"} role="status">
          <strong>{isCorrect ? es.exercise.quizCorrect : es.exercise.quizWrong}</strong>
          {isCorrect ? explanation : es.exercise.tryAgain}
        </div>
      )}
    </ExerciseFrame>
  );
}
