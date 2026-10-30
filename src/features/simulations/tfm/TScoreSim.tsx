import { useState, type ReactNode } from "react";

import {
  ControlNote,
  format,
  linearScale,
  range,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

import {
  bmdFromT,
  CLASS_NAMES,
  classFromT,
  classProbabilitiesFromRegression,
  tScore,
} from "./bone";

const W = 560;
const H = 230;
const BAND_COLOURS = ["var(--plot-3)", "var(--plot-5)", "var(--plot-7)"] as const;

export default function TScoreSim(): ReactNode {
  const [bmd, setBmd] = useState(0.9);
  const [rmse, setRmse] = useState(0.125);
  const t = tScore(bmd);
  const cls = classFromT(t);
  const probs = classProbabilitiesFromRegression(bmd, rmse);
  const x = linearScale([0.5, 1.4], [30, W - 20]);
  const low = bmdFromT(-2.5);
  const high = bmdFromT(-1);
  // Gaussian of the regression error around the real BMD
  const pdf = (v: number): number => Math.exp(-0.5 * ((v - bmd) / rmse) ** 2);
  const curve = range(181)
    .map((i) => {
      const v = 0.5 + i * 0.005;
      return `${i === 0 ? "M" : "L"}${x(v)},${150 - 90 * pdf(v)}`;
    })
    .join(" ");

  return (
    <SimFrame
      title="De la BMD al diagnóstico (y por qué la osteopenia es difícil)"
      intro="El diagnóstico sale de la densidad mineral ósea (BMD) medida por DXA, a través del T-score. En LUMOS, T = (BMD − 1,114) / 0,120. Mueve la BMD real del paciente y el error típico de la cabeza de regresión (RMSE): la campana es dónde puede caer la predicción."
      onReset={() => {
        setBmd(0.9);
        setRmse(0.125);
      }}
      controls={
        <>
          <Slider
            label="BMD real (g/cm²)"
            value={bmd}
            min={0.5}
            max={1.4}
            step={0.005}
            onChange={setBmd}
            format={(v) => format(v, 3)}
          />
          <Slider
            label="RMSE de la regresión"
            value={rmse}
            min={0.02}
            max={0.2}
            step={0.005}
            onChange={setRmse}
            format={(v) => format(v, 3)}
          />
          <ControlNote>
            La franja de osteopenia mide solo 0,18 de BMD. Con el RMSE de tu modelo (≈ 0,125–0,14),
            un paciente en el centro de la franja cae fuera de ella casi la mitad de las veces.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="T-score" value={format(t, 2)} />
          <Stat label="Diagnóstico real" value={CLASS_NAMES[cls]} />
          {CLASS_NAMES.map((name, i) => (
            <Stat
              key={name}
              label={`P(predecir ${name.toLowerCase()})`}
              value={`${format((probs[i] ?? 0) * 100, 0)}%`}
              tone={i === cls ? "good" : "default"}
            />
          ))}
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`BMD ${format(bmd, 3)}, T-score ${format(t, 2)}: ${CLASS_NAMES[cls]}`}
      >
        {[
          [0.5, low],
          [low, high],
          [high, 1.4],
        ].map(([a = 0, b = 0], i) => (
          <g key={i}>
            <rect
              x={x(a)}
              y={50}
              width={x(b) - x(a)}
              height={110}
              fill={BAND_COLOURS[2 - i]}
              fillOpacity={0.14}
            />
            <text
              x={(x(a) + x(b)) / 2}
              y={44}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill={BAND_COLOURS[2 - i]}
            >
              {CLASS_NAMES[2 - i]}
            </text>
          </g>
        ))}
        <path
          d={curve}
          fill="var(--subject-color, var(--plot-1))"
          fillOpacity={0.25}
          stroke="var(--subject-color, var(--plot-1))"
          strokeWidth={2}
        />
        <line
          x1={x(bmd)}
          x2={x(bmd)}
          y1={50}
          y2={160}
          stroke="var(--color-ink)"
          strokeWidth={2.5}
        />
        <line x1={30} x2={W - 20} y1={160} y2={160} stroke="var(--plot-axis)" />
        {[0.6, 0.814, 0.994, 1.2, 1.4].map((v) => (
          <g key={v}>
            <text x={x(v)} y={176} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
              {format(v, 3)}
            </text>
            <text x={x(v)} y={194} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
              T={format(tScore(v), 1)}
            </text>
          </g>
        ))}
        <text
          x={W / 2}
          y={218}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="var(--color-muted)"
        >
          BMD (g/cm²) y su T-score
        </text>
      </svg>
    </SimFrame>
  );
}
