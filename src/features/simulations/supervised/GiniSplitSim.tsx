import { useMemo, useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  createRng,
  format,
  linearScale,
  makeBlobs,
  plotColour,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  type Point,
} from "@/features/simulations/kit";

const W = 520;
const H = 340;
type Axis = "x" | "y";
type Labelled = Point & { label: number };

export function gini(labels: readonly number[]): number {
  if (labels.length === 0) return 0;
  const counts = new Map<number, number>();
  labels.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1));
  return 1 - [...counts.values()].reduce((s, c) => s + (c / labels.length) ** 2, 0);
}

export function splitImpurity(
  data: readonly Labelled[],
  axis: Axis,
  threshold: number,
): { left: number[]; right: number[]; weighted: number } {
  const left = data.filter((p) => p[axis] <= threshold).map((p) => p.label);
  const right = data.filter((p) => p[axis] > threshold).map((p) => p.label);
  const weighted = (left.length * gini(left) + right.length * gini(right)) / data.length;
  return { left, right, weighted };
}

export default function GiniSplitSim(): ReactNode {
  const [axis, setAxis] = useState<Axis>("x");
  const [threshold, setThreshold] = useState(0);
  const data = useMemo(
    () =>
      makeBlobs(
        createRng(8),
        [
          { x: -1.3, y: 0.8 },
          { x: 1.2, y: 0.4 },
          { x: 0.2, y: -1.4 },
        ],
        18,
        0.6,
      ),
    [],
  );
  const parent = gini(data.map((p) => p.label));
  const { left, right, weighted } = splitImpurity(data, axis, threshold);

  function findBest(): void {
    let best = { axis: "x" as Axis, t: 0, g: Infinity };
    for (const a of ["x", "y"] as const) {
      for (const p of data) {
        const g = splitImpurity(data, a, p[a]).weighted;
        if (g < best.g) best = { axis: a, t: p[a], g };
      }
    }
    setAxis(best.axis);
    setThreshold(Math.round(best.t * 100) / 100);
  }

  const x = linearScale([-3, 3], [0, W]);
  const y = linearScale([-3, 3], [H, 0]);

  return (
    <SimFrame
      title="¿Dónde corta un árbol de decisión?"
      intro="Un árbol elige, en cada nodo, la pregunta «¿x ≤ umbral?» que deja los grupos más puros. Mueve el corte y mira cómo baja la impureza de Gini ponderada."
      onReset={() => {
        setAxis("x");
        setThreshold(0);
      }}
      controls={
        <>
          <Choice
            label="Variable"
            value={axis}
            onChange={setAxis}
            options={[
              { value: "x", label: "x₁" },
              { value: "y", label: "x₂" },
            ]}
          />
          <Slider
            label="Umbral"
            value={threshold}
            min={-3}
            max={3}
            step={0.05}
            onChange={setThreshold}
            format={(v) => format(v)}
          />
          <SimButton isPrimary onClick={findBest}>
            Buscar el mejor corte
          </SimButton>
          <ControlNote>
            «Buscar» hace lo que CART: probar todos los cortes posibles y quedarse con el de menor
            Gini.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Gini del nodo padre" value={format(parent, 3)} />
          <Stat
            label="Gini izq. / der."
            value={`${format(gini(left), 3)} / ${format(gini(right), 3)}`}
          />
          <Stat
            label="Gini ponderado"
            value={format(weighted, 3)}
            tone={weighted < parent * 0.6 ? "good" : "default"}
          />
          <Stat label="Ganancia" value={format(parent - weighted, 3)} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Corte en ${axis === "x" ? "x₁" : "x₂"} = ${format(threshold)}`}
      >
        {axis === "x" ? (
          <>
            <rect
              x={0}
              y={0}
              width={x(threshold)}
              height={H}
              fill="var(--plot-grid)"
              opacity={0.5}
            />
            <line
              x1={x(threshold)}
              x2={x(threshold)}
              y1={0}
              y2={H}
              stroke="var(--color-ink)"
              strokeWidth={2.5}
            />
          </>
        ) : (
          <>
            <rect
              x={0}
              y={y(threshold)}
              width={W}
              height={H - y(threshold)}
              fill="var(--plot-grid)"
              opacity={0.5}
            />
            <line
              x1={0}
              x2={W}
              y1={y(threshold)}
              y2={y(threshold)}
              stroke="var(--color-ink)"
              strokeWidth={2.5}
            />
          </>
        )}
        {data.map((p, i) => (
          <circle
            key={i}
            cx={x(p.x)}
            cy={y(p.y)}
            r={5}
            fill={plotColour(p.label)}
            stroke="var(--color-surface)"
          />
        ))}
      </svg>
    </SimFrame>
  );
}
