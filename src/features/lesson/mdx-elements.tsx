import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router";

/** Root-relative paths ("/datasets/x.csv") resolved against Vite's base ("/" or "/repaso/"). */
export function withBase(path: string): string {
  return path.startsWith("/") ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
}

/**
 * Markdown links in lessons. Internal ones ("/tfm/despliegue") go through the router, so they
 * keep the base path on GitHub Pages and do not reload the page; external ones open as usual.
 */
export function LessonLink({ href, children, ...rest }: ComponentPropsWithoutRef<"a">): ReactNode {
  if (href?.startsWith("/") === true && !href.startsWith("//")) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

/** Markdown images in lessons: files in public/ are referenced from the root. */
export function LessonImage({ src, alt, ...rest }: ComponentPropsWithoutRef<"img">): ReactNode {
  return (
    <img
      src={typeof src === "string" ? withBase(src) : src}
      alt={alt ?? ""}
      loading="lazy"
      {...rest}
    />
  );
}
