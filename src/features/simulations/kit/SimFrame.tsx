import { FlaskConical, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { es } from "@/i18n/es";

import styles from "./Sim.module.css";

interface Props {
  title: string;
  /** What to try: one or two sentences that invite an experiment. */
  intro?: ReactNode;
  controls?: ReactNode;
  /** Readouts under the view: numbers that change with the controls. */
  readout?: ReactNode;
  onReset?: () => void;
  children: ReactNode;
}

export function SimFrame({ title, intro, controls, readout, onReset, children }: Props): ReactNode {
  return (
    <section className={styles.frame} aria-label={`${es.sim.badge}: ${title}`}>
      <header className={styles.head}>
        <span className={styles.badge}>
          <FlaskConical size={14} aria-hidden="true" />
          {es.sim.badge}
        </span>
        <h3 className={styles.title}>{title}</h3>
        {onReset && (
          <button type="button" className={styles.reset} onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" />
            {es.sim.reset}
          </button>
        )}
      </header>
      {intro !== undefined && <div className={styles.intro}>{intro}</div>}
      <div className={styles.body}>
        <div className={styles.view}>{children}</div>
        {controls !== undefined && <div className={styles.controls}>{controls}</div>}
      </div>
      {readout !== undefined && <div className={styles.readout}>{readout}</div>}
    </section>
  );
}
