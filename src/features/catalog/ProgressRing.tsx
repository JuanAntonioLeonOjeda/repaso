import type { ReactNode } from "react";

interface Props {
  value: number;
  total: number;
  size?: number;
  label: string;
}

/** A ring that fills with progress; the number of done items is also given in text. */
export function ProgressRing({ value, total, size = 44, label }: Props): ReactNode {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = total === 0 ? 0 : value / total;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={stroke}
      />
      {/* No arc at 0%: a round line cap would still draw a dot. */}
      {ratio > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--subject-color, var(--color-ink))"
          strokeWidth={stroke}
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size * 0.28}
        fontWeight={700}
        fill="var(--color-ink)"
      >
        {Math.round(ratio * 100)}%
      </text>
    </svg>
  );
}
