import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Outlet, ScrollRestoration } from "react-router";

import { es } from "@/i18n/es";

import { setTheme, useTheme } from "./theme";
import styles from "./Shell.module.css";

function ThemeButton(): ReactNode {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? es.shell.themeToLight : es.shell.themeToDark;
  return (
    <button
      type="button"
      className={styles.iconButton}
      onClick={() => {
        setTheme(next);
      }}
      aria-label={label}
      title={label}
    >
      {next === "light" ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}

export function RootLayout(): ReactNode {
  return (
    <>
      <a href="#contenido" className={styles.skip}>
        {es.app.skipToContent}
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          {es.app.name}
        </Link>
        <nav className={styles.nav} aria-label="Principal">
          <Link to="/">{es.shell.home}</Link>
          <ThemeButton />
        </nav>
      </header>
      <main id="contenido" className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>{es.shell.footer}</footer>
      <ScrollRestoration />
    </>
  );
}
