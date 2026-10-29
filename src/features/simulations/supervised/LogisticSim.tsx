import { useMemo, useState, type ReactNode } from "react";

import {
  Axes,
  ControlNote,
  createRng,
  format,
  linearScale,
  range,
  sigmoid,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const W = 560;
const H = 300;
const M = { top: 16, right: 16, bottom: 36, left: 40 };

export default function LogisticSim(): ReactNode {
  const [w, setW] = useState(1);
  const [b, setB] = useState(0);
  const [threshold, setThreshold] = useState(0.5);

  // Hours studied → passed the exam (1) or not (0)
  const data = useMemo(() => {
    const rng = createRng(4);
    return range(40).map(() => {
      const hours = rng() * 10;
      const p = sigmoid(1.3 * (hours - 5));
      return { hours, passed: rng() < p ? 1 : 0 };
    });
  }, []);

  const probs = data.map((d) => sigmoid(w * (d.hours - 5) + b));
  const logLoss =
    -data.reduce((s, d, i) => {
      const p = Math.min(1 - 1e-9, Math.max(1e-9, probs[i] ?? 0.5));
      return s + (d.passed ? Math.log(p) : Math.log(1 - p));
    }, 0) / data.length;
  const accuracy =
    data.filter((d, i) => ((probs[i] ?? 0) >= threshold ? 1 : 0) === d.passed).length / data.length;
  // Hours where the probability equals the threshold: the decision boundary.
  const boundary = w === 0 ? NaN : 5 + (Math.log(threshold / (1 - threshold)) - b) / w;

  const x = linearScale([0, 10], [M.left, W - M.right]);
  const y = linearScale([-0.1, 1.1], [H - M.bottom, M.top]);
  const curve = range(101)
    .map((i) => {
      const h = i / 10;
      return `${i === 0 ? "M" : "L"}${x(h)},${y(sigmoid(w * (h - 5) + b))}`;
    })
    .join(" ");

  return (
    <SimFrame
      title="Regresión logística: de recta a probabilidad"
      intro="Horas de estudio frente a aprobar (1) o suspender (0). La sigmoide convierte la recta w·x + b en una probabilidad. Ajusta w y b para minimizar la log-loss."
      onReset={() => {
        setW(1);
        setB(0);
        setThreshold(0.5);
      }}
      controls={
        <>
          <Slider
            label="w (pendiente)"
            value={w}
            min={-1}
            max={5}
            step={0.1}
            onChange={setW}
            format={(v) => format(v, 1)}
          />
          <Slider
            label="b (desplazamiento)"
            value={b}
            min={-4}
            max={4}
            step={0.1}
            onChange={setB}
            format={(v) => format(v, 1)}
          />
          <Slider
            label="Umbral de decisión"
            value={threshold}
            min={0.05}
            max={0.95}
            step={0.05}
            onChange={setThreshold}
            format={(v) => format(v)}
          />
          <ControlNote>
            Con w muy grande la curva se vuelve un escalón: el modelo está «demasiado seguro».
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Log-loss" value={format(logLoss, 3)} />
          <Stat label="Accuracy" value={format(accuracy)} />
          <Stat
            label="Frontera (horas)"
            value={Number.isFinite(boundary) ? format(boundary, 1) : "—"}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Curva sigmoide sobre los datos de aprobado y suspenso"
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[0, 2, 4, 6, 8, 10]}
          yTicks={[0, 0.5, 1]}
          x={x}
          y={y}
          xLabel="horas de estudio"
          yLabel="P(aprobar)"
        />
        <line
          x1={M.left}
          x2={W - M.right}
          y1={y(threshold)}
          y2={y(threshold)}
          stroke="var(--plot-noise)"
          strokeDasharray="4 3"
        />
        {Number.isFinite(boundary) && boundary >= 0 && boundary <= 10 && (
          <line
            x1={x(boundary)}
            x2={x(boundary)}
            y1={M.top}
            y2={H - M.bottom}
            stroke="var(--color-ink)"
            strokeDasharray="5 4"
          />
        )}
        <path d={curve} fill="none" stroke="var(--plot-1)" strokeWidth={3} />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={x(d.hours)}
            cy={y(d.passed)}
            r={5}
            fill={d.passed ? "var(--plot-3)" : "var(--plot-2)"}
            fillOpacity={0.75}
          />
        ))}
      </svg>
    </SimFrame>
  );
}
