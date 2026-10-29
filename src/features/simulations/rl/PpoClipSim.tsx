import { useState, type ReactNode } from "react";

import {
  Axes,
  Choice,
  ControlNote,
  format,
  linearScale,
  range,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const W = 560;
const H = 280;
const M = { top: 16, right: 16, bottom: 34, left: 40 };

/** PPO's clipped surrogate: min(r·A, clip(r, 1−ε, 1+ε)·A). */
export function clippedObjective(r: number, advantage: number, eps: number): number {
  return Math.min(r * advantage, Math.min(1 + eps, Math.max(1 - eps, r)) * advantage);
}

export default function PpoClipSim(): ReactNode {
  const [eps, setEps] = useState(0.2);
  const [sign, setSign] = useState<"pos" | "neg">("pos");
  const [ratio, setRatio] = useState(1.4);
  const A = sign === "pos" ? 1 : -1;
  const x = linearScale([0, 2], [M.left, W - M.right]);
  const y = linearScale([-2.2, 2.2], [H - M.bottom, M.top]);
  const path = (f: (r: number) => number): string =>
    range(201)
      .map((i) => `${i === 0 ? "M" : "L"}${x(i / 100)},${y(f(i / 100))}`)
      .join(" ");
  const value = clippedObjective(ratio, A, eps);
  // The gradient is zero where the clipped term is the active (smaller) one and constant.
  const isFlat = A > 0 ? ratio > 1 + eps : ratio < 1 - eps;

  return (
    <SimFrame
      title="El recorte de PPO"
      intro="r = π_nueva(a|s) / π_vieja(a|s) mide cuánto ha cambiado la política para una acción. Si la acción fue buena (A > 0), PPO deja de premiar subir r más allá de 1+ε; si fue mala, deja de premiar bajarla más allá de 1−ε. Así ninguna actualización se pasa de frenada."
      onReset={() => {
        setEps(0.2);
        setSign("pos");
        setRatio(1.4);
      }}
      controls={
        <>
          <Choice
            label="Ventaja"
            value={sign}
            onChange={setSign}
            options={[
              { value: "pos", label: "A > 0 (buena)" },
              { value: "neg", label: "A < 0 (mala)" },
            ]}
          />
          <Slider
            label="ε (clip)"
            value={eps}
            min={0.05}
            max={0.5}
            step={0.05}
            onChange={setEps}
            format={(v) => format(v)}
          />
          <Slider
            label="Ratio r"
            value={ratio}
            min={0}
            max={2}
            step={0.02}
            onChange={setRatio}
            format={(v) => format(v)}
          />
          <ControlNote>
            ε = 0,2 es el valor por defecto en casi todas las implementaciones (Stable-Baselines3,
            CleanRL).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Objetivo L_clip" value={format(value)} />
          <Stat
            label="¿Aporta gradiente?"
            value={isFlat ? "no (recortado)" : "sí"}
            tone={isFlat ? "bad" : "good"}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Objetivo recortado de PPO en función del ratio"
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[0, 0.5, 1, 1.5, 2]}
          yTicks={[-2, -1, 0, 1, 2]}
          x={x}
          y={y}
          xLabel="ratio r"
        />
        <rect
          x={x(1 - eps)}
          y={M.top}
          width={x(1 + eps) - x(1 - eps)}
          height={H - M.top - M.bottom}
          fill="var(--subject-color, var(--plot-5))"
          fillOpacity={0.12}
        />
        <path
          d={path((r) => r * A)}
          fill="none"
          stroke="var(--plot-noise)"
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        <path
          d={path((r) => clippedObjective(r, A, eps))}
          fill="none"
          stroke="var(--subject-color, var(--plot-5))"
          strokeWidth={3}
        />
        <circle cx={x(ratio)} cy={y(value)} r={6} fill="var(--color-ink)" />
        <text x={W - 20} y={30} textAnchor="end" fontSize={11} fill="var(--plot-noise)">
          r·A (sin recortar)
        </text>
      </svg>
    </SimFrame>
  );
}
