import { useState, type ReactNode } from "react";

import {
  Axes,
  Choice,
  ControlNote,
  format,
  linearScale,
  SimFrame,
  Stat,
} from "@/features/simulations/kit";

import { fillMissing, type Cell, type FillMethod } from "./missing";

/** A temperature sensor with gaps, one reading per hour. */
const READINGS: Cell[] = [null, 14, 15, null, null, 19, 21, 22, null, 20, 17, null];
const W = 560;
const H = 250;
const M = { top: 16, right: 16, bottom: 34, left: 44 };

const CODE: Record<FillMethod, string> = {
  dropna: "s.dropna()",
  "fillna-mean": "s.fillna(s.mean())",
  ffill: "s.ffill()",
  bfill: "s.bfill()",
  interpolate: "s.interpolate()",
};

export default function MissingValuesSim(): ReactNode {
  const [method, setMethod] = useState<FillMethod>("interpolate");
  const filled = fillMissing(READINGS, method);
  // dropna shortens the series: keep the original positions of what survives
  const positions =
    method === "dropna"
      ? READINGS.flatMap((v, i) => (v === null ? [] : [i]))
      : READINGS.map((_, i) => i);
  const x = linearScale([0, READINGS.length - 1], [M.left, W - M.right]);
  const y = linearScale([8, 26], [H - M.bottom, M.top]);
  const remaining = filled.filter((v) => v === null).length;
  const points = filled.flatMap((v, k) => {
    const i = positions[k] ?? 0;
    return v === null ? [] : [{ i, v, isNew: READINGS[i] === null }];
  });
  const line = points
    .map((p, k) => `${k === 0 ? "M" : "L"}${String(x(p.i))},${String(y(p.v))}`)
    .join(" ");

  return (
    <SimFrame
      title="Rellenar huecos en una serie"
      intro="Un sensor de temperatura con lecturas perdidas. Cada método de pandas rellena de una forma: compara qué hace en los extremos (la primera y la última hora) y qué valores inventa en medio."
      onReset={() => {
        setMethod("interpolate");
      }}
      controls={
        <>
          <Choice
            label="Método"
            value={method}
            onChange={setMethod}
            options={[
              { value: "dropna", label: "dropna" },
              { value: "fillna-mean", label: "media" },
              { value: "ffill", label: "ffill" },
              { value: "bfill", label: "bfill" },
              { value: "interpolate", label: "interpolate" },
            ]}
          />
          <ControlNote>
            Para no dejar ningún NaN se encadenan: <code>s.interpolate().ffill().bfill()</code>. En
            series temporales, nunca rellenes con información del futuro si vas a predecir el futuro
            (bfill «ve» la lectura siguiente).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Código" value={<code>{CODE[method]}</code>} />
          <Stat
            label="Longitud"
            value={`${String(filled.length)} / ${String(READINGS.length)}`}
            tone={filled.length < READINGS.length ? "bad" : "default"}
          />
          <Stat label="NaN que quedan" value={remaining} tone={remaining > 0 ? "bad" : "good"} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`${CODE[method]}: ${filled.map((v) => (v === null ? "NaN" : format(v, 1))).join(", ")}`}
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[0, 2, 4, 6, 8, 10]}
          yTicks={[10, 15, 20, 25]}
          x={x}
          y={y}
          xLabel="hora"
          yLabel="°C"
        />
        {READINGS.map((v, i) =>
          v === null ? (
            <line
              key={`gap${String(i)}`}
              x1={x(i)}
              x2={x(i)}
              y1={M.top}
              y2={H - M.bottom}
              stroke="var(--color-bad)"
              strokeOpacity={0.25}
              strokeDasharray="3 3"
            />
          ) : null,
        )}
        <path d={line} fill="none" stroke="var(--subject-color)" strokeWidth={2} />
        {points.map((p) =>
          p.isNew ? (
            <rect
              key={p.i}
              x={x(p.i) - 6}
              y={y(p.v) - 6}
              width={12}
              height={12}
              fill="var(--color-surface)"
              stroke="var(--subject-color)"
              strokeWidth={2.5}
            />
          ) : (
            <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={5} fill="var(--subject-color)" />
          ),
        )}
      </svg>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", margin: 0 }}>
        Círculo: lectura real · cuadrado hueco: valor rellenado · línea punteada: hora sin lectura
      </p>
    </SimFrame>
  );
}
