import { AlertTriangle, BookOpenCheck, Briefcase, Info, Sparkles } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { es } from "@/i18n/es";

import styles from "./Ui.module.css";

export type CalloutKind = "real" | "warn" | "idea" | "practice" | "note";

const ICONS: Record<CalloutKind, ComponentType<{ size: number; "aria-hidden": "true" }>> = {
  real: Briefcase,
  warn: AlertTriangle,
  idea: Sparkles,
  practice: BookOpenCheck,
  note: Info,
};

interface Props {
  kind?: CalloutKind;
  /** Overrides the default heading of the kind. */
  title?: string;
  children: ReactNode;
}

/**
 * Side notes with a fixed meaning: `real` is how it is done at work, `warn` a common
 * mistake, `idea` the intuition, `practice` a link to the course notebooks.
 */
export function Callout({ kind = "note", title, children }: Props): ReactNode {
  const Icon = ICONS[kind];
  return (
    <aside className={styles.callout} data-kind={kind}>
      <p className={styles.calloutTitle}>
        <Icon size={18} aria-hidden="true" />
        {title ?? es.callout[kind]}
      </p>
      <div className={styles.calloutBody}>{children}</div>
    </aside>
  );
}
