import { CheckCircle2, PencilLine } from "lucide-react";
import type { ReactNode } from "react";

import { es } from "@/i18n/es";

import styles from "./Exercise.module.css";

interface Props {
  title: string;
  isSolved: boolean;
  children: ReactNode;
}

/** The yellow-banded box every exercise lives in. */
export function ExerciseFrame({ title, isSolved, children }: Props): ReactNode {
  return (
    <section className={styles.frame} data-solved={isSolved} aria-label={title}>
      <div className={styles.head}>
        <span className={styles.tag}>
          <PencilLine size={14} aria-hidden="true" />
          {es.exercise.yourTurn}
        </span>
        <span className={styles.title}>{title}</span>
        {isSolved && (
          <span className={styles.solvedBadge}>
            <CheckCircle2 size={16} aria-hidden="true" />
            {es.exercise.solved}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
