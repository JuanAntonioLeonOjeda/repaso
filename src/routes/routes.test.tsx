import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { subjects } from "@/content/catalog";

import { routes } from "./routes";

function renderAt(path: string): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

describe("routes", () => {
  it("home lists every subject", () => {
    renderAt("/");
    for (const subject of subjects) {
      expect(screen.getByRole("link", { name: new RegExp(subject.title) })).toBeInTheDocument();
    }
  });

  it("a subject page lists its lessons in order", () => {
    renderAt("/refuerzo");
    expect(
      screen.getByRole("heading", { level: 1, name: "Aprendizaje por refuerzo" }),
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Qué es el aprendizaje por refuerzo");
  });

  it("an unknown subject shows the not-found page", () => {
    renderAt("/no-existe");
    expect(screen.getByRole("heading", { name: "Página no encontrada" })).toBeInTheDocument();
  });
});
