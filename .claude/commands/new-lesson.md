---
description: Write a new lesson (or rewrite one) from the course material, following the authoring rules, and verify its exercises
argument-hint: <subject-slug> <topic>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# New lesson: $ARGUMENTS

Follow `.claude/rules/content-authoring.md`.

1. Find the source material for the topic in `Asignaturas/<subject>/` (slides, notebooks).
   Extract the text (pypdf for PDFs, the JSON cells for notebooks) into the scratchpad, not
   into the repo. List what the material covers and what is worth keeping.
2. Propose to the author, in Spanish and briefly: the lesson outline (`##` sections), which
   simulations it will use (existing ones in `src/features/simulations/registry.tsx`, or a new
   one, explained in one line), and the exercises. **Wait for confirmation** if the lesson is
   new; go ahead if it is a rewrite the author asked for.
3. Write `src/content/<subject>/NN-<slug>.mdx` and add the lesson to
   `src/content/<subject>/index.ts` (with `sources` and `exercises` in order).
4. If a new simulation is needed, follow `.claude/rules/simulations.md` and add its algorithm
   to `algorithms.test.ts`.
5. Verify: `python scripts/check_exercises.py <subject>/<NN>`, `pnpm lint`, `pnpm typecheck`,
   `pnpm test`, `pnpm build`. Recompute every number in the text.
6. Run the `content-reviewer` agent and fix or explicitly accept its findings.
7. Rebuild the Docker image and give the author the URL of the lesson.
