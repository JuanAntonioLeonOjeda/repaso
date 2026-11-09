import type { MDXContent } from "mdx/types";
import type { ComponentType } from "react";

export type SubjectSlug =
  | "python"
  | "supervisado"
  | "no-supervisado"
  | "deep-learning"
  | "refuerzo"
  | "optimizacion"
  | "razonamiento"
  | "tfm"
  | "vision"
  | "texto"
  | "fastapi";

export interface Lesson {
  slug: string;
  title: string;
  /** One line shown in lists: what you will understand after reading it. */
  summary: string;
  minutes: number;
  /** Files of the original course material this lesson summarises. */
  sources: readonly string[];
  /** Exercise ids in the lesson, so progress can be counted without loading it. */
  exercises: readonly string[];
  load: () => Promise<{ default: MDXContent }>;
  /** `load` wrapped in React.lazy once, at definition time (see `defineLesson`). */
  Component: ComponentType;
}

export interface Subject {
  slug: SubjectSlug;
  title: string;
  /** Short, plain-language pitch shown on the home page. */
  tagline: string;
  /** Course code in the master, as it appears in the material. */
  code: string;
  lessons: readonly Lesson[];
}
