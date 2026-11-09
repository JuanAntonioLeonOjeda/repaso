import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { illustrations } from "@/features/illustrations";
import { resolveTemarioLink } from "@/features/lesson";
import { simulations } from "@/features/simulations";

import { sections, subjects, tutorials } from "./catalog";

const CONTENT_DIR = join(process.cwd(), "src", "content");

function exerciseIds(source: string): string[] {
  return [...source.matchAll(/<(?:Quiz|Predict|CodeExercise)\b[^>]*?\bid="([^"]+)"/gs)].map(
    (m) => m[1] ?? "",
  );
}

function mdxFiles(subject: string): string[] {
  return readdirSync(join(CONTENT_DIR, subject)).filter((f) => f.endsWith(".mdx"));
}

describe("content catalog", () => {
  it("has seven subjects with unique slugs", () => {
    expect(subjects).toHaveLength(7);
    expect(new Set(subjects.map((s) => s.slug)).size).toBe(7);
  });

  it("has the TFM and the tutorials as sections apart from the subjects", () => {
    expect(sections.map((s) => s.slug)).toEqual([
      ...subjects.map((s) => s.slug),
      "tfm",
      ...tutorials.map((s) => s.slug),
    ]);
    // FastAPI keeps its slug when it moves into the tutorials: stored progress depends on it.
    expect(tutorials.map((s) => s.slug)).toEqual([
      "vision",
      "texto",
      "generativa",
      "llm",
      "fastapi",
    ]);
  });

  for (const subject of sections) {
    describe(subject.title, () => {
      // Naming convention: lesson n lives in `NN-<slug>.mdx`, so order and slug stay in sync.
      const fileOf = (slug: string, i: number): string =>
        `${String(i + 1).padStart(2, "0")}-${slug}.mdx`;

      it("has one MDX file per lesson, named NN-<slug>.mdx", () => {
        const expected = subject.lessons.map((l, i) => fileOf(l.slug, i));
        expect(mdxFiles(subject.slug).sort()).toEqual(expected.sort());
      });

      for (const [i, lesson] of subject.lessons.entries()) {
        const file = fileOf(lesson.slug, i);
        let source = "";
        try {
          source = readFileSync(join(CONTENT_DIR, subject.slug, file), "utf8");
        } catch {
          // Reported by the file-name test above.
        }

        it(`${lesson.slug}: catalog exercise ids match the lesson`, () => {
          // Progress is counted from the catalog, so it must not drift from the MDX.
          expect(lesson.exercises).toEqual(exerciseIds(source));
          expect(new Set(lesson.exercises).size).toBe(lesson.exercises.length);
        });

        it(`${lesson.slug}: every simulation and diagram it uses exists`, () => {
          const used = [...source.matchAll(/<([A-Z][A-Za-z]+(?:Sim|Diagram))\b/g)].map(
            (m) => m[1] ?? "",
          );
          const known = new Set([...Object.keys(simulations), ...Object.keys(illustrations)]);
          expect(used.filter((name) => !known.has(name))).toEqual([]);
        });

        it(`${lesson.slug}: every "Del temario" link points to an existing lesson`, () => {
          const targets = [...source.matchAll(/\bto: "([^"]+)"/g)].map((m) => m[1] ?? "");
          expect(targets.filter((to) => resolveTemarioLink(to) === null)).toEqual([]);
        });

        it(`${lesson.slug}: every code exercise has a solution and a way to check it`, () => {
          const blocks = source.match(/<CodeExercise\b.*?<\/CodeExercise>/gs) ?? [];
          for (const block of blocks) {
            expect(block).toMatch(/solution=\{`/);
            expect(block).toMatch(/(check|expectedOutput)=\{`/);
          }
        });
      }
    });
  }
});
