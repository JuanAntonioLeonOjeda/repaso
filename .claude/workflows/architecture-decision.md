---
name: architecture-decision
description: When an Architecture Decision Record is needed and how to write it. Use it when a plan, review or /defend reveals a decision, or via /new-adr.
---

# Architecture decisions (ADRs)

ADRs live in `docs/adr/` (index in `docs/adr/README.md`, template in `docs/adr/template.md`).
They are short and honest: context, options with verifiable pros and cons, the decision and
why, consequences.

## When an ADR is needed

Write one when a choice:

- is hard to reverse later (where progress is stored, how Python runs),
- has a real alternative someone might prefer (a backend, a hosted notebook service),
- or changes something the author notices (offline use, privacy).

Not for: naming, folder tweaks, a library patch version.

## How

1. Explain the problem and list options with verifiable pros/cons (mark unverified claims).
2. The author decides and states why; if they delegated, write it as **Proposed** with the
   recommendation and the reasoning, and tell them to read it.
3. Status: `Proposed` → `Accepted`. Never rewrite an accepted ADR's decision: supersede it.

Shortcut: `/new-adr <title>`.
