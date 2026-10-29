import type { RouteObject } from "react-router";

import { RootLayout } from "@/features/shell";

import { HomeRoute } from "./HomeRoute";
import { LessonRoute } from "./LessonRoute";
import { NotFoundRoute } from "./NotFoundRoute";
import { RouteError } from "./RouteError";
import { SubjectRoute } from "./SubjectRoute";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: ":subject", element: <SubjectRoute /> },
      { path: ":subject/:lesson", element: <LessonRoute />, errorElement: <RouteError /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
];
