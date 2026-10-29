---
description: Atomic functions and the practical SOLID that applies to this React project.
---

# Atomic functions and SOLID

- A function or component does **one** thing. If its description needs an "and", split it.
- Algorithms (k-means step, Q-learning update, fuzzy inference…) are pure functions with
  hand-checkable inputs and outputs; components stay thin and only draw.
- Past ~25 lines or 2–3 levels of nesting in a function, extract named sub-functions. More than
  3 positional parameters → an options object.
- Open/closed: a new simulation, lesson or callout kind is a new entry in a registry or table,
  not another `if` in a component.
- Over-engineering is as costly as messy code: no abstraction for a single use.
