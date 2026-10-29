import type { MDXComponents } from "mdx/types";

import { CodeExercise, Predict, Quiz, RunCode } from "@/features/exercises";
import { illustrations } from "@/features/illustrations";
import { simulations } from "@/features/simulations";
import { Callout, Figure } from "@/features/ui";

/**
 * Everything a lesson can use without importing it. Authoring rules for these live in
 * `.claude/rules/content-authoring.md`.
 */
export const mdxComponents: MDXComponents = {
  Callout,
  Figure,
  Quiz,
  Predict,
  CodeExercise,
  RunCode,
  ...illustrations,
  ...simulations,
};
