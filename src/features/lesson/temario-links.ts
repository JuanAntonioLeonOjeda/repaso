import { sections } from "@/content/catalog";

export interface TemarioLink {
  /** "subject/lesson", e.g. "deep-learning/augmentation-y-transfer-learning". */
  to: string;
  /** What of that lesson is used here. */
  why: string;
}

/** Resolves against every section, so a tutorial can also point at the TFM or another tutorial. */
export function resolveTemarioLink(to: string): { subject: string; lesson: string } | null {
  const [subjectSlug, lessonSlug] = to.split("/");
  const subject = sections.find((s) => s.slug === subjectSlug);
  const lesson = subject?.lessons.find((l) => l.slug === lessonSlug);
  return subject && lesson ? { subject: subject.title, lesson: lesson.title } : null;
}
