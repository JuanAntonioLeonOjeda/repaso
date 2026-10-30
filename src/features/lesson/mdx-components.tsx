import type { MDXComponents } from "mdx/types";

import { CodeExercise, Predict, Quiz, RunCode } from "@/features/exercises";
import { illustrations } from "@/features/illustrations";
import { simulations } from "@/features/simulations";
import { ExperimentPlots, ExperimentTable, LocalImage, Temario } from "@/features/tfm";
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
  Temario,
  ExperimentTable,
  ExperimentPlots,
  LocalImage,
  ...illustrations,
  ...simulations,
};
