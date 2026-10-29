import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource-variable/jetbrains-mono";
import "katex/dist/katex.min.css";
import "@/design/tokens.css";
import "@/design/base.css";
import "@/design/prose.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { routes } from "@/routes/routes";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("index.html has no #root element");
}

// A data router is created once, outside React: it must not live in component state.
const router = createBrowserRouter(routes);

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
