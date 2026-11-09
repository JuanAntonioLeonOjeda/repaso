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

import {
  accuracyGap,
  bestEpoch,
  lossAxisMax,
  minValLossEpoch,
  type EpochPoint,
} from "./training-curves";
import { visionRuns } from "./vision-runs";

const W = 560;
const H = 280;
const M = { top: 16, right: 16, bottom: 36, left: 48 };
type Metric = "loss" | "acc";
/** Train-validation accuracy gap (points) above which the readout flags overfitting. */
const OVERFIT_GAP = 10;

const SERIES = {
  loss: { train: (p: EpochPoint) => p.trainLoss, val: (p: EpochPoint) => p.valLoss },
  acc: { train: (p: EpochPoint) => p.trainAcc * 100, val: (p: EpochPoint) => p.valAcc * 100 },
} as const;

/** Real train/validation curves of the Visión tutorial's models (scripts/tutorials/vision.py). */
export default function TrainingCurvesSim(): ReactNode {
  const firstRun = visionRuns[0];
  const [key, setKey] = useState(firstRun?.key ?? "");
  const [metric, setMetric] = useState<Metric>("loss");
  const [cursor, setCursor] = useState(1);
  const run = visionRuns.find((r) => r.key === key) ?? firstRun;
  // visionRuns is generated and never empty; the guard only narrows the type.
  if (run === undefined) return null;

  const last = run.epochs.length;
  const epoch = Math.min(cursor, last);
  const point = run.epochs[epoch - 1];
  const best = bestEpoch(run);
  const minLoss = minValLossEpoch(run);
  const maxEpochs = Math.max(...visionRuns.map((r) => r.epochs.length));
  const yMax = metric === "loss" ? lossAxisMax(visionRuns) : 100;
  const x = linearScale([1, maxEpochs], [M.left, W - M.right]);
  const y = linearScale([0, yMax], [H - M.bottom, M.top]);
  const path = (get: (p: EpochPoint) => number): string =>
    run.epochs.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.epoch)},${y(get(p))}`).join(" ");
  const unit = metric === "loss" ? "pérdida" : "accuracy (%)";
  const fmt = (v: number): string => (metric === "loss" ? format(v, 3) : `${format(v, 1)}%`);

  return (
    <SimFrame
      title="Curvas de entrenamiento reales"
      intro="Las curvas de los modelos del tutorial, época a época. Elige el MLP o la CNN sin regularizar, mira la pérdida y busca la época en la que la de validación empieza a subir mientras la de train sigue bajando. Después compara con la CNN regularizada."
      onReset={() => {
        setKey(firstRun?.key ?? "");
        setMetric("loss");
        setCursor(1);
      }}
      controls={
        <>
          <Choice
            label="Modelo"
            value={run.key}
            onChange={setKey}
            options={visionRuns.map((r) => ({ value: r.key, label: r.label }))}
          />
          <Choice
            label="Métrica"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "loss", label: "Pérdida" },
              { value: "acc", label: "Accuracy" },
            ]}
          />
          <Slider label="Época" value={epoch} min={1} max={last} onChange={setCursor} />
          <ControlNote>
            Línea continua: entrenamiento. Discontinua: validación. La distancia entre las dos es lo
            que el modelo memoriza y no generaliza.
          </ControlNote>
        </>
      }
      readout={
        point && (
          <>
            <Stat label={`Train (época ${epoch})`} value={fmt(SERIES[metric].train(point))} />
            <Stat label={`Validación (época ${epoch})`} value={fmt(SERIES[metric].val(point))} />
            <Stat
              label="Hueco de accuracy"
              value={`${format(accuracyGap(point), 1)} puntos${accuracyGap(point) > OVERFIT_GAP ? " (alto)" : ""}`}
              tone={accuracyGap(point) > OVERFIT_GAP ? "bad" : "default"}
            />
            {best && (
              <Stat
                label="Mejor época (validación)"
                value={`${best.epoch} · ${format(best.valAcc * 100, 1)}%`}
                tone="good"
              />
            )}
            {minLoss && (
              <Stat label="Mínima pérdida de validación" value={`época ${minLoss.epoch}`} />
            )}
          </>
        )
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          point
            ? `Curvas de ${unit} de ${run.label}. Mejor validación en la época ${best?.epoch ?? "-"}; mínima pérdida de validación en la época ${minLoss?.epoch ?? "-"}. En la época ${epoch}: train ${fmt(SERIES[metric].train(point))}, validación ${fmt(SERIES[metric].val(point))}.`
            : run.label
        }
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[1, 5, 10, 15, 20, 25, 30].filter((t) => t <= maxEpochs)}
          yTicks={
            metric === "loss" ? range(yMax * 2 + 1).map((i) => i / 2) : [0, 20, 40, 60, 80, 100]
          }
          x={x}
          y={y}
          xLabel="época"
          yLabel={unit}
        />
        <line
          x1={x(epoch)}
          x2={x(epoch)}
          y1={M.top}
          y2={H - M.bottom}
          stroke="var(--color-muted)"
          strokeDasharray="2 3"
        />
        <path d={path(SERIES[metric].train)} fill="none" stroke="var(--plot-1)" strokeWidth={2.5} />
        <path
          d={path(SERIES[metric].val)}
          fill="none"
          stroke="var(--plot-2)"
          strokeWidth={2.5}
          strokeDasharray="7 4"
        />
        {/* Legend: a sample of each line, with the label in ink colour (plot colours are too
            light for text on the sunken surface in the light theme). */}
        <g fontSize={12} fontWeight={600} fill="var(--color-ink-soft)">
          <line
            x1={W - M.right - 110}
            x2={W - M.right - 84}
            y1={M.top + 10}
            y2={M.top + 10}
            stroke="var(--plot-1)"
            strokeWidth={2.5}
          />
          <text x={W - M.right - 78} y={M.top + 14}>
            train
          </text>
          <line
            x1={W - M.right - 110}
            x2={W - M.right - 84}
            y1={M.top + 28}
            y2={M.top + 28}
            stroke="var(--plot-2)"
            strokeWidth={2.5}
            strokeDasharray="7 4"
          />
          <text x={W - M.right - 78} y={M.top + 32}>
            validación
          </text>
        </g>
      </svg>
    </SimFrame>
  );
}
