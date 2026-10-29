import { lazy } from "react";

import type { Lesson } from "./types";

/**
 * Builds a catalog entry. The lazy component is created here, once per lesson, so each
 * lesson is its own chunk and revisiting it does not suspend again.
 */
export function defineLesson(lesson: Omit<Lesson, "Component">): Lesson {
  return { ...lesson, Component: lazy(lesson.load) };
}
