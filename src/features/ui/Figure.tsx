import type { ReactNode } from "react";

import styles from "./Ui.module.css";

interface Props {
  caption?: ReactNode;
  children: ReactNode;
  /** Narrow figures stay at their natural width instead of filling the column. */
  isNarrow?: boolean;
}

export function Figure({ caption, children, isNarrow = false }: Props): ReactNode {
  return (
    <figure className={styles.figure} data-narrow={isNarrow}>
      <div className={styles.figureBody}>{children}</div>
      {caption !== undefined && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
