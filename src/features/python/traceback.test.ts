import { describe, expect, it } from "vitest";

import { cleanTraceback, learnerLines } from "./traceback";

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

describe("learnerLines", () => {
  it("finds the failing line of the learner's code", () => {
    expect(learnerLines(RAW)).toEqual([3]);
  });

  it("follows the call chain and ignores the check's frames", () => {
    const raw = `Traceback (most recent call last):
  File "/lib/python314.zip/_pyodide/_base.py", line 597, in eval_code_async
    await CodeRunner(
  File "<check>", line 2, in <module>
    assert media([]) == 0
  File "<exec>", line 4, in media
    return total / len(xs)
ZeroDivisionError: division by zero`;
    expect(learnerLines(raw)).toEqual([4]);
  });

  it("reads syntax errors, which have no function name", () => {
    const raw = `Traceback (most recent call last):
  File "/lib/python314.zip/_pyodide/_base.py", line 597, in eval_code_async
  File "<exec>", line 2
    x = = 1
        ^
SyntaxError: invalid syntax`;
    expect(learnerLines(raw)).toEqual([2]);
  });

  it("lists each line once, outermost call first", () => {
    const raw = `  File "<exec>", line 9, in <module>
  File "<exec>", line 5, in f
  File "<exec>", line 5, in f
RecursionError: maximum recursion depth exceeded`;
    expect(learnerLines(raw)).toEqual([9, 5]);
  });
});
