import { useState, type ReactNode } from "react";

import { ControlNote, format, range, SimFrame, Slider, Stat } from "@/features/simulations/kit";

const PEOPLE = 1000;
const COLS = 40;

/** P(enfermo | positivo) with Bayes' theorem. */
export function posterior(prior: number, sensitivity: number, specificity: number): number {
  const truePos = prior * sensitivity;
  const falsePos = (1 - prior) * (1 - specificity);
  return truePos / (truePos + falsePos);
}

export default function BayesSim(): ReactNode {
  const [prior, setPrior] = useState(0.01);
  const [sensitivity, setSensitivity] = useState(0.95);
  const [specificity, setSpecificity] = useState(0.9);
  const sick = Math.round(PEOPLE * prior);
  const truePos = Math.round(sick * sensitivity);
  const falsePos = Math.round((PEOPLE - sick) * (1 - specificity));
  const post = posterior(prior, sensitivity, specificity);
  const cell = 14;
  const rows = Math.ceil(PEOPLE / COLS);

  return (
    <SimFrame
      title="Teorema de Bayes con 1.000 personas"
      intro="Un test que acierta el 95% de las veces da positivo. ¿Probabilidad de estar enfermo? Depende muchísimo de lo rara que sea la enfermedad. Cada cuadrado es una persona; los que tienen borde son positivos en el test."
      onReset={() => {
        setPrior(0.01);
        setSensitivity(0.95);
        setSpecificity(0.9);
      }}
      controls={
        <>
          <Slider
            label="Prevalencia P(enfermo)"
            value={prior}
            min={0.001}
            max={0.5}
            step={0.001}
            onChange={setPrior}
            format={(v) => `${format(v * 100, 1)}%`}
          />
          <Slider
            label="Sensibilidad P(+ | enfermo)"
            value={sensitivity}
            min={0.5}
            max={1}
            step={0.01}
            onChange={setSensitivity}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="Especificidad P(− | sano)"
            value={specificity}
            min={0.5}
            max={1}
            step={0.005}
            onChange={setSpecificity}
            format={(v) => `${format(v * 100, 1)}%`}
          />
          <ControlNote>
            Con prevalencia del 1%, la mayoría de positivos son falsos: hay muchos más sanos que
            enfermos y el 10% de muchos es más que el 95% de pocos.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Enfermos" value={sick} />
          <Stat label="Positivos verdaderos" value={truePos} />
          <Stat label="Falsos positivos" value={falsePos} tone="bad" />
          <Stat
            label="P(enfermo | positivo)"
            value={`${format(post * 100, 1)}%`}
            tone={post > 0.5 ? "good" : "bad"}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${COLS * cell} ${rows * cell}`}
        role="img"
        aria-label={`${sick} enfermos de ${PEOPLE}, ${truePos + falsePos} positivos`}
      >
        {range(PEOPLE).map((i) => {
          const isSick = i < sick;
          const isPositive = isSick ? i < truePos : i - sick < falsePos;
          return (
            <rect
              key={i}
              x={(i % COLS) * cell + 1.5}
              y={Math.floor(i / COLS) * cell + 1.5}
              width={cell - 3}
              height={cell - 3}
              rx={2}
              fill={isSick ? "var(--plot-7)" : "var(--plot-noise)"}
              fillOpacity={isSick ? 0.95 : 0.35}
              stroke={isPositive ? "var(--color-ink)" : "none"}
              strokeWidth={1.6}
            />
          );
        })}
      </svg>
    </SimFrame>
  );
}
