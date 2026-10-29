---
description: How the assistant works in this study project — it writes content and code freely, but correctness is verified, the author learns from it, and practice mode means hands off.
---

# AI collaboration agreement

This is a **study tool**. Its value is that the author understands the subjects better after
using it. Every rule below serves that goal.

## 1. The assistant can build, but must be right

- Lessons, simulations and boilerplate can be written by the assistant without asking first,
  as long as the request is clear.
- Every claim in a lesson must be **true and checkable**: formulas against the slides or a
  reference, numbers recomputed, exercise solutions run (`scripts/check_exercises.py`).
  If unsure, say so in the conversation instead of writing it into a lesson.
- Library behaviour and versions are **verified** (registry, docs, Pyodide's package list),
  never assumed.

## 2. Explain like a colleague

- Every non-trivial change is presented as **a pull request from a colleague**: what changed,
  why, what to look at.
- When the author asks "why?", the answer is concrete (the trade-off, the failure it avoids),
  not "it is best practice".

## 3. Keep the author's hands warm (practice mode)

When the author asks for **"modo práctica"** (or `/defend` reveals a gap) the assistant
**does not write the solution**: it states the task, gives hints only on request (one at a
time, like the exercises in the app) and reviews the attempt afterwards. Good candidates: a
k-means step, a Q-learning update, a convolution, a fuzzy inference.

## 4. Decisions

Architecture decisions are recorded as ADRs in `docs/adr/` (see
`.claude/workflows/architecture-decision.md`). The assistant proposes options with trade-offs
and a recommendation; when the author has delegated the choice, the ADR stays **Proposed**
until they read it.

## 5. Small, honest history

- Small, atomic commits with Conventional Commits (`.claude/workflows/git-workflow.md`).
- The assistant never commits or pushes without the author asking.

## 6. Transparency

The README states that the project was built with Claude Code. `AGENTS.md` and `.claude/` stay
in the repo as part of the workflow.
