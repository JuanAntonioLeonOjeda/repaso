import { useMemo, useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  createRng,
  format,
  gaussian,
  linearScale,
  mean,
  SimFrame,
  Stat,
  std,
  Toggle,
} from "@/features/simulations/kit";

type Method = "raw" | "minmax" | "standard" | "robust";

const W = 560;
const ROW = 46;

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}

function quantile(values: readonly number[], q: number): number {
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return (s[lo] ?? 0) + ((s[hi] ?? 0) - (s[lo] ?? 0)) * (pos - lo);
}

export function scale(values: readonly number[], method: Method): number[] {
  switch (method) {
    case "raw":
      return [...values];
    case "minmax": {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return values.map((v) => (v - min) / (max - min));
    }
    case "standard": {
      const m = mean(values);
      const s = std(values);
      return values.map((v) => (v - m) / s);
    }
    case "robust": {
      const med = median(values);
      const iqr = quantile(values, 0.75) - quantile(values, 0.25);
      return values.map((v) => (v - med) / iqr);
    }
    default: {
      const unreachable: never = method;
      return unreachable;
    }
  }
}

/** Two features on very different scales (salary in €, age in years), like real tables. */
function makeData(withOutlier: boolean): { salary: number[]; age: number[] } {
  const rng = createRng(7);
  const salary = Array.from({ length: 40 }, () => 32000 + gaussian(rng) * 6000);
  const age = Array.from({ length: 40 }, () => 38 + gaussian(rng) * 9);
  if (withOutlier) {
    salary.push(250000);
    age.push(45);
  }
  return { salary, age };
}

function Strip({
  values,
  y,
  label,
  colour,
  domain,
}: {
  values: readonly number[];
  y: number;
  label: string;
  colour: string;
  domain: readonly [number, number];
}): ReactNode {
  const x = linearScale(domain, [90, W - 20]);
  return (
    <g>
      <text x={8} y={y + 4} fontSize={12} fill="var(--color-ink)" fontWeight={600}>
        {label}
      </text>
      <line x1={90} x2={W - 20} y1={y} y2={y} stroke="var(--plot-grid)" />
      {values.map((v, i) => (
        <circle key={i} cx={x(v)} cy={y} r={5} fill={colour} fillOpacity={0.55} />
      ))}
    </g>
  );
}

export default function ScalingSim(): ReactNode {
  const [method, setMethod] = useState<Method>("raw");
  const [withOutlier, setWithOutlier] = useState(false);
  const data = useMemo(() => makeData(withOutlier), [withOutlier]);
  const salary = scale(data.salary, method);
  const age = scale(data.age, method);
  const all = [...salary, ...age];
  const domain: [number, number] = [Math.min(...all), Math.max(...all)];
  const x = linearScale(domain, [90, W - 20]);
  const ticks = [domain[0], (domain[0] + domain[1]) / 2, domain[1]];

  return (
    <SimFrame
      title="Normalizar vs. estandarizar"
      intro={
        <>
          Dos columnas de una tabla: salario (en €) y edad (en años). Sin escalar, la edad es
          invisible al lado del salario. Prueba cada método y luego añade un salario atípico.
        </>
      }
      onReset={() => {
        setMethod("raw");
        setWithOutlier(false);
      }}
      controls={
        <>
          <Choice
            label="Escalado"
            value={method}
            onChange={setMethod}
            options={[
              { value: "raw", label: "Ninguno" },
              { value: "minmax", label: "MinMax" },
              { value: "standard", label: "Estándar" },
              { value: "robust", label: "Robusto" },
            ]}
          />
          <Toggle
            label="Añadir un salario de 250.000 €"
            isOn={withOutlier}
            onChange={setWithOutlier}
          />
          <ControlNote>
            Con el atípico, fíjate en MinMax: el resto de salarios se aplasta contra el 0.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="Rango salario"
            value={`${format(Math.min(...salary))} … ${format(Math.max(...salary))}`}
          />
          <Stat
            label="Rango edad"
            value={`${format(Math.min(...age))} … ${format(Math.max(...age))}`}
          />
          <Stat
            label="Media / desv. salario"
            value={`${format(mean(salary))} / ${format(std(salary))}`}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${ROW * 2 + 40}`}
        role="img"
        aria-label="Valores de salario y edad tras el escalado"
      >
        <Strip values={salary} y={ROW} label="Salario" colour="var(--plot-1)" domain={domain} />
        <Strip values={age} y={ROW * 2} label="Edad" colour="var(--plot-2)" domain={domain} />
        {ticks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={ROW * 2 + 30}
            fontSize={11}
            textAnchor="middle"
            fill="var(--color-muted)"
          >
            {Math.abs(t) >= 1000 ? `${Math.round(t / 1000)}k` : format(t)}
          </text>
        ))}
      </svg>
    </SimFrame>
  );
}
