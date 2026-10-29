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

import { T_CONORMS, T_NORMS, trapezoid, triangle, type Membership, type TNorm } from "./fuzzy";

const W = 560;
const H = 280;
const M = { top: 16, right: 16, bottom: 34, left: 40 };

const JOVEN = trapezoid(0, 0, 25, 40);
const ADULTO = triangle(25, 45, 65);
const MAYOR = trapezoid(50, 70, 100, 100);

type Hedge = "none" | "muy" | "masomenos" | "no";
const HEDGES: Record<Hedge, (mu: number) => number> = {
  none: (mu) => mu,
  muy: (mu) => mu ** 2, // concentration
  masomenos: (mu) => Math.sqrt(mu), // dilation
  no: (mu) => 1 - mu, // complement
};

export default function FuzzySetsSim(): ReactNode {
  const [age, setAge] = useState(33);
  const [norm, setNorm] = useState<TNorm>("min");
  const [hedge, setHedge] = useState<Hedge>("none");
  const joven = HEDGES[hedge](JOVEN(age));
  const adulto = ADULTO(age);
  const x = linearScale([0, 100], [M.left, W - M.right]);
  const y = linearScale([0, 1.05], [H - M.bottom, M.top]);
  const path = (f: Membership): string =>
    range(201)
      .map((i) => `${i === 0 ? "M" : "L"}${x(i / 2)},${y(f(i / 2))}`)
      .join(" ");
  const and = (v: number): number => T_NORMS[norm](HEDGES[hedge](JOVEN(v)), ADULTO(v));
  const or = (v: number): number => T_CONORMS[norm](HEDGES[hedge](JOVEN(v)), ADULTO(v));

  return (
    <SimFrame
      title="Conjuntos borrosos: ¿cuándo dejas de ser joven?"
      intro="En lógica clásica eres joven o no. En lógica borrosa lo eres en un grado entre 0 y 1. Mueve la edad, prueba los modificadores lingüísticos («muy», «más o menos») y mira cómo se calculan «joven Y adulto» y «joven O adulto» con distintas t-normas."
      onReset={() => {
        setAge(33);
        setNorm("min");
        setHedge("none");
      }}
      controls={
        <>
          <Slider
            label="Edad"
            value={age}
            min={0}
            max={100}
            onChange={setAge}
            format={(v) => `${v} años`}
          />
          <Choice
            label="Modificador sobre «joven»"
            value={hedge}
            onChange={setHedge}
            options={[
              { value: "none", label: "—" },
              { value: "muy", label: "muy" },
              { value: "masomenos", label: "más o menos" },
              { value: "no", label: "no" },
            ]}
          />
          <Choice
            label="Y / O"
            value={norm}
            onChange={setNorm}
            options={[
              { value: "min", label: "mín / máx" },
              { value: "product", label: "producto" },
              { value: "lukasiewicz", label: "Łukasiewicz" },
            ]}
          />
          <ControlNote>
            «muy» eleva al cuadrado (es más exigente); «más o menos» hace la raíz (es más
            permisivo).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label={`μ(${hedge === "none" ? "" : `${hedge === "masomenos" ? "más o menos" : hedge} `}joven)`}
            value={format(joven)}
          />
          <Stat label="μ(adulto)" value={format(adulto)} />
          <Stat label="μ(mayor)" value={format(MAYOR(age))} />
          <Stat label="joven Y adulto" value={format(and(age))} />
          <Stat label="joven O adulto" value={format(or(age))} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Funciones de pertenencia de joven, adulto y mayor"
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[0, 20, 40, 60, 80, 100]}
          yTicks={[0, 0.5, 1]}
          x={x}
          y={y}
          xLabel="edad"
          yLabel="pertenencia μ"
        />
        <path d={path(and)} fill="var(--plot-5)" fillOpacity={0.25} stroke="none" />
        <path
          d={path((v) => HEDGES[hedge](JOVEN(v)))}
          fill="none"
          stroke="var(--plot-1)"
          strokeWidth={2.5}
        />
        <path d={path(ADULTO)} fill="none" stroke="var(--plot-3)" strokeWidth={2.5} />
        <path d={path(MAYOR)} fill="none" stroke="var(--plot-4)" strokeWidth={2.5} />
        <line
          x1={x(age)}
          x2={x(age)}
          y1={M.top}
          y2={H - M.bottom}
          stroke="var(--color-ink)"
          strokeDasharray="4 3"
        />
        <circle cx={x(age)} cy={y(joven)} r={5} fill="var(--plot-1)" />
        <circle cx={x(age)} cy={y(adulto)} r={5} fill="var(--plot-3)" />
        <text x={x(6)} y={y(1) - 4} fontSize={12} fill="var(--plot-1)" fontWeight={700}>
          joven
        </text>
        <text x={x(41)} y={y(1) - 4} fontSize={12} fill="var(--plot-3)" fontWeight={700}>
          adulto
        </text>
        <text x={x(80)} y={y(1) - 4} fontSize={12} fill="var(--plot-4)" fontWeight={700}>
          mayor
        </text>
        <text x={W - 20} y={H - M.bottom - 8} textAnchor="end" fontSize={11} fill="var(--plot-5)">
          sombreado: joven Y adulto
        </text>
      </svg>
    </SimFrame>
  );
}
