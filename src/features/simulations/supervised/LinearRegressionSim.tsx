import { useMemo, useState, type ReactNode } from "react";

import {
  Axes,
  ButtonRow,
  ControlNote,
  createRng,
  format,
  gaussian,
  linearScale,
  mean,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  Toggle,
} from "@/features/simulations/kit";

const W = 560;
const H = 320;
const M = { top: 16, right: 16, bottom: 36, left: 46 };

/** Closed-form simple linear regression (what OLS finds). */
export function ols(xs: readonly number[], ys: readonly number[]): { w: number; b: number } {
  const mx = mean(xs);
  const my = mean(ys);
  const cov = xs.reduce((s, x, i) => s + (x - mx) * ((ys[i] ?? 0) - my), 0);
  const varx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const w = varx === 0 ? 0 : cov / varx;
  return { w, b: my - w * mx };
}

export default function LinearRegressionSim(): ReactNode {
  const [w, setW] = useState(0.5);
  const [b, setB] = useState(20);
  const [showSquares, setShowSquares] = useState(true);
  const [withOutlier, setWithOutlier] = useState(false);

  // Flat size (m²) vs. price (k€), a classic first regression.
  const data = useMemo(() => {
    const rng = createRng(21);
    const xs = range(18).map(() => 40 + rng() * 100);
    const ys = xs.map((x) => 30 + 2.1 * x + gaussian(rng) * 25);
    if (withOutlier) {
      xs.push(135);
      ys.push(60);
    }
    return { xs, ys };
  }, [withOutlier]);
  const best = ols(data.xs, data.ys);
  const residuals = data.xs.map((x, i) => (data.ys[i] ?? 0) - (w * x + b));
  const mse = mean(residuals.map((r) => r * r));
  const bestMse = mean(data.xs.map((x, i) => ((data.ys[i] ?? 0) - (best.w * x + best.b)) ** 2));
  const ssTot = data.ys.reduce((s, yv) => s + (yv - mean(data.ys)) ** 2, 0);
  const r2 = 1 - (mse * data.ys.length) / ssTot;

  const x = linearScale([30, 150], [M.left, W - M.right]);
  const y = linearScale([0, 400], [H - M.bottom, M.top]);

  return (
    <SimFrame
      title="Ajustar una recta a mano"
      intro="Metros cuadrados frente a precio. Mueve pendiente y ordenada para que los cuadrados (los errores al cuadrado) sean lo más pequeños posible. Luego pulsa «Solución OLS» para ver el óptimo."
      onReset={() => {
        setW(0.5);
        setB(20);
        setWithOutlier(false);
      }}
      controls={
        <>
          <Slider
            label="Pendiente w (k€ por m²)"
            value={w}
            min={0}
            max={4}
            step={0.05}
            onChange={setW}
            format={(v) => format(v)}
          />
          <Slider label="Ordenada b (k€)" value={b} min={-100} max={200} step={1} onChange={setB} />
          <Toggle label="Ver errores al cuadrado" isOn={showSquares} onChange={setShowSquares} />
          <Toggle label="Añadir un piso atípico" isOn={withOutlier} onChange={setWithOutlier} />
          <ButtonRow>
            <SimButton
              isPrimary
              onClick={() => {
                setW(Math.round(best.w * 100) / 100);
                setB(Math.round(best.b));
              }}
            >
              Solución OLS
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Al elevar al cuadrado, un solo atípico pesa muchísimo y arrastra la recta.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="MSE actual"
            value={format(mse, 0)}
            tone={mse < bestMse * 1.05 ? "good" : "default"}
          />
          <Stat label="MSE óptimo" value={format(bestMse, 0)} />
          <Stat label="R²" value={format(r2)} />
          <Stat label="Recta OLS" value={`y = ${format(best.w)}·x + ${format(best.b, 0)}`} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Recta de regresión sobre los puntos y sus errores"
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[40, 80, 120]}
          yTicks={[0, 100, 200, 300, 400]}
          x={x}
          y={y}
          xLabel="m²"
          yLabel="precio (k€)"
        />
        {showSquares &&
          data.xs.map((xv, i) => {
            const yv = data.ys[i] ?? 0;
            const pred = w * xv + b;
            const side = Math.abs(y(pred) - y(yv));
            return (
              <rect
                key={`s${i}`}
                x={x(xv)}
                y={Math.min(y(pred), y(yv))}
                width={side}
                height={side}
                fill="var(--plot-2)"
                fillOpacity={0.12}
                stroke="var(--plot-2)"
                strokeOpacity={0.4}
              />
            );
          })}
        {data.xs.map((xv, i) => (
          <line
            key={`r${i}`}
            x1={x(xv)}
            x2={x(xv)}
            y1={y(data.ys[i] ?? 0)}
            y2={y(w * xv + b)}
            stroke="var(--plot-2)"
          />
        ))}
        <line
          x1={x(30)}
          y1={y(w * 30 + b)}
          x2={x(150)}
          y2={y(w * 150 + b)}
          stroke="var(--plot-1)"
          strokeWidth={3}
        />
        {data.xs.map((xv, i) => (
          <circle
            key={`p${i}`}
            cx={x(xv)}
            cy={y(data.ys[i] ?? 0)}
            r={4.5}
            fill="var(--color-ink)"
          />
        ))}
      </svg>
    </SimFrame>
  );
}
