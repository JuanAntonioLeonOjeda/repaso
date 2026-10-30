import { sections } from "@/content/catalog";
import type { Lesson, Subject } from "@/content/types";
import { exerciseKey, lessonKey, type Progress } from "@/features/progress";

export function findSubject(slug: string | undefined): Subject | undefined {
  return sections.find((s) => s.slug === slug);
}

export function findLesson(
  subject: Subject,
  slug: string | undefined,
): { lesson: Lesson; index: number } | undefined {
  const index = subject.lessons.findIndex((l) => l.slug === slug);
  const lesson = subject.lessons[index];
  return lesson === undefined ? undefined : { lesson, index };
}

export interface SubjectProgress {
  lessonsDone: number;
  lessonsTotal: number;
  exercisesDone: number;
  exercisesTotal: number;
}

export function subjectProgress(subject: Subject, progress: Progress): SubjectProgress {
  let exercisesDone = 0;
  let exercisesTotal = 0;
  let lessonsDone = 0;
  for (const lesson of subject.lessons) {
    if (progress.lessons[lessonKey(subject.slug, lesson.slug)] !== undefined) lessonsDone++;
    for (const id of lesson.exercises) {
      exercisesTotal++;
      if (progress.exercises[exerciseKey(subject.slug, lesson.slug, id)] !== undefined) {
        exercisesDone++;
      }
    }
  }
  return { lessonsDone, lessonsTotal: subject.lessons.length, exercisesDone, exercisesTotal };
}

export function lessonExercisesDone(subject: Subject, lesson: Lesson, progress: Progress): number {
  return lesson.exercises.filter(
    (id) => progress.exercises[exerciseKey(subject.slug, lesson.slug, id)] !== undefined,
  ).length;
}

/** "subject/lesson" back into the objects, for the "continue" link on the home page. */
export function resolveLessonKey(key: string | null): { subject: Subject; lesson: Lesson } | null {
  if (key === null) return null;
  const [subjectSlug, lessonSlug] = key.split("/");
  const subject = findSubject(subjectSlug);
  const found = subject === undefined ? undefined : findLesson(subject, lessonSlug);
  return subject === undefined || found === undefined ? null : { subject, lesson: found.lesson };
}

/** The inline style that gives a page its subject's colour. */
export function subjectColourStyle(slug: string): Record<string, string> {
  return {
    "--subject-color": `var(--subject-${slug})`,
    "--subject-soft": `var(--subject-${slug}-soft)`,
  };
}
