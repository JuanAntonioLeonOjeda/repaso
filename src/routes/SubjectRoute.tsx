import { Check, Clock } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link, useParams } from "react-router";

import {
  findSubject,
  lessonExercisesDone,
  ProgressRing,
  SubjectIcon,
  subjectColourStyle,
  subjectProgress,
} from "@/features/catalog";
import { lessonKey, useProgress } from "@/features/progress";
import { es } from "@/i18n/es";

import { NotFoundRoute } from "./NotFoundRoute";
import styles from "./Pages.module.css";

export function SubjectRoute(): ReactNode {
  const { subject: slug } = useParams();
  const subject = findSubject(slug);
  const progress = useProgress();

  useEffect(() => {
    if (subject) document.title = `${subject.title} · ${es.app.name}`;
  }, [subject]);

  if (subject === undefined) return <NotFoundRoute message={es.subject.notFound} />;
  const p = subjectProgress(subject, progress);

  return (
    <div className={styles.subjectPage} style={subjectColourStyle(subject.slug)}>
      <header className={styles.subjectHeader}>
        <span className={styles.subjectHeaderIcon}>
          <SubjectIcon slug={subject.slug} size={72} />
        </span>
        <div>
          <p className={styles.subjectCode}>{subject.code}</p>
          <h1>{subject.title}</h1>
          <p className={styles.heroLead}>{subject.tagline}</p>
        </div>
        <ProgressRing
          value={p.lessonsDone}
          total={p.lessonsTotal}
          size={72}
          label={es.home.progress(p.lessonsDone, p.lessonsTotal)}
        />
      </header>

      <h2 className={styles.sectionTitle}>{es.subject.lessonsHeading}</h2>
      <ol className={styles.lessonList}>
        {subject.lessons.map((lesson, i) => {
          const isDone = progress.lessons[lessonKey(subject.slug, lesson.slug)] !== undefined;
          const solved = lessonExercisesDone(subject, lesson, progress);
          return (
            <li key={lesson.slug}>
              <Link to={`/${subject.slug}/${lesson.slug}`} className={styles.lessonItem}>
                <span className={styles.lessonNumber} data-done={isDone}>
                  {isDone ? <Check size={16} aria-label={es.subject.completed} /> : i + 1}
                </span>
                <span className={styles.lessonText}>
                  <strong>{lesson.title}</strong>
                  <span>{lesson.summary}</span>
                </span>
                <span className={styles.lessonMeta}>
                  <span>
                    <Clock size={13} aria-hidden="true" /> {es.subject.minutes(lesson.minutes)}
                  </span>
                  {lesson.exercises.length > 0 && (
                    <span className={styles.lessonExercises}>
                      {solved}/{lesson.exercises.length} ejercicios
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
