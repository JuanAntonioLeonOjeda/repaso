import { useState, type ReactNode } from "react";

import { Choice, ControlNote, range, SimFrame, Slider, Stat } from "@/features/simulations/kit";

const N = 20;
const W = 560;
const CELL = (W - 120) / N;

type Mode = "kfold" | "holdout";

/** Which fold each of the N training samples falls in (contiguous, as KFold without shuffle). */
function foldOf(i: number, k: number): number {
  return Math.min(k - 1, Math.floor((i * k) / N));
}

export default function KFoldSim(): ReactNode {
  const [k, setK] = useState(5);
  const [mode, setMode] = useState<Mode>("kfold");
  const rows = mode === "kfold" ? k : 1;
  const H = 70 + rows * 30;

  return (
    <SimFrame
      title="Hold-out y validación cruzada"
      intro="La franja gris es el test: se aparta al principio y no se toca hasta el final. Dentro del resto, la validación cruzada rota qué trozo valida."
      onReset={() => {
        setK(5);
        setMode("kfold");
      }}
      controls={
        <>
          <Choice
            label="Esquema interno"
            value={mode}
            onChange={setMode}
            options={[
              { value: "holdout", label: "Hold-out" },
              { value: "kfold", label: "K-fold" },
            ]}
          />
          {mode === "kfold" && (
            <Slider label="K (bolsas)" value={k} min={2} max={10} onChange={setK} />
          )}
          <ControlNote>
            Cada fila es un entrenamiento distinto. La nota final es la media (y la desviación) de
            todas las filas.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Modelos entrenados" value={rows} />
          <Stat
            label="% datos para entrenar en cada fila"
            value={mode === "kfold" ? `${Math.round(((k - 1) / k) * 100)}%` : "80%"}
          />
          <Stat label="Veces que cada muestra valida" value={mode === "kfold" ? "1" : "0 ó 1"} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Esquema de ${mode === "kfold" ? `${k}-fold` : "hold-out"}`}
      >
        <text x={8} y={24} fontSize={12} fill="var(--color-ink)" fontWeight={600}>
          Datos
        </text>
        <rect
          x={100}
          y={12}
          width={W - 120}
          height={18}
          rx={4}
          fill="var(--plot-1)"
          fillOpacity={0.25}
        />
        <rect
          x={100 + (W - 120) * 0.8}
          y={12}
          width={(W - 120) * 0.2}
          height={18}
          rx={4}
          fill="var(--plot-noise)"
        />
        <text
          x={100 + (W - 120) * 0.9}
          y={25}
          fontSize={11}
          textAnchor="middle"
          fill="var(--color-surface)"
          fontWeight={700}
        >
          test
        </text>
        {range(rows).map((row) => (
          <g key={row} transform={`translate(0 ${50 + row * 30})`}>
            <text x={8} y={14} fontSize={12} fill="var(--color-muted)">
              {mode === "kfold" ? `Iteración ${row + 1}` : "Única"}
            </text>
            {range(N).map((i) => {
              const isVal = mode === "kfold" ? foldOf(i, k) === row : i >= N * 0.8;
              return (
                <rect
                  key={i}
                  x={100 + i * CELL * 0.8 + 1}
                  y={2}
                  width={CELL * 0.8 - 2}
                  height={18}
                  rx={3}
                  fill={isVal ? "var(--plot-2)" : "var(--plot-1)"}
                  fillOpacity={isVal ? 0.9 : 0.45}
                />
              );
            })}
          </g>
        ))}
        <g transform={`translate(100 ${H - 12})`} fontSize={11} fill="var(--color-muted)">
          <rect width={10} height={10} y={-9} fill="var(--plot-1)" fillOpacity={0.45} />
          <text x={14}>entrenamiento</text>
          <rect x={110} width={10} height={10} y={-9} fill="var(--plot-2)" />
          <text x={124}>validación</text>
          <rect x={200} width={10} height={10} y={-9} fill="var(--plot-noise)" />
          <text x={214}>test (intocable)</text>
        </g>
      </svg>
    </SimFrame>
  );
}
