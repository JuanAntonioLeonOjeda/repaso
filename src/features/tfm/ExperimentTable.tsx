import type { ReactNode } from "react";

import { EXPERIMENT_METRICS, type ExperimentKey } from "@/content/tfm/metrics";

import styles from "./Tfm.module.css";

interface Row {
  key: ExperimentKey;
  label: string;
}

interface Props {
  rows: readonly Row[];
  /** Per patient (as in the thesis) or per image. */
  level?: "patient" | "image";
  /** Highlights the best value of each column. */
  isRanked?: boolean;
}

const COLUMNS = [
  { id: "acc", label: "Accuracy", better: "high" },
  { id: "f1", label: "F1 macro", better: "high" },
  { id: "auc", label: "AUC", better: "high" },
  { id: "rmse", label: "RMSE BMD", better: "low" },
  { id: "pcc", label: "PCC BMD", better: "high" },
] as const;

const fmt = (v: number, id: string): string => (id === "rmse" ? v.toFixed(4) : v.toFixed(3));

/** Test metrics of several checkpoints, from the generated `metrics.ts`. */
export function ExperimentTable({ rows, level = "patient", isRanked = true }: Props): ReactNode {
  const best = Object.fromEntries(
    COLUMNS.map((c) => {
      const values = rows.map((r) => EXPERIMENT_METRICS[r.key][level][c.id]);
      return [c.id, c.better === "high" ? Math.max(...values) : Math.min(...values)];
    }),
  );
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption>
          Test {level === "patient" ? "por paciente" : "por imagen"} · reevaluado con el código del
          TFM
        </caption>
        <thead>
          <tr>
            <th scope="col">Experimento</th>
            {COLUMNS.map((c) => (
              <th key={c.id} scope="col">
                {c.label}
              </th>
            ))}
            <th scope="col">Sensibilidad (S / Op / Os)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const m = EXPERIMENT_METRICS[r.key][level];
            return (
              <tr key={r.key}>
                <th scope="row">{r.label}</th>
                {COLUMNS.map((c) => {
                  const isBest = isRanked && m[c.id] === best[c.id];
                  return (
                    <td key={c.id} data-best={isBest}>
                      {fmt(m[c.id], c.id)}
                      {isBest && <span className="visually-hidden"> (mejor)</span>}
                    </td>
                  );
                })}
                <td>{m.sens.map((s) => s.toFixed(2)).join(" / ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
