import type { ReactNode } from "react";
import { Link } from "react-router";

import { es } from "@/i18n/es";

import styles from "./Pages.module.css";

export function NotFoundRoute({ message }: { message?: string }): ReactNode {
  return (
    <div className={styles.notFound}>
      <h1>{es.notFound.title}</h1>
      {message !== undefined && <p>{message}</p>}
      <Link to="/">{es.notFound.back}</Link>
    </div>
  );
}
