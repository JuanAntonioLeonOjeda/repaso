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
  ticks,
} from "@/features/simulations/kit";

import { evalPolynomial, fitPolynomial, mse } from "./polyfit";

const W = 560;
const H = 300;
const M = { top: 16, right: 16, bottom: 34, left: 40 };
const MAX_DEGREE = 15;

const truth = (x: number): number => Math.sin(2.6 * x) * 0.8;

function makeSet(seed: number, n: number): { xs: number[]; ys: number[] } {
  const rng = createRng(seed);
  const xs = range(n).map(() => rng() * 2 - 1);
  return { xs, ys: xs.map((x) => truth(x) + gaussian(rng) * 0.22) };
}

export default function OverfittingSim(): ReactNode {
  const [degree, setDegree] = useState(1);
  const [nTrain, setNTrain] = useState(14);
  const train = useMemo(() => makeSet(3, nTrain), [nTrain]);
  const test = useMemo(() => makeSet(99, 60), []);

  const curve = useMemo(
    () =>
      range(MAX_DEGREE + 1).map((d) => {
        const w = fitPolynomial(train.xs, train.ys, d);
        return { d, train: mse(w, train.xs, train.ys), test: mse(w, test.xs, test.ys) };
      }),
    [train, test],
  );
  const w = useMemo(() => fitPolynomial(train.xs, train.ys, degree), [train, degree]);
  const current = curve[degree];

  const x = linearScale([-1, 1], [M.left, W / 2 - 10]);
  const y = linearScale([-1.6, 1.6], [H - M.bottom, M.top]);
  const path = range(121)
    .map((i) => {
      const xv = -1 + i / 60;
      const yv = Math.max(-1.6, Math.min(1.6, evalPolynomial(w, xv)));
      return `${i === 0 ? "M" : "L"}${x(xv)},${y(yv)}`;
    })
    .join(" ");

  const ex = linearScale([0, MAX_DEGREE], [W / 2 + 40, W - M.right]);
  const errMax = 0.4;
  const ey = linearScale([0, errMax], [H - M.bottom, M.top]);
  const errPath = (key: "train" | "test"): string =>
    curve
      .map((c, i) => `${i === 0 ? "M" : "L"}${ex(c.d)},${ey(Math.min(errMax, c[key]))}`)
      .join(" ");

  return (
    <SimFrame
      title="Subajuste, ajuste y sobreajuste"
      intro="Ajustamos un polinomio a puntos con ruido. Sube el grado poco a poco y mira las dos curvas de error de la derecha: la de entrenamiento siempre baja, la de test no."
      onReset={() => {
        setDegree(1);
        setNTrain(14);
      }}
      controls={
        <>
          <Slider
            label="Grado del polinomio"
            value={degree}
            min={0}
            max={MAX_DEGREE}
            onChange={setDegree}
          />
          <Slider
            label="Muestras de entrenamiento"
            value={nTrain}
            min={8}
            max={80}
            onChange={setNTrain}
          />
          <ControlNote>
            Con más datos, el sobreajuste tarda más en aparecer: más datos es el mejor
            regularizador.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Error train (MSE)" value={format(current?.train ?? 0, 3)} />
          <Stat
            label="Error test (MSE)"
            value={format(current?.test ?? 0, 3)}
            tone={(current?.test ?? 0) > 0.15 ? "bad" : "good"}
          />
          <Stat
            label="Diagnóstico"
            value={
              degree <= 2
                ? "subajuste"
                : (current?.test ?? 0) > 2 * (current?.train ?? 0) + 0.04
                  ? "sobreajuste"
                  : "razonable"
            }
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Polinomio de grado ${degree} ajustado y curvas de error`}
      >
        <Axes
          width={W / 2 + 10}
          height={H}
          margin={M}
          xTicks={[-1, 0, 1]}
          yTicks={[-1, 0, 1]}
          x={x}
          y={y}
          xLabel="x"
        />
        {test.xs.map((xv, i) => (
          <circle
            key={`t${i}`}
            cx={x(xv)}
            cy={y(test.ys[i] ?? 0)}
            r={2.5}
            fill="var(--plot-noise)"
          />
        ))}
        {train.xs.map((xv, i) => (
          <circle key={`r${i}`} cx={x(xv)} cy={y(train.ys[i] ?? 0)} r={4} fill="var(--plot-1)" />
        ))}
        <path d={path} fill="none" stroke="var(--plot-2)" strokeWidth={2.5} />
        <Axes
          width={W}
          height={H}
          margin={{ ...M, left: W / 2 + 40 }}
          xTicks={ticks(0, MAX_DEGREE, 5)}
          yTicks={ticks(0, errMax, 4)}
          x={ex}
          y={ey}
          xLabel="grado"
        />
        <path d={errPath("train")} fill="none" stroke="var(--plot-1)" strokeWidth={2} />
        <path d={errPath("test")} fill="none" stroke="var(--plot-2)" strokeWidth={2} />
        <line
          x1={ex(degree)}
          x2={ex(degree)}
          y1={M.top}
          y2={H - M.bottom}
          stroke="var(--color-ink)"
          strokeDasharray="4 3"
        />
        <text x={W - 20} y={M.top + 12} textAnchor="end" fontSize={11} fill="var(--plot-1)">
          — train
        </text>
        <text x={W - 20} y={M.top + 26} textAnchor="end" fontSize={11} fill="var(--plot-2)">
          — test
        </text>
      </svg>
    </SimFrame>
  );
}
