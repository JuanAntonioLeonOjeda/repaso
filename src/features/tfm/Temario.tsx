import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { subjects } from "@/content/catalog";

import styles from "./Tfm.module.css";

export interface TemarioLink {
  /** "subject/lesson", e.g. "deep-learning/augmentation-y-transfer-learning". */
  to: string;
  /** What of that lesson is used here. */
  why: string;
}

export function resolveTemarioLink(to: string): { subject: string; lesson: string } | null {
  const [subjectSlug, lessonSlug] = to.split("/");
  const subject = subjects.find((s) => s.slug === subjectSlug);
  const lesson = subject?.lessons.find((l) => l.slug === lessonSlug);
  return subject && lesson ? { subject: subject.title, lesson: lesson.title } : null;
}

/** "Del temario": where in the subjects each idea of this TFM step was studied. */
export function Temario({ links }: { links: readonly TemarioLink[] }): ReactNode {
  return (
    <aside className={styles.temario} aria-label="Relación con el temario">
      <p className={styles.temarioTitle}>
        <GraduationCap size={18} aria-hidden="true" />
        Del temario
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
