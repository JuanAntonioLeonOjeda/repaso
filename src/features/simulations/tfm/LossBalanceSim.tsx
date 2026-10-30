import { useState, type ReactNode } from "react";

import { Choice, ControlNote, format, SimFrame, Slider, Stat } from "@/features/simulations/kit";

const W = 520;
const H = 150;
type Moment = "inicio" | "final";

/**
 * Typical values of each term of the TFM loss, L = CE + λ·MSE(BMD):
 * - at the start, CE ≈ ln 3 (uniform guess) and MSE ≈ variance of the BMD (≈ 0.2² = 0.04);
 * - near the end, CE ≈ 0.75 and MSE ≈ RMSE² ≈ 0.13² ≈ 0.017.
 */
const TERMS: Record<Moment, { ce: number; mse: number }> = {
  inicio: { ce: Math.log(3), mse: 0.04 },
  final: { ce: 0.75, mse: 0.017 },
};

export default function LossBalanceSim(): ReactNode {
  const [lambda, setLambda] = useState(10);
  const [moment, setMoment] = useState<Moment>("inicio");
  const { ce, mse } = TERMS[moment];
  const reg = lambda * mse;
  const total = ce + reg;
  const shareReg = reg / total;

  return (
    <SimFrame
      title="Equilibrar dos tareas en una sola pérdida"
      intro="LumosNet aprende a la vez a clasificar (entropía cruzada) y a estimar la BMD (error cuadrático). Pero el MSE de la BMD es un número diminuto (la BMD vale ≈ 1 y se equivoca en décimas): sin escalarlo, la clasificación se lleva todo el gradiente. El TFM usa λ = 10. Mueve λ y mira cuánto pesa cada tarea."
      onReset={() => {
        setLambda(10);
        setMoment("inicio");
      }}
      controls={
        <>
          <Slider
            label="λ (peso del MSE)"
            value={lambda}
            min={0}
            max={60}
            step={1}
            onChange={setLambda}
          />
          <Choice
            label="Momento del entrenamiento"
            value={moment}
            onChange={setMoment}
            options={[
              { value: "inicio", label: "Inicio" },
              { value: "final", label: "Final" },
            ]}
          />
          <ControlNote>
            No hay un λ «correcto»: se ajusta mirando las dos métricas en validación. Alternativas:
            normalizar la BMD (z-score) o aprender los pesos de cada tarea (incertidumbre
            homocedástica, Kendall et al. 2018).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Entropía cruzada" value={format(ce, 3)} />
          <Stat label="λ · MSE" value={format(reg, 3)} />
          <Stat
            label="Peso de la regresión"
            value={`${format(shareReg * 100, 0)}%`}
            tone={shareReg < 0.1 ? "bad" : "default"}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Clasificación ${format((1 - shareReg) * 100, 0)}%, regresión ${format(shareReg * 100, 0)}% de la pérdida`}
      >
        <rect
          x={20}
          y={40}
          width={(W - 40) * (1 - shareReg)}
          height={50}
          fill="var(--plot-1)"
          fillOpacity={0.75}
        />
        <rect
          x={20 + (W - 40) * (1 - shareReg)}
          y={40}
          width={(W - 40) * shareReg}
          height={50}
          fill="var(--plot-2)"
          fillOpacity={0.75}
        />
        <text x={24} y={30} fontSize={12} fill="var(--plot-1)" fontWeight={700}>
          clasificación (CE)
        </text>
        <text
          x={W - 24}
          y={30}
          textAnchor="end"
          fontSize={12}
          fill="var(--plot-2)"
          fontWeight={700}
        >
          regresión (λ·MSE)
        </text>
        <text x={W / 2} y={120} textAnchor="middle" fontSize={12} fill="var(--color-muted)">
          pérdida total = {format(total, 3)}
        </text>
      </svg>
    </SimFrame>
  );
}
