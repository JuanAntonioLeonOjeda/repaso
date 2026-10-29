import { useMemo, useState, type ReactNode } from "react";

import {
  Axes,
  ControlNote,
  createRng,
  format,
  gaussian,
  linearScale,
  range,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const W = 560;
const H = 280;

interface Scored {
  score: number;
  positive: boolean;
}

function makeScores(separation: number, positiveRate: number): Scored[] {
  const rng = createRng(11);
  const n = 400;
  const nPos = Math.round(n * positiveRate);
  const clip = (v: number): number => Math.min(0.999, Math.max(0.001, v));
  return range(n).map((i) => {
    const positive = i < nPos;
    const centre = positive ? 0.5 + separation / 2 : 0.5 - separation / 2;
    return { positive, score: clip(centre + gaussian(rng) * 0.15) };
  });
}

export interface Confusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number;
  recall: number;
  fpr: number;
  f1: number;
  accuracy: number;
}

export function confusion(data: readonly Scored[], threshold: number): Confusion {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const d of data) {
    const predicted = d.score >= threshold;
    if (predicted && d.positive) tp++;
    else if (predicted) fp++;
    else if (d.positive) fn++;
    else tn++;
  }
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const fpr = fp + tn === 0 ? 0 : fp / (fp + tn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = (tp + tn) / data.length;
  return { tp, fp, tn, fn, precision, recall, fpr, f1, accuracy };
}

export default function ThresholdSim(): ReactNode {
  const [threshold, setThreshold] = useState(0.5);
  const [separation, setSeparation] = useState(0.3);
  const [positiveRate, setPositiveRate] = useState(0.5);
  const data = useMemo(() => makeScores(separation, positiveRate), [separation, positiveRate]);
  const c = confusion(data, threshold);
  const roc = useMemo(() => range(51).map((i) => confusion(data, 1 - i / 50)), [data]);
  const auc = roc.reduce((s, p, i) => {
    const prev = roc[i - 1];
    return prev ? s + (p.fpr - prev.fpr) * ((p.recall + prev.recall) / 2) : s;
  }, 0);

  // Histogram of scores by class
  const bins = 25;
  const hist = range(bins).map((b) => {
    const lo = b / bins;
    const hi = (b + 1) / bins;
    const inBin = data.filter((d) => d.score >= lo && d.score < hi);
    return {
      lo,
      pos: inBin.filter((d) => d.positive).length,
      neg: inBin.filter((d) => !d.positive).length,
    };
  });
  const maxCount = Math.max(1, ...hist.map((h) => Math.max(h.pos, h.neg)));
  const hx = linearScale([0, 1], [40, 330]);
  const hy = linearScale([0, maxCount], [H - 34, 20]);
  const rx = linearScale([0, 1], [370, W - 14]);
  const ry = linearScale([0, 1], [H - 34, 20]);

  return (
    <SimFrame
      title="El umbral de decisión"
      intro="Un clasificador da una puntuación entre 0 y 1; tú eliges a partir de qué valor dices «positivo». Mueve el umbral y mira cómo cambian precisión y sensibilidad: casi nunca puedes subir las dos a la vez."
      onReset={() => {
        setThreshold(0.5);
        setSeparation(0.3);
        setPositiveRate(0.5);
      }}
      controls={
        <>
          <Slider
            label="Umbral"
            value={threshold}
            min={0.02}
            max={0.98}
            step={0.01}
            onChange={setThreshold}
            format={(v) => format(v)}
          />
          <Slider
            label="Calidad del modelo"
            value={separation}
            min={0}
            max={0.7}
            step={0.05}
            onChange={setSeparation}
            format={(v) => format(v)}
          />
          <Slider
            label="% de positivos"
            value={positiveRate}
            min={0.05}
            max={0.5}
            step={0.05}
            onChange={setPositiveRate}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <ControlNote>
            Baja el % de positivos a 5% y mira la accuracy: alta aunque el modelo no detecte casi
            nada.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="TP / FP" value={`${c.tp} / ${c.fp}`} />
          <Stat label="FN / TN" value={`${c.fn} / ${c.tn}`} />
          <Stat label="Accuracy" value={format(c.accuracy)} />
          <Stat label="Precisión" value={format(c.precision)} />
          <Stat label="Sensibilidad (recall)" value={format(c.recall)} />
          <Stat label="F1" value={format(c.f1)} />
          <Stat label="AUC" value={format(auc)} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Histograma de puntuaciones por clase y curva ROC"
      >
        <Axes
          width={340}
          height={H}
          margin={{ top: 20, right: 10, bottom: 34, left: 40 }}
          xTicks={[0, 0.5, 1]}
          yTicks={[]}
          x={hx}
          y={hy}
          xLabel="puntuación del modelo"
        />
        {hist.map((h) => (
          <g key={h.lo}>
            <rect
              x={hx(h.lo)}
              y={hy(h.neg)}
              width={hx(1 / bins) - hx(0) - 1}
              height={hy(0) - hy(h.neg)}
              fill="var(--plot-1)"
              fillOpacity={0.5}
            />
            <rect
              x={hx(h.lo)}
              y={hy(h.pos)}
              width={hx(1 / bins) - hx(0) - 1}
              height={hy(0) - hy(h.pos)}
              fill="var(--plot-2)"
              fillOpacity={0.5}
            />
          </g>
        ))}
        <line
          x1={hx(threshold)}
          x2={hx(threshold)}
          y1={14}
          y2={H - 34}
          stroke="var(--color-ink)"
          strokeWidth={2}
        />
        <text x={hx(threshold) + 4} y={16} fontSize={11} fill="var(--color-ink)">
          umbral
        </text>
        <text x={44} y={30} fontSize={11} fill="var(--plot-1)">
          ■ negativos reales
        </text>
        <text x={44} y={44} fontSize={11} fill="var(--plot-2)">
          ■ positivos reales
        </text>

        <Axes
          width={W}
          height={H}
          margin={{ top: 20, right: 14, bottom: 34, left: 370 }}
          xTicks={[0, 0.5, 1]}
          yTicks={[0, 0.5, 1]}
          x={rx}
          y={ry}
          xLabel="FPR (falsas alarmas)"
        />
        <line
          x1={rx(0)}
          y1={ry(0)}
          x2={rx(1)}
          y2={ry(1)}
          stroke="var(--plot-noise)"
          strokeDasharray="4 3"
        />
        <path
          d={roc.map((p, i) => `${i === 0 ? "M" : "L"}${rx(p.fpr)},${ry(p.recall)}`).join(" ")}
          fill="none"
          stroke="var(--plot-3)"
          strokeWidth={2.5}
        />
        <circle cx={rx(c.fpr)} cy={ry(c.recall)} r={6} fill="var(--color-ink)" />
        <text x={378} y={30} fontSize={11} fill="var(--color-muted)">
          ROC · TPR (recall) ↑
        </text>
      </svg>
    </SimFrame>
  );
}
