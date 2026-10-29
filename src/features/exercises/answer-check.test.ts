import { describe, expect, it } from "vitest";

import { isCorrectAnswer, normaliseAnswer, sameOutput } from "./answer-check";
import { dedent } from "./dedent";

describe("isCorrectAnswer", () => {
  it("accepts a decimal comma and tolerance for numbers", () => {
    expect(isCorrectAnswer("0,357", { accepted: ["0.357"], tolerance: 0.005 })).toBe(true);
    expect(isCorrectAnswer("0.36", { accepted: ["0.357"], tolerance: 0.005 })).toBe(true);
    expect(isCorrectAnswer("0.4", { accepted: ["0.357"], tolerance: 0.005 })).toBe(false);
  });

  it("compares numbers exactly when there is no tolerance", () => {
    expect(isCorrectAnswer("45", { accepted: ["45"] })).toBe(true);
    expect(isCorrectAnswer("45.0", { accepted: ["45"] })).toBe(true);
    expect(isCorrectAnswer("46", { accepted: ["45"] })).toBe(false);
  });

  it("ignores case, quotes and spacing in text answers", () => {
    expect(isCorrectAnswer("( 150 , 4 )", { accepted: ["(150, 4)"] })).toBe(true);
    expect(isCorrectAnswer("'Reina'", { accepted: ["reina"] })).toBe(true);
  });

  it("accepts any of several answers", () => {
    expect(isCorrectAnswer("80%", { accepted: ["0.8", "80%"] })).toBe(true);
  });
});

describe("normaliseAnswer", () => {
  it("collapses whitespace around punctuation", () => {
    expect(normaliseAnswer("  O( n ^2 ) ")).toBe("o(n ^2)");
  });
});

describe("sameOutput", () => {
  it("ignores trailing spaces and surrounding blank lines", () => {
    expect(sameOutput("a  \nb\n\n", "a\nb")).toBe(true);
    expect(sameOutput("a\nc", "a\nb")).toBe(false);
  });
});

describe("dedent", () => {
  it("removes the first newline and the common indentation", () => {
    expect(dedent("\n    x = 1\n      y = 2\n  ")).toBe("x = 1\n  y = 2");
  });
});
