import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { es } from "@/i18n/es";

import styles from "./Lesson.module.css";
import { resolveTemarioLink, type TemarioLink } from "./temario-links";

/** "Del temario": where in the subjects each idea of a TFM or tutorial step was studied. */
export function Temario({ links }: { links: readonly TemarioLink[] }): ReactNode {
  return (
    <aside className={styles.temario} aria-label={es.temario.label}>
      <p className={styles.temarioTitle}>
        <GraduationCap size={18} aria-hidden="true" />
        {es.temario.title}
      </p>
      <ul>
        {links.map((link) => {
          const target = resolveTemarioLink(link.to);
          return (
            <li key={link.to}>
              {target ? (
                <Link to={`/${link.to}`}>
                  <span>{target.subject}</span> · {target.lesson}
                </Link>
              ) : (
                <span>{link.to}</span>
              )}
              <p>{link.why}</p>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
