import { useState, type ReactNode } from "react";

import {
  Axes,
  ControlNote,
  linearScale,
  range,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const W = 560;
const H = 300;
const M = { top: 16, right: 90, bottom: 34, left: 56 };

const CLASSES = [
  { name: "O(1)", f: () => 1, colour: "var(--plot-3)" },
  { name: "O(log n)", f: (n: number) => Math.log2(Math.max(1, n)), colour: "var(--plot-6)" },
  { name: "O(n)", f: (n: number) => n, colour: "var(--plot-1)" },
  { name: "O(n log n)", f: (n: number) => n * Math.log2(Math.max(1, n)), colour: "var(--plot-4)" },
  { name: "O(n²)", f: (n: number) => n * n, colour: "var(--plot-5)" },
  { name: "O(2ⁿ)", f: (n: number) => 2 ** n, colour: "var(--plot-7)" },
] as const;

function human(seconds: number): string {
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(0)} µs`;
  if (seconds < 1) return `${(seconds * 1e3).toFixed(1)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86400 * 365) return `${(seconds / 86400).toFixed(1)} días`;
  const years = seconds / (86400 * 365);
  return years > 1e9 ? "> edad del universo" : `${years.toExponential(1)} años`;
}

export default function ComplexitySim(): ReactNode {
  const [n, setN] = useState(20);
  const [maxN, setMaxN] = useState(30);
  const x = linearScale([0, maxN], [M.left, W - M.right]);
  const yMax = maxN * maxN;
  const y = linearScale([0, yMax], [H - M.bottom, M.top]);

  return (
    <SimFrame
      title="Cómo crece el coste"
      intro="Las curvas muestran cuántas operaciones hace un algoritmo según el tamaño de la entrada n. Abajo, el tiempo si cada operación tardase 1 µs. Sube n y mira qué pasa con 2ⁿ."
      onReset={() => {
        setN(20);
        setMaxN(30);
      }}
      controls={
        <>
          <Slider label="n" value={n} min={1} max={100} onChange={setN} />
          <Slider
            label="Zoom del eje x"
            value={maxN}
            min={10}
            max={100}
            step={10}
            onChange={setMaxN}
          />
          <ControlNote>
            Para n = 60, O(n²) son 3,6 ms; O(2ⁿ) son 36.000 años. Por eso los problemas NP-duros se
            atacan con heurísticas.
          </ControlNote>
        </>
      }
      readout={
        <>
          {CLASSES.map((c) => (
            <Stat
              key={c.name}
              label={c.name}
              value={<span style={{ color: c.colour }}>{human(c.f(n) * 1e-6)}</span>}
            />
          ))}
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Curvas de crecimiento de las clases de complejidad"
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={range(6).map((i) => (i * maxN) / 5)}
          yTicks={[0, yMax / 2, yMax]}
          x={x}
          y={y}
          xLabel="n"
          yLabel="operaciones"
          formatTick={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))}
        />
        {CLASSES.map((c) => {
          const pts = range(maxN * 2 + 1)
            .map((i) => i / 2)
            .filter((v) => c.f(v) <= yMax * 1.02);
          const last = pts.at(-1) ?? 0;
          return (
            <g key={c.name}>
              <polyline
                points={pts.map((v) => `${x(v)},${y(c.f(v))}`).join(" ")}
                fill="none"
                stroke={c.colour}
                strokeWidth={2.5}
              />
              <text
                x={Math.min(x(last) + 4, W - M.right + 4)}
                y={y(Math.min(yMax, c.f(last))) + 4}
                fontSize={11}
                fontWeight={700}
                fill={c.colour}
              >
                {c.name}
              </text>
            </g>
          );
        })}
        {n <= maxN && (
          <line
            x1={x(n)}
            x2={x(n)}
            y1={M.top}
            y2={H - M.bottom}
            stroke="var(--color-ink)"
            strokeDasharray="4 3"
          />
        )}
      </svg>
    </SimFrame>
  );
}
