import { useEffect, useState, type ReactNode } from "react";

import { es } from "@/i18n/es";

import styles from "./Lesson.module.css";

interface Heading {
  id: string;
  text: string;
}

/**
 * Table of contents read from the rendered article (the h2 ids come from rehype-slug).
 * It mounts inside the same Suspense boundary as the lesson, so the article is in the
 * DOM when this effect runs; reading the DOM is the effect's job, not derived state.
 */
export function Toc({ articleId }: { articleId: string }): ReactNode {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (article === null) return;
    const nodes = Array.from(article.querySelectorAll<HTMLHeadingElement>(":scope > h2[id]"));
    // Syncing from the DOM, which React does not own here (the MDX headings), is what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one update after the article mounts
    setHeadings(nodes.map((n) => ({ id: n.id, text: n.textContent })));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    nodes.forEach((n) => {
      observer.observe(n);
    });
    return () => {
      observer.disconnect();
    };
  }, [articleId]);

  if (headings.length === 0) return null;
  return (
    <nav className={styles.toc} aria-label={es.lesson.onThisPage}>
      <p className={styles.tocTitle}>{es.lesson.onThisPage}</p>
      <ol>
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} aria-current={active === h.id ? "location" : undefined}>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
