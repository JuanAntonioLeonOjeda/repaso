import { useState, type ReactNode } from "react";

import {
  Axes,
  Choice,
  ControlNote,
  linearScale,
  range,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const W = 560;
const H = 260;
const M = { top: 20, right: 16, bottom: 36, left: 56 };
const EPOCHS = 50;
type Strategy = "phased" | "differential";

/** Learning rate of each parameter group per epoch, as in training/strategies of the TFM. */
export function schedule(
  strategy: Strategy,
  epoch: number,
  freezeEpochs: number,
): { backbone: number; heads: number } {
  if (strategy === "differential") return { backbone: 1e-4, heads: 1e-3 };
  // phased: backbone frozen (lr 0) while only the heads train at 1e-3, then everything at 1e-4
  return epoch <= freezeEpochs ? { backbone: 0, heads: 1e-3 } : { backbone: 1e-4, heads: 1e-4 };
}

export default function LrScheduleSim(): ReactNode {
  const [strategy, setStrategy] = useState<Strategy>("phased");
  const [freeze, setFreeze] = useState(8);
  const [stopAt, setStopAt] = useState(21);
  const x = linearScale([1, EPOCHS], [M.left, W - M.right]);
  // log scale: 1e-5 … 1e-2, with 0 drawn at the bottom
  const y = (lr: number): number =>
    lr === 0 ? H - M.bottom : linearScale([-5, -2], [H - M.bottom - 8, M.top])(Math.log10(lr));
  const path = (group: "backbone" | "heads"): string =>
    range(EPOCHS)
      .map((i) => {
        const e = i + 1;
        return `${i === 0 ? "M" : "L"}${x(e)},${y(schedule(strategy, e, freeze)[group])}`;
      })
      .join(" ");

  return (
    <SimFrame
      title="Las dos estrategias de fine-tuning"
      intro="Cada línea es el learning rate de un grupo de parámetros por época. Diferencial: todo se entrena desde el principio, el backbone 10 veces más despacio. Por fases: el backbone empieza congelado (lr 0) y se libera tras unas épocas, ya con las cabezas estabilizadas. La línea discontinua es la parada temprana (paciencia 7)."
      onReset={() => {
        setStrategy("phased");
        setFreeze(8);
        setStopAt(21);
      }}
      controls={
        <>
          <Choice
            label="Estrategia"
            value={strategy}
            onChange={setStrategy}
            options={[
              { value: "phased", label: "Por fases" },
              { value: "differential", label: "Diferencial" },
            ]}
          />
          {strategy === "phased" && (
            <Slider
              label="Épocas congelado (freeze_epochs)"
              value={freeze}
              min={1}
              max={30}
              onChange={setFreeze}
            />
          )}
          <Slider
            label="Mejor época (parada temprana)"
            value={stopAt}
            min={2}
            max={EPOCHS}
            onChange={setStopAt}
          />
          <ControlNote>
            Por qué ayuda congelar: al principio las cabezas son aleatorias y sus gradientes,
            enormes. Si el backbone se entrena ya, esos gradientes «borran» lo aprendido en ImageNet
            (olvido catastrófico).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="Épocas con el backbone entrenando"
            value={strategy === "phased" ? Math.max(0, stopAt - freeze) : stopAt}
          />
          <Stat label="Optimizador" value="Adam" />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Calendario de learning rate de la estrategia ${strategy}`}
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[1, 10, 20, 30, 40, 50]}
          yTicks={[]}
          x={x}
          y={(v) => v}
          xLabel="época"
        />
        {[1e-5, 1e-4, 1e-3, 1e-2].map((lr) => (
          <text
            key={lr}
            x={M.left - 6}
            y={y(lr) + 4}
            textAnchor="end"
            fontSize={11}
            fill="var(--color-muted)"
          >
            {lr.toExponential(0)}
          </text>
        ))}
        <text
          x={M.left - 6}
          y={H - M.bottom + 4}
          textAnchor="end"
          fontSize={11}
          fill="var(--color-muted)"
        >
          0
        </text>
        <path d={path("heads")} fill="none" stroke="var(--plot-2)" strokeWidth={3} />
        <path
          d={path("backbone")}
          fill="none"
          stroke="var(--plot-1)"
          strokeWidth={3}
          strokeDasharray={strategy === "phased" ? undefined : "6 3"}
        />
        <line
          x1={x(stopAt)}
          x2={x(stopAt)}
          y1={M.top}
          y2={H - M.bottom}
          stroke="var(--color-ink)"
          strokeDasharray="5 4"
        />
        <text
          x={W - 20}
          y={M.top + 10}
          textAnchor="end"
          fontSize={11}
          fill="var(--plot-2)"
          fontWeight={700}
        >
          cabezas
        </text>
        <text
          x={W - 20}
          y={M.top + 26}
          textAnchor="end"
          fontSize={11}
          fill="var(--plot-1)"
          fontWeight={700}
        >
          backbone (ResNet50)
        </text>
      </svg>
    </SimFrame>
  );
}
