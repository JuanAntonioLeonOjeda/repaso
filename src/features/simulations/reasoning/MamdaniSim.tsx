import { useState, type ReactNode } from "react";

import {
  Axes,
  Choice,
  format,
  linearScale,
  range,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

import { FOOD, infer, RULES, SERVICE, TIP, TIP_MAX, TIP_SUGENO, type TNorm } from "./fuzzy";

const W = 560;
const H = 240;
const M = { top: 14, right: 16, bottom: 34, left: 36 };

function MiniSets({
  sets,
  value,
  max,
  label,
}: {
  sets: Record<string, (x: number) => number>;
  value: number;
  max: number;
  label: string;
}): ReactNode {
  const w = 260;
  const h = 90;
  const x = linearScale([0, max], [6, w - 6]);
  const y = linearScale([0, 1], [h - 16, 6]);
  const colours = ["var(--plot-2)", "var(--plot-1)", "var(--plot-3)"];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label}: ${format(value, 1)}`}>
      {Object.entries(sets).map(([name, f], i) => (
        <g key={name}>
          <path
            d={range(101)
              .map((k) => `${k === 0 ? "M" : "L"}${x((k * max) / 100)},${y(f((k * max) / 100))}`)
              .join(" ")}
            fill="none"
            stroke={colours[i]}
            strokeWidth={2}
          />
          <text
            x={x((max * (i + 0.5)) / Object.keys(sets).length)}
            y={h - 2}
            textAnchor="middle"
            fontSize={10}
            fill={colours[i]}
          >
            {name} {format(f(value))}
          </text>
        </g>
      ))}
      <line
        x1={x(value)}
        x2={x(value)}
        y1={4}
        y2={h - 16}
        stroke="var(--color-ink)"
        strokeDasharray="3 3"
      />
      <text x={6} y={12} fontSize={10} fill="var(--color-muted)">
        {label}
      </text>
    </svg>
  );
}

export default function MamdaniSim(): ReactNode {
  const [service, setService] = useState(6);
  const [food, setFood] = useState(7);
  const [norm, setNorm] = useState<TNorm>("min");
  const result = infer(service, food, norm);
  const x = linearScale([0, TIP_MAX], [M.left, W - M.right]);
  const y = linearScale([0, 1.05], [H - M.bottom, M.top]);
  const area = `M${x(0)},${y(0)} ${result.aggregated.map((p) => `L${x(p.x)},${y(p.mu)}`).join(" ")} L${x(TIP_MAX)},${y(0)} Z`;
  const colours = { baja: "var(--plot-2)", media: "var(--plot-1)", alta: "var(--plot-3)" } as const;

  return (
    <SimFrame
      title="Un controlador borroso completo: la propina"
      intro="Entradas nítidas (servicio y comida de 0 a 10) → borrosificación → reglas → agregación → desborrosificación. Mueve las entradas y sigue el flujo: cuánto se activa cada regla, la forma resultante y el número final."
      onReset={() => {
        setService(6);
        setFood(7);
        setNorm("min");
      }}
      controls={
        <>
          <Slider
            label="Calidad del servicio"
            value={service}
            min={0}
            max={10}
            step={0.1}
            onChange={setService}
            format={(v) => format(v, 1)}
          />
          <Slider
            label="Calidad de la comida"
            value={food}
            min={0}
            max={10}
            step={0.1}
            onChange={setFood}
            format={(v) => format(v, 1)}
          />
          <Choice
            label="Operador O"
            value={norm}
            onChange={setNorm}
            options={[
              { value: "min", label: "máx" },
              { value: "product", label: "suma prob." },
              { value: "lukasiewicz", label: "Łukasiewicz" },
            ]}
          />
          <MiniSets sets={SERVICE} value={service} max={10} label="servicio" />
          <MiniSets sets={FOOD} value={food} max={10} label="comida" />
        </>
      }
      readout={
        <>
          {RULES.map((r, i) => (
            <Stat key={r.text} label={r.text} value={format(result.strengths[i] ?? 0)} />
          ))}
          <Stat label="Mamdani · centroide" value={`${format(result.centroid, 1)}%`} tone="good" />
          <Stat label="Mamdani · media de máximos" value={`${format(result.meanOfMax, 1)}%`} />
          <Stat label="Sugeno (orden 0)" value={`${format(result.sugeno, 1)}%`} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Salida agregada; propina por centroide ${format(result.centroid, 1)}%`}
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[0, 5, 10, 15, 20, 25]}
          yTicks={[0, 0.5, 1]}
          x={x}
          y={y}
          xLabel="propina (%)"
        />
        {(Object.keys(TIP) as (keyof typeof TIP)[]).map((name) => (
          <g key={name}>
            <path
              d={range(251)
                .map((k) => `${k === 0 ? "M" : "L"}${x(k / 10)},${y(TIP[name](k / 10))}`)
                .join(" ")}
              fill="none"
              stroke={colours[name]}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <line
              x1={x(TIP_SUGENO[name])}
              x2={x(TIP_SUGENO[name])}
              y1={y(0)}
              y2={y(result.strengths[RULES.findIndex((r) => r.output === name)] ?? 0)}
              stroke={colours[name]}
              strokeWidth={5}
              strokeOpacity={0.35}
            />
          </g>
        ))}
        <path
          d={area}
          fill="var(--subject-color, var(--plot-6))"
          fillOpacity={0.35}
          stroke="var(--subject-color, var(--plot-6))"
          strokeWidth={2}
        />
        {Number.isFinite(result.centroid) && (
          <>
            <line
              x1={x(result.centroid)}
              x2={x(result.centroid)}
              y1={M.top}
              y2={H - M.bottom}
              stroke="var(--color-ink)"
              strokeWidth={2.5}
            />
            <text
              x={x(result.centroid) + 5}
              y={M.top + 12}
              fontSize={11}
              fontWeight={700}
              fill="var(--color-ink)"
            >
              centroide
            </text>
          </>
        )}
      </svg>
    </SimFrame>
  );
}
