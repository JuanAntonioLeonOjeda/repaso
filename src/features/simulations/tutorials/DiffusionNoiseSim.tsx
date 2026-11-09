import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  Axes,
  Choice,
  ControlNote,
  format,
  linearScale,
  SimFrame,
  simStyles,
  Slider,
  Stat,
} from "@/features/simulations/kit";

import {
  alphaBarCosine,
  alphaBarLinear,
  noiseImage,
  noisy,
  sevenGlyph,
  STEPS,
  toGray,
} from "./diffusion";

const SIZE = 28;
const W = 360;
const H = 220;
const M = { top: 14, right: 12, bottom: 34, left: 42 };
type Schedule = "linear" | "cosine";

function PixelCanvas({ gray, label }: { gray: readonly number[]; label: string }): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null);
  // Effect: the canvas is a DOM node React does not draw; this copies the pixels into it.
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const data = ctx.createImageData(SIZE, SIZE);
    gray.forEach((v, i) => {
      const o = i * 4;
      data.data[o] = v;
      data.data[o + 1] = v;
      data.data[o + 2] = v;
      data.data[o + 3] = 255;
    });
    ctx.putImageData(data, 0, 0);
  }, [gray]);
  return (
    <div className={simStyles.canvasWrap} role="img" aria-label={label} style={{ maxWidth: 240 }}>
      <canvas ref={ref} width={SIZE} height={SIZE} />
    </div>
  );
}

/** The forward process of diffusion: how much of a digit is left after t noising steps. */
export default function DiffusionNoiseSim(): ReactNode {
  const [t, setT] = useState(250);
  const [schedule, setSchedule] = useState<Schedule>("linear");
  const curves = useMemo(() => ({ linear: alphaBarLinear(), cosine: alphaBarCosine() }), []);
  const x0 = useMemo(() => sevenGlyph(SIZE), []);
  const eps = useMemo(() => noiseImage(SIZE), []);
  const alphaBar = curves[schedule][t - 1] ?? 0;
  const gray = useMemo(() => toGray(noisy(x0, eps, alphaBar)), [x0, eps, alphaBar]);

  const x = linearScale([1, STEPS], [M.left, W - M.right]);
  const y = linearScale([0, 1], [H - M.bottom, M.top]);
  const path = (values: readonly number[]): string =>
    values
      .filter((_, i) => i % 5 === 0 || i === values.length - 1)
      .map((v, i, arr) => {
        const step = i === arr.length - 1 ? STEPS : i * 5 + 1;
        return `${i === 0 ? "M" : "L"}${x(step)},${y(v)}`;
      })
      .join(" ");
  const signal = Math.sqrt(alphaBar);
  const noise = Math.sqrt(1 - alphaBar);

  return (
    <SimFrame
      title="Destruir una imagen paso a paso"
      intro="Mueve t: la imagen es √ᾱ_t veces el «7» más √(1 − ᾱ_t) veces ruido gaussiano. Busca el paso en el que dejas de reconocer el dígito con el calendario lineal y compáralo con el coseno."
      onReset={() => {
        setT(250);
        setSchedule("linear");
      }}
      controls={
        <>
          <Slider label="Paso t" value={t} min={1} max={STEPS} onChange={setT} />
          <Choice
            label="Calendario de ruido"
            value={schedule}
            onChange={setSchedule}
            options={[
              { value: "linear", label: "Lineal (DDPM)" },
              { value: "cosine", label: "Coseno" },
            ]}
          />
          <ControlNote>
            El calendario lineal destruye casi toda la imagen hacia la mitad del recorrido; el
            coseno reparte la destrucción y deja más pasos útiles al final.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="ᾱ_t (varianza de la señal que queda)" value={format(alphaBar, 4)} />
          <Stat label="Peso de la imagen √ᾱ_t" value={format(signal, 3)} />
          <Stat label="Peso del ruido √(1 − ᾱ_t)" value={format(noise, 3)} />
        </>
      }
    >
      <div
        style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}
      >
        <PixelCanvas
          gray={gray}
          label={`El 7 en el paso ${t} con calendario ${schedule === "linear" ? "lineal" : "coseno"}: ${format(signal * 100, 0)}% de imagen y ${format(noise * 100, 0)}% de ruido en amplitud`}
        />
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`ᾱ_t a lo largo de los ${STEPS} pasos; en el paso ${t} vale ${format(alphaBar, 3)}`}
          style={{ flex: 1, minWidth: 240 }}
        >
          <Axes
            width={W}
            height={H}
            margin={M}
            xTicks={[1, 250, 500, 750, 1000]}
            yTicks={[0, 0.5, 1]}
            x={x}
            y={y}
            xLabel="paso t"
          />
          <path
            d={path(curves.linear)}
            fill="none"
            stroke="var(--plot-1)"
            strokeWidth={schedule === "linear" ? 3 : 1.5}
          />
          <path
            d={path(curves.cosine)}
            fill="none"
            stroke="var(--plot-2)"
            strokeWidth={schedule === "cosine" ? 3 : 1.5}
            strokeDasharray="6 4"
          />
          <circle cx={x(t)} cy={y(alphaBar)} r={5} fill="var(--subject-color)" />
          <g fontSize={12} fontWeight={600} fill="var(--color-ink-soft)">
            <line
              x1={W - 118}
              x2={W - 94}
              y1={M.top + 8}
              y2={M.top + 8}
              stroke="var(--plot-1)"
              strokeWidth={2.5}
            />
            <text x={W - 88} y={M.top + 12}>
              lineal
            </text>
            <line
              x1={W - 118}
              x2={W - 94}
              y1={M.top + 26}
              y2={M.top + 26}
              stroke="var(--plot-2)"
              strokeWidth={2.5}
              strokeDasharray="6 4"
            />
            <text x={W - 88} y={M.top + 30}>
              coseno
            </text>
          </g>
        </svg>
      </div>
    </SimFrame>
  );
}
