import type { ReactNode } from "react";

import type { Point } from "@/features/simulations/kit";

export function TspPlot({
  cities,
  tour,
  label,
}: {
  cities: readonly Point[];
  tour: readonly number[];
  label: string;
}): ReactNode {
  return (
    <svg viewBox="0 0 500 340" role="img" aria-label={label}>
      <polygon
        points={tour.map((c) => `${cities[c]?.x ?? 0},${cities[c]?.y ?? 0}`).join(" ")}
        fill="none"
        stroke="var(--subject-color, var(--plot-3))"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {cities.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={5}
          fill="var(--color-ink)"
          stroke="var(--color-surface)"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

export function Sparkline({
  values,
  label,
  colour = "var(--subject-color, var(--plot-3))",
}: {
  values: readonly number[];
  label: string;
  colour?: string;
}): ReactNode {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  return (
    <svg
      viewBox="0 0 160 44"
      width={160}
      height={44}
      role="img"
      aria-label={label}
      style={{ background: "transparent" }}
    >
      <polyline
        points={values
          .map(
            (v, i) =>
              `${(i / Math.max(1, values.length - 1)) * 160},${44 - ((v - min) / (max - min || 1)) * 42}`,
          )
          .join(" ")}
        fill="none"
        stroke={colour}
        strokeWidth={1.5}
      />
    </svg>
  );
}
