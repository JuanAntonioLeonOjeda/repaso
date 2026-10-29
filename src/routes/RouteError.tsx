import type { ReactNode } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";

import { es } from "@/i18n/es";

import { NotFoundRoute } from "./NotFoundRoute";
import styles from "./Pages.module.css";

export function RouteError(): ReactNode {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundRoute />;
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className={styles.notFound} role="alert">
      <h1>{es.error.title}</h1>
      <pre>{message}</pre>
      <button
        type="button"
        onClick={() => {
          window.location.reload();
        }}
      >
        {es.error.reload}
      </button>
    </div>
  );
}
