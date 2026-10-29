import type { ReactNode } from "react";

interface Props {
  width: number;
  height: number;
  /** Plot area margins. */
  margin: { top: number; right: number; bottom: number; left: number };
  xTicks: readonly number[];
  yTicks: readonly number[];
  x: (v: number) => number;
  y: (v: number) => number;
  xLabel?: string;
  yLabel?: string;
  formatTick?: (v: number) => string;
}

/** Grid, ticks and axis labels for SVG plots. Data marks are drawn by the caller. */
export function Axes({
  width,
  height,
  margin,
  xTicks,
  yTicks,
  x,
  y,
  xLabel,
  yLabel,
  formatTick = (v) => String(Math.round(v * 100) / 100),
}: Props): ReactNode {
  const bottom = height - margin.bottom;
  const right = width - margin.right;
  return (
    <g fontSize={11} fill="var(--color-muted)">
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line x1={x(t)} x2={x(t)} y1={margin.top} y2={bottom} stroke="var(--plot-grid)" />
          <text x={x(t)} y={bottom + 16} textAnchor="middle">
            {formatTick(t)}
          </text>
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={margin.left} x2={right} y1={y(t)} y2={y(t)} stroke="var(--plot-grid)" />
          <text x={margin.left - 6} y={y(t) + 4} textAnchor="end">
            {formatTick(t)}
          </text>
        </g>
      ))}
      <line x1={margin.left} x2={right} y1={bottom} y2={bottom} stroke="var(--plot-axis)" />
      <line
        x1={margin.left}
        x2={margin.left}
        y1={margin.top}
        y2={bottom}
        stroke="var(--plot-axis)"
      />
      {xLabel !== undefined && (
        <text x={(margin.left + right) / 2} y={height - 4} textAnchor="middle" fontWeight={600}>
          {xLabel}
        </text>
      )}
      {yLabel !== undefined && (
        <text
          transform={`translate(12 ${(margin.top + bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontWeight={600}
        >
          {yLabel}
        </text>
      )}
    </g>
  );
}

export function ticks(min: number, max: number, count: number): number[] {
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => min + i * step);
}
