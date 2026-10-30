import { useMemo, useState, type ReactNode } from "react";

import {
  Axes,
  Choice,
  ControlNote,
  createRng,
  format,
  linearScale,
  mean,
  range,
  SimFrame,
  Slider,
  Stat,
  Toggle,
} from "@/features/simulations/kit";

import { histogram, kde, median, scottBandwidth } from "./histogram";

const W = 560;
const H = 260;
const M = { top: 16, right: 16, bottom: 36, left: 50 };
type Shape = "uniform" | "skewed";

function sample(shape: Shape, n: number): number[] {
  const rng = createRng(shape === "uniform" ? 7 : 11);
  // uniform: like np.random.randint(1, 101, 50) in the exam; skewed: incomes, delays, prices
  return range(n).map(() =>
    shape === "uniform"
      ? 1 + Math.floor(rng() * 100)
      : Math.min(100, Math.round(1 - 18 * Math.log(1 - rng() * 0.995))),
  );
}

export default function HistogramSim(): ReactNode {
  const [shape, setShape] = useState<Shape>("uniform");
  const [bins, setBins] = useState(10);
  const [factor, setFactor] = useState(1);
  const [showKde, setShowKde] = useState(true);
  const data = useMemo(() => sample(shape, 50), [shape]);
  const counts = histogram(data, bins);
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const binWidth = (hi - lo) / bins;
  const bandwidth = scottBandwidth(data) * factor;
  // density=True: bar height = count / (n · width), so the bars and the KDE share a scale
  const density = counts.map((b) => b.count / (data.length * binWidth));
  const curve = range(121).map((i) => {
    const xv = -10 + (i / 120) * 120;
    return { xv, d: kde(data, xv, bandwidth) };
  });
  const yMax = Math.max(...density, ...curve.map((c) => c.d)) * 1.1;
  const x = linearScale([-10, 110], [M.left, W - M.right]);
  const y = linearScale([0, yMax], [H - M.bottom, M.top]);
  const m = mean(data);
  const med = median(data);

  return (
    <SimFrame
      title="Histograma, densidad, media y mediana"
      intro="La pregunta 2 del examen: 50 enteros entre 1 y 100, histograma con barras de 10 en 10, curva de densidad y la media y la mediana como líneas verticales. Cambia el número de barras y el suavizado, y pasa a datos sesgados para ver cómo se separan media y mediana."
      onReset={() => {
        setShape("uniform");
        setBins(10);
        setFactor(1);
        setShowKde(true);
      }}
      controls={
        <>
          <Choice
            label="Datos"
            value={shape}
            onChange={setShape}
            options={[
              { value: "uniform", label: "uniformes (examen)" },
              { value: "skewed", label: "sesgados" },
            ]}
          />
          <Slider label="bins" value={bins} min={2} max={30} onChange={setBins} />
          <Toggle label="Curva de densidad (KDE)" isOn={showKde} onChange={setShowKde} />
          {showKde && (
            <Slider
              label="Suavizado (× Scott)"
              value={factor}
              min={0.2}
              max={3}
              step={0.1}
              onChange={setFactor}
              format={(v) => format(v, 1)}
            />
          )}
          <ControlNote>
            Para «de 10 en 10» exactos: <code>bins=range(0, 101, 10)</code>. Con{" "}
            <code>bins=10</code> los cortes van del mínimo al máximo de los datos.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Media" value={format(m, 1)} />
          <Stat label="Mediana" value={format(med, 1)} />
          <Stat label="Ancho de barra" value={format(binWidth, 1)} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`Histograma de ${String(bins)} barras; media ${format(m, 1)}, mediana ${format(med, 1)}`}
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[0, 20, 40, 60, 80, 100]}
          yTicks={[]}
          x={x}
          y={y}
          xLabel="valor"
          yLabel="densidad"
        />
        {counts.map((b, i) => (
          <rect
            key={i}
            x={x(b.from) + 0.5}
            y={y(density[i] ?? 0)}
            width={Math.max(0, x(b.to) - x(b.from) - 1)}
            height={H - M.bottom - y(density[i] ?? 0)}
            fill="var(--subject-color)"
            fillOpacity={0.35}
            stroke="var(--subject-color)"
          />
        ))}
        {showKde && (
          <path
            d={curve
              .map((c, i) => `${i === 0 ? "M" : "L"}${String(x(c.xv))},${String(y(c.d))}`)
              .join(" ")}
            fill="none"
            stroke="var(--plot-3)"
            strokeWidth={2.5}
          />
        )}
        <line
          x1={x(m)}
          x2={x(m)}
          y1={M.top}
          y2={H - M.bottom}
          stroke="var(--plot-2)"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        <line
          x1={x(med)}
          x2={x(med)}
          y1={M.top}
          y2={H - M.bottom}
          stroke="var(--plot-4)"
          strokeWidth={2}
          strokeDasharray="2 3"
        />
        <text x={x(m) + 4} y={M.top + 12} fontSize={11} fill="var(--plot-2)" fontWeight={700}>
          media
        </text>
        <text x={x(med) + 4} y={M.top + 26} fontSize={11} fill="var(--plot-4)" fontWeight={700}>
          mediana
        </text>
      </svg>
    </SimFrame>
  );
}
