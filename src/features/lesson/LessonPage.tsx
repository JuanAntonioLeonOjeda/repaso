import { MDXProvider } from "@mdx-js/react";
import { ArrowLeft, ArrowRight, Check, Clock, FileText } from "lucide-react";
import { Suspense, useEffect, type ReactNode } from "react";
import { Link } from "react-router";

import type { Lesson, Subject } from "@/content/types";
import { lessonExercisesDone, subjectColourStyle } from "@/features/catalog";
import { ExerciseScope } from "@/features/exercises";
import { lessonKey, progressStore, useProgress } from "@/features/progress";
import { es } from "@/i18n/es";

import { mdxComponents } from "./mdx-components";
import { Toc } from "./Toc";
import styles from "./Lesson.module.css";

interface Props {
  subject: Subject;
  lesson: Lesson;
  index: number;
}

const ARTICLE_ID = "leccion";

function LessonSidebar({ subject, current }: { subject: Subject; current: string }): ReactNode {
  const progress = useProgress();
  return (
    <nav className={styles.sidebar} aria-label={subject.title}>
      <Link to={`/${subject.slug}`} className={styles.sidebarSubject}>
        {subject.title}
      </Link>
      <ol>
        {subject.lessons.map((l, i) => {
          const isDone = progress.lessons[lessonKey(subject.slug, l.slug)] !== undefined;
          return (
            <li key={l.slug}>
              <Link
                to={`/${subject.slug}/${l.slug}`}
                aria-current={l.slug === current ? "page" : undefined}
              >
                <span className={styles.sidebarNumber} data-done={isDone}>
                  {isDone ? <Check size={12} aria-label={es.subject.completed} /> : i + 1}
                </span>
                {l.title}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function LessonFooter({ subject, lesson, index }: Props): ReactNode {
  const progress = useProgress();
  const key = lessonKey(subject.slug, lesson.slug);
  const isDone = progress.lessons[key] !== undefined;
  const previous = subject.lessons[index - 1];
  const next = subject.lessons[index + 1];
  return (
    <footer className={styles.lessonFooter}>
      <button
        type="button"
        className={styles.doneButton}
        data-done={isDone}
        aria-pressed={isDone}
        onClick={() => {
          progressStore.setLessonDone(key, !isDone);
        }}
      >
        <Check size={18} aria-hidden="true" />
        {isDone ? es.lesson.markUndone : es.lesson.markDone}
      </button>
      <div className={styles.pager}>
        {previous && (
          <Link to={`/${subject.slug}/${previous.slug}`} rel="prev">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>
              <small>{es.lesson.previous}</small>
              {previous.title}
            </span>
          </Link>
        )}
        {next && (
          <Link to={`/${subject.slug}/${next.slug}`} rel="next" className={styles.pagerNext}>
            <span>
              <small>{es.lesson.next}</small>
              {next.title}
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </footer>
  );
}

export function LessonPage({ subject, lesson, index }: Props): ReactNode {
  const progress = useProgress();
  const { Component: Content } = lesson;
  const solved = lessonExercisesDone(subject, lesson, progress);

  useEffect(() => {
    progressStore.visitLesson(lessonKey(subject.slug, lesson.slug));
    document.title = `${lesson.title} · ${subject.title} · ${es.app.name}`;
  }, [subject, lesson]);

  return (
    <div className={styles.page} style={subjectColourStyle(subject.slug)}>
      <LessonSidebar subject={subject} current={lesson.slug} />
      <div className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>
            <Link to={`/${subject.slug}`}>{subject.title}</Link>
            <span aria-hidden="true">/</span>
            <span>Lección {index + 1}</span>
          </p>
          <h1>{lesson.title}</h1>
          <p className={styles.summary}>{lesson.summary}</p>
          <div className={styles.meta}>
            <span>
              <Clock size={14} aria-hidden="true" />
              {es.subject.minutes(lesson.minutes)}
            </span>
            {lesson.exercises.length > 0 && (
              <span>{es.lesson.exercisesSolved(solved, lesson.exercises.length)}</span>
            )}
          </div>
          {lesson.sources.length > 0 && (
            <details className={styles.sources}>
              <summary>
                <FileText size={14} aria-hidden="true" />
                {es.lesson.sources}
              </summary>
              <ul>
                {lesson.sources.map((s) => (
                  <li key={s}>
                    <code>{s}</code>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </header>
        <Suspense fallback={<p className={styles.loading}>{es.lesson.loading}</p>}>
          <div className={styles.contentGrid}>
            <article id={ARTICLE_ID} className="prose">
              <ExerciseScope subject={subject.slug} lesson={lesson.slug}>
                <MDXProvider components={mdxComponents}>
                  <Content />
                </MDXProvider>
              </ExerciseScope>
            </article>
            <aside className={styles.tocColumn}>
              <Toc key={lesson.slug} articleId={ARTICLE_ID} />
            </aside>
          </div>
        </Suspense>
        <LessonFooter subject={subject} lesson={lesson} index={index} />
      </div>
    </div>
  );
}
