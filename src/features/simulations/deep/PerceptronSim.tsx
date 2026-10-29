import { useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  format,
  linearScale,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const W = 300;
const step = (z: number): number => (z > 0 ? 1 : 0);
const INPUTS = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
] as const;

type Target = "and" | "or" | "xor";
const TARGETS: Record<Target, readonly number[]> = {
  and: [0, 0, 0, 1],
  or: [0, 1, 1, 1],
  xor: [0, 1, 1, 0],
};

interface Weights {
  w1: number;
  w2: number;
  b1: number; // hidden h1
  w3: number;
  w4: number;
  b2: number; // hidden h2
  w5: number;
  w6: number;
  b3: number; // output
}

const START: Weights = { w1: 1, w2: 1, b1: -1.5, w3: 0, w4: 0, b2: 0, w5: 1, w6: 0, b3: -0.5 };

export function evaluate(
  w: Weights,
  x1: number,
  x2: number,
  useHidden: boolean,
): { h1: number; h2: number; out: number } {
  const h1 = step(w.w1 * x1 + w.w2 * x2 + w.b1);
  const h2 = step(w.w3 * x1 + w.w4 * x2 + w.b2);
  if (!useHidden) return { h1, h2, out: h1 };
  return { h1, h2, out: step(w.w5 * h1 + w.w6 * h2 + w.b3) };
}

export default function PerceptronSim(): ReactNode {
  const [w, setW] = useState<Weights>(START);
  const [target, setTarget] = useState<Target>("and");
  const [layers, setLayers] = useState<"one" | "two">("one");
  const useHidden = layers === "two";
  const outputs = INPUTS.map(([a, b]) => evaluate(w, a, b, useHidden).out);
  const hits = outputs.filter((o, i) => o === TARGETS[target][i]).length;
  const set =
    (key: keyof Weights) =>
    (v: number): void => {
      setW((prev) => ({ ...prev, [key]: v }));
    };
  const s = linearScale([-0.5, 1.5], [0, W]);
  const lineFor = (a: number, b: number, c: number): string | null => {
    // a·x + b·y + c = 0, drawn across the square
    if (Math.abs(b) < 1e-6) return Math.abs(a) < 1e-6 ? null : `M${s(-c / a)},0 V${W}`;
    const y0 = (-c - a * -0.5) / b;
    const y1 = (-c - a * 1.5) / b;
    return `M${s(-0.5)},${W - s(y0)} L${s(1.5)},${W - s(y1)}`;
  };
  const slider = (label: string, key: keyof Weights): ReactNode => (
    <Slider
      label={label}
      value={w[key]}
      min={-3}
      max={3}
      step={0.5}
      onChange={set(key)}
      format={(v) => format(v, 1)}
    />
  );

  return (
    <SimFrame
      title="Perceptrones a mano: AND, OR y XOR"
      intro="Cada neurona dibuja una recta y dice 1 a un lado y 0 al otro (activación escalón). Con una sola neurona consigue AND y OR. Intenta XOR… y luego activa la segunda capa."
      onReset={() => {
        setW(START);
        setTarget("and");
        setLayers("one");
      }}
      controls={
        <>
          <Choice
            label="Objetivo"
            value={target}
            onChange={setTarget}
            options={[
              { value: "and", label: "AND" },
              { value: "or", label: "OR" },
              { value: "xor", label: "XOR" },
            ]}
          />
          <Choice
            label="Red"
            value={layers}
            onChange={setLayers}
            options={[
              { value: "one", label: "1 neurona" },
              { value: "two", label: "2 capas" },
            ]}
          />
          {slider("h1: w₁", "w1")}
          {slider("h1: w₂", "w2")}
          {slider("h1: b₁", "b1")}
          {useHidden && (
            <>
              {slider("h2: w₃", "w3")}
              {slider("h2: w₄", "w4")}
              {slider("h2: b₂", "b2")}
              {slider("salida: w₅ (de h1)", "w5")}
              {slider("salida: w₆ (de h2)", "w6")}
              {slider("salida: b₃", "b3")}
            </>
          )}
          <ControlNote>
            Pista para XOR: que h1 sea un OR, h2 un AND, y la salida «h1 y no h2».
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Aciertos" value={`${hits} / 4`} tone={hits === 4 ? "good" : "default"} />
          {INPUTS.map(([a, b], i) => (
            <Stat
              key={i}
              label={`(${a}, ${b}) → objetivo ${TARGETS[target][i]}`}
              value={outputs[i]}
              tone={outputs[i] === TARGETS[target][i] ? "good" : "bad"}
            />
          ))}
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${W}`}
        role="img"
        aria-label="Las cuatro entradas y las rectas de cada neurona"
        style={{ maxWidth: 360 }}
      >
        {[lineFor(w.w1, w.w2, w.b1), useHidden ? lineFor(w.w3, w.w4, w.b2) : null].map((d, i) =>
          d ? (
            <path
              key={i}
              d={d}
              stroke={i === 0 ? "var(--plot-1)" : "var(--plot-4)"}
              strokeWidth={2.5}
              strokeDasharray={i === 1 ? "6 4" : undefined}
            />
          ) : null,
        )}
        {INPUTS.map(([a, b], i) => (
          <g key={i}>
            <circle
              cx={s(a)}
              cy={W - s(b)}
              r={22}
              fill={TARGETS[target][i] ? "var(--plot-3)" : "var(--color-surface)"}
              stroke="var(--color-ink)"
              strokeWidth={2}
            />
            <text
              x={s(a)}
              y={W - s(b) + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={700}
              fill="var(--color-ink)"
            >
              {outputs[i]}
            </text>
          </g>
        ))}
        <text x={8} y={16} fontSize={11} fill="var(--color-muted)">
          relleno = objetivo 1 · número = salida de la red
        </text>
      </svg>
    </SimFrame>
  );
}
