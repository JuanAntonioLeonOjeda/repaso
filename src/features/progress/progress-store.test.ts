import { describe, expect, it } from "vitest";

import { exerciseKey, lessonKey, parseProgress } from "./progress-store";

describe("parseProgress", () => {
  it("returns empty progress for missing or corrupt storage", () => {
    expect(parseProgress(null)).toEqual({ lessons: {}, exercises: {}, lastLesson: null });
    expect(parseProgress("{not json")).toEqual({ lessons: {}, exercises: {}, lastLesson: null });
    expect(parseProgress("42")).toEqual({ lessons: {}, exercises: {}, lastLesson: null });
  });

  it("drops fields with the wrong shape and keeps the rest", () => {
    const raw = JSON.stringify({
      lessons: { "a/b": "2026-01-01" },
      exercises: { x: 3 },
      lastLesson: "a/b",
    });
    expect(parseProgress(raw)).toEqual({
      lessons: { "a/b": "2026-01-01" },
      exercises: {},
      lastLesson: "a/b",
    });
  });
});

describe("keys", () => {
  it("builds lesson and exercise keys", () => {
    expect(lessonKey("refuerzo", "dqn")).toBe("refuerzo/dqn");
    expect(exerciseKey("refuerzo", "dqn", "td-targets")).toBe("refuerzo/dqn#td-targets");
  });
});
