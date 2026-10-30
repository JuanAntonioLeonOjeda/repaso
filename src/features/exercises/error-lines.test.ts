import { describe, expect, it } from "vitest";

import { validLines } from "./error-lines";

describe("validLines", () => {
  it("sorts, drops repeats and lines outside the document", () => {
    expect(validLines([9, 5, 5, 0, 2], 6)).toEqual([2, 5]);
  });
});
