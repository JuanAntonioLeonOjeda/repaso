import { ArrowRight } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";

import { subjects, tfm, tutorials } from "@/content/catalog";
import type { Subject } from "@/content/types";
import {
  ProgressRing,
  resolveLessonKey,
  SubjectIcon,
  subjectColourStyle,
  subjectProgress,
} from "@/features/catalog";
import { useProgress, type Progress } from "@/features/progress";
import { es } from "@/i18n/es";

import styles from "./Pages.module.css";

function SubjectGrid({
  items,
  progress,
}: {
  items: readonly Subject[];
  progress: Progress;
}): ReactNode {
  return (
    <ul className={styles.subjectGrid}>
      {items.map((subject) => {
        const p = subjectProgress(subject, progress);
        return (
          <li key={subject.slug} style={subjectColourStyle(subject.slug)}>
            <Link to={`/${subject.slug}`} className={styles.subjectCard}>
              <span className={styles.subjectIcon}>
                <SubjectIcon slug={subject.slug} />
              </span>
              <span className={styles.subjectCode}>{subject.code}</span>
              <span className={styles.subjectTitle}>{subject.title}</span>
              <span className={styles.subjectTagline}>{subject.tagline}</span>
              <span className={styles.subjectFoot}>
                <span>{es.home.lessons(subject.lessons.length)}</span>
                <ProgressRing
                  value={p.lessonsDone}
                  total={p.lessonsTotal}
                  size={40}
                  label={es.home.progress(p.lessonsDone, p.lessonsTotal)}
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function HomeRoute(): ReactNode {
  const progress = useProgress();
  const last = resolveLessonKey(progress.lastLesson);

  useEffect(() => {
    document.title = es.app.name;
  }, []);

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          <span>{es.home.title}</span>
        </h1>
        <p className={styles.heroLead}>{es.home.lead}</p>
        {last && (
          <Link
            to={`/${last.subject.slug}/${last.lesson.slug}`}
            className={styles.continue}
            style={subjectColourStyle(last.subject.slug)}
          >
            <span>
              <small>{es.home.continueLabel}</small>
              {last.lesson.title}
              <em>{last.subject.title}</em>
            </span>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        )}
      </section>

      <section aria-labelledby="asignaturas">
        <h2 id="asignaturas" className={styles.sectionTitle}>
          {es.home.subjectsHeading}
        </h2>
        <SubjectGrid items={subjects} progress={progress} />
      </section>

      <section aria-labelledby="tfm" style={subjectColourStyle(tfm.slug)}>
        <h2 id="tfm" className={styles.sectionTitle}>
          {es.home.tfmHeading}
        </h2>
        <Link to={`/${tfm.slug}`} className={styles.tfmCard}>
          <span className={styles.subjectIcon}>
            <SubjectIcon slug={tfm.slug} size={64} />
          </span>
          <span className={styles.tfmText}>
            <span className={styles.subjectTitle}>{tfm.title}</span>
            <span className={styles.subjectTagline}>{tfm.tagline}</span>
          </span>
          <span className={styles.tfmMeta}>
            {es.home.lessons(tfm.lessons.length)}
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </Link>
      </section>

      <section aria-labelledby="tutoriales">
        <h2 id="tutoriales" className={styles.sectionTitle}>
          {es.home.tutorialsHeading}
        </h2>
        <p className={styles.sectionLead}>{es.home.tutorialsLead}</p>
        <SubjectGrid items={tutorials} progress={progress} />
      </section>

      <section aria-labelledby="como" className={styles.how}>
        <h2 id="como" className={styles.sectionTitle}>
          {es.home.howTitle}
        </h2>
        <ul>
          {es.home.howItems.map((item, i) => (
            <li key={item.title} data-kind={i === 2 ? "task" : undefined}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
