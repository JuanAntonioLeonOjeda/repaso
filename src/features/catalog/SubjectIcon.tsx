import type { ReactNode } from "react";

import type { SubjectSlug } from "@/content/types";

/**
 * One small drawing per subject, made of what the subject is about (labelled points,
 * clusters, a layer of neurons, an agent loop, a descent path, a membership curve).
 */
export function SubjectIcon({ slug, size = 56 }: { slug: SubjectSlug; size?: number }): ReactNode {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 56 56",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (slug) {
    case "supervisado":
      return (
        <svg {...common}>
          <path d="M6 48 L50 10" strokeDasharray="4 4" />
          <circle cx="14" cy="20" r="4" />
          <circle cx="22" cy="12" r="4" />
          <circle cx="10" cy="32" r="4" />
          <rect x="34" y="34" width="7" height="7" />
          <rect x="44" y="26" width="7" height="7" />
          <rect x="38" y="45" width="7" height="7" />
        </svg>
      );
    case "no-supervisado":
      return (
        <svg {...common}>
          <circle cx="17" cy="18" r="11" strokeDasharray="3 4" />
          <circle cx="38" cy="38" r="12" strokeDasharray="3 4" />
          <circle cx="14" cy="15" r="2.2" fill="currentColor" />
          <circle cx="20" cy="21" r="2.2" fill="currentColor" />
          <circle cx="13" cy="22" r="2.2" fill="currentColor" />
          <circle cx="35" cy="35" r="2.2" fill="currentColor" />
          <circle cx="42" cy="40" r="2.2" fill="currentColor" />
          <circle cx="37" cy="43" r="2.2" fill="currentColor" />
          <circle cx="42" cy="33" r="2.2" fill="currentColor" />
        </svg>
      );
    case "deep-learning":
      return (
        <svg {...common}>
          {[14, 28, 42].map((y) => (
            <path
              key={`a${y}`}
              d={`M10 ${y} L28 12 M10 ${y} L28 28 M10 ${y} L28 44`}
              opacity={0.45}
            />
          ))}
          {[12, 28, 44].map((y) => (
            <path key={`b${y}`} d={`M28 ${y} L46 28`} opacity={0.45} />
          ))}
          {[14, 28, 42].map((y) => (
            <circle key={`c${y}`} cx="10" cy={y} r="4" fill="var(--color-surface)" />
          ))}
          {[12, 28, 44].map((y) => (
            <circle key={`d${y}`} cx="28" cy={y} r="4" fill="var(--color-surface)" />
          ))}
          <circle cx="46" cy="28" r="5" fill="var(--color-surface)" />
        </svg>
      );
    case "refuerzo":
      return (
        <svg {...common}>
          <rect x="6" y="20" width="14" height="14" rx="3" />
          <circle cx="42" cy="27" r="9" />
          <path d="M20 22 C28 12, 34 12, 36 18" />
          <path d="M33 16 L36 18 L33 21" />
          <path d="M36 36 C30 44, 24 44, 19 34" />
          <path d="M22 34 L19 34 L19 37" />
        </svg>
      );
    case "optimizacion":
      return (
        <svg {...common}>
          <path d="M4 14 C14 50, 24 50, 30 34 C34 22, 40 24, 52 10" />
          <circle cx="10" cy="28" r="2.6" fill="currentColor" />
          <circle cx="15" cy="38" r="2.6" fill="currentColor" />
          <circle cx="20" cy="43" r="3" fill="currentColor" />
          <path d="M10 28 L15 38 L20 43" strokeDasharray="2 3" />
        </svg>
      );
    case "razonamiento":
      return (
        <svg {...common}>
          <path d="M4 46 L16 46 L28 12 L40 46 L52 46" />
          <path d="M4 12 L14 12 L26 46" opacity={0.45} />
          <path d="M30 46 L42 12 L52 12" opacity={0.45} />
          <path d="M8 30 L48 30" strokeDasharray="3 4" />
        </svg>
      );
    case "tfm":
      return (
        <svg {...common}>
          {[8, 19, 30, 41].map((y, i) => (
            <rect
              key={y}
              x={18}
              y={y}
              width={20}
              height={8}
              rx={3}
              fill="currentColor"
              fillOpacity={0.15 + i * 0.2}
            />
          ))}
          <path d="M28 4 V52" strokeDasharray="2 3" opacity={0.5} />
          <path d="M42 12 l8 -6 M42 24 l8 -6" opacity={0.6} />
        </svg>
      );
    default: {
      const unreachable: never = slug;
      return unreachable;
    }
  }
}
