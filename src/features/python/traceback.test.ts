import { describe, expect, it } from "vitest";

import { cleanTraceback } from "./traceback";

const RAW = `Traceback (most recent call last):
  File "/lib/python314.zip/_pyodide/_base.py", line 597, in eval_code_async
    await CodeRunner(
  File "<exec>", line 3, in <module>
    x = 1 / 0
ZeroDivisionError: division by zero`;

describe("cleanTraceback", () => {
  it("keeps the learner's frames and the final error, drops Pyodide's", () => {
    const { message, traceback } = cleanTraceback(RAW);
    expect(message).toBe("ZeroDivisionError: division by zero");
    expect(traceback).toContain("Tu código, line 3");
    expect(traceback).toContain("x = 1 / 0");
    expect(traceback).not.toContain("_pyodide");
    expect(traceback).not.toContain("CodeRunner");
  });
});
