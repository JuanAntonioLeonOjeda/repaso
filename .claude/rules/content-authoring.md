---
paths:
  - "src/content/**"
description: How lessons are written — tone, structure, the components available, exercise rules and how to verify them.
---

# Writing a lesson

## Tone

- Spanish, close and direct ("tú"), like a colleague explaining at a whiteboard. Short
  paragraphs. No academic padding ("cabe destacar", "en el presente tema").
- Start from **why it matters**, then the idea, then the maths (only what helps), then how it
  is done at work.
- Summarise the course material in your own words. Do not copy slides or notebooks verbatim;
  quote at most a short phrase.

## Structure

1. One opening paragraph: the problem this lesson solves.
2. `##` sections (they feed the table of contents). Keep `##` titles short.
3. At least one `<Callout kind="real">` (how it is done at work) per lesson.
4. A `<Callout kind="practice">` when the course notebooks cover the topic, naming the file.
5. Exercises spread through the lesson, right after the idea they practise.
6. Close with `## Para llevar`: 3–6 bullets.

## Components (no imports needed)

| Component                                                          | Use                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `<Callout kind="real \| warn \| idea \| practice \| note" title?>` | side notes with a fixed meaning                                        |
| `<Figure caption>`                                                 | wraps an inline SVG                                                    |
| `<Quiz id options answer explanation hints?>`                      | multiple choice; `answer` is the index                                 |
| `<Predict id answer tolerance? explanation hints?>`                | "work it out and type the result"                                      |
| `<CodeExercise id title starter solution hints check files?>`      | fill-the-gaps Python, checked by `check` asserts (or `expectedOutput`) |
| `<RunCode title code files?>`                                      | editable runnable example, nothing to solve                            |
| `<Temario links={[{ to: "subject/lesson", why }]} />`              | "Del temario" box (TFM, tutorials); links checked by the content tests |
| `<XxxSim />`                                                       | a simulation from `features/simulations/registry.tsx`                  |
| `<XxxDiagram />`                                                   | an illustration from `features/illustrations/index.ts`                 |

## Exercise rules

- `id` is unique in the lesson and **listed in the lesson's `exercises` in
  `content/<subject>/index.ts`** in the same order (a test enforces it).
- Every exercise has hints (progressive: the last one nearly gives it away) and an explanation
  or solution. `starter` marks gaps with `___`.
- `check` asserts with a message in Spanish that says what was expected, so a failure teaches
  something. Test edge cases, not only the happy path.
- Only packages available in Pyodide; datasets from `public/datasets/` via `files`.
- Inside the template literals: no backticks and no `${`; write `\\n` for a newline inside a
  Python string.
- **Run `python scripts/check_exercises.py <subject>/<NN>` before finishing.** Numbers in
  `Predict` and in prose must be recomputed, not estimated.

## MDX pitfalls

- `<` and `{` in plain text start JSX: write them inside `code` or `$math$`.
- Inline math `$…$`, block math `$$…$$` (KaTeX). Use `{,}` for a decimal comma in maths.
- File name `NN-<slug>.mdx` must match the lesson order and slug (a test enforces it).

Review with the `content-reviewer` agent.
