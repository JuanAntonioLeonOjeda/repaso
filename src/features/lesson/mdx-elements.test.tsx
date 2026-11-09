import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LessonImage, LessonLink, withBase } from "./mdx-elements";

describe("lesson links and images", () => {
  it("resolves root-relative paths against the base (/ in tests)", () => {
    expect(withBase("/tutorials/vision/errores.png")).toBe("/tutorials/vision/errores.png");
    expect(withBase("https://example.com/x.png")).toBe("https://example.com/x.png");
  });

  it("routes internal links through the router and leaves external ones alone", () => {
    render(
      <MemoryRouter basename="/repaso" initialEntries={["/repaso/fastapi"]}>
        <LessonLink href="/tfm/despliegue">TFM</LessonLink>
        <LessonLink href="https://fastapi.tiangolo.com">docs</LessonLink>
      </MemoryRouter>,
    );
    // Through the router, the basename is kept: the link works under /repaso/ on GitHub Pages.
    expect(screen.getByRole("link", { name: "TFM" })).toHaveAttribute(
      "href",
      "/repaso/tfm/despliegue",
    );
    expect(screen.getByRole("link", { name: "docs" })).toHaveAttribute(
      "href",
      "https://fastapi.tiangolo.com",
    );
  });

  it("keeps the alt text of lesson images", () => {
    render(<LessonImage src="/a.png" alt="Una figura" />);
    expect(screen.getByRole("img", { name: "Una figura" })).toHaveAttribute("src", "/a.png");
  });
});
