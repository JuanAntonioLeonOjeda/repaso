import type { MDXComponents } from "mdx/types";

import { CodeExercise, Predict, Quiz, RunCode } from "@/features/exercises";
import { illustrations } from "@/features/illustrations";
import { simulations } from "@/features/simulations";
import { ExperimentPlots, ExperimentTable, LocalImage } from "@/features/tfm";
import { Callout, Figure } from "@/features/ui";

import { LessonImage, LessonLink } from "./mdx-elements";
import { Temario } from "./Temario";

/**
 * Everything a lesson can use without importing it. Authoring rules for these live in
 * `.claude/rules/content-authoring.md`.
 */
export const mdxComponents: MDXComponents = {
  a: LessonLink,
  img: LessonImage,
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
