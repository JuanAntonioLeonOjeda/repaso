/**
 * Comparison of typed answers ("¿Qué sale?") with the expected ones. Forgiving about
 * what does not matter (case, spacing, decimal comma, quotes, trailing zeros) and strict
 * about what does (the value).
 */

export function normaliseAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/["'`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([,;:()[\]{}=])\s*/g, "$1");
}

function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(",", ".").replace(/%$/, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export interface AnswerSpec {
  /** Accepted answers; any of them is correct. */
  accepted: readonly string[];
  /** Absolute tolerance when both the answer and an accepted value are numbers. */
  tolerance?: number | undefined;
}

export function isCorrectAnswer(given: string, { accepted, tolerance = 0 }: AnswerSpec): boolean {
  const givenNumber = parseNumber(given);
  const normalised = normaliseAnswer(given);
  return accepted.some((answer) => {
    const expectedNumber = parseNumber(answer);
    if (givenNumber !== null && expectedNumber !== null) {
      return Math.abs(givenNumber - expectedNumber) <= tolerance + 1e-9;
    }
    return normaliseAnswer(answer) === normalised;
  });
}

/** Output comparison for code exercises checked by what they print. */
export function sameOutput(actual: string, expected: string): boolean {
  const lines = (text: string): string[] =>
    text
      .trim()
      .split("\n")
      .map((line) => line.trimEnd());
  return lines(actual).join("\n") === lines(expected).join("\n");
}
