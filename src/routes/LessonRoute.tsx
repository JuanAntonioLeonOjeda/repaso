import type { ReactNode } from "react";
import { useParams } from "react-router";

import { findLesson, findSubject } from "@/features/catalog";
import { LessonPage } from "@/features/lesson";
import { es } from "@/i18n/es";

import { NotFoundRoute } from "./NotFoundRoute";

export function LessonRoute(): ReactNode {
  const params = useParams();
  const subject = findSubject(params.subject);
  const found = subject === undefined ? undefined : findLesson(subject, params.lesson);
  if (subject === undefined || found === undefined) {
    return <NotFoundRoute message={es.lesson.notFound} />;
  }
  // Keyed by lesson so state inside (exercises, sims) resets when navigating between lessons.
  return (
    <LessonPage
      key={`${subject.slug}/${found.lesson.slug}`}
      subject={subject}
      lesson={found.lesson}
      index={found.index}
    />
  );
}
