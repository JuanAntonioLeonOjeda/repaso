import { useState, type ReactNode } from "react";

import { Choice, ControlNote, SimFrame, Stat, Toggle } from "@/features/simulations/kit";

import { merge, type JoinHow, type Row, type Value } from "./tables";

/** The exam's situation in miniature: incidents by airport name, airports with their country. */
const INCIDENTS: Row[] = [
  { airport: "denver intl", damage: "M" },
  { airport: "la guardia", damage: "N" },
  { airport: "unknown", damage: "N" },
  { airport: "denver intl", damage: "N" },
  { airport: "madrid barajas", damage: "S" },
];
const AIRPORTS: Row[] = [
  { airport: "la guardia", country: "US" },
  { airport: "denver intl", country: "US" },
  { airport: "madrid barajas", country: "ES" },
  { airport: "heathrow", country: "GB" },
];
const DUPLICATE: Row = { airport: "denver intl", country: "US (helipuerto)" };

const W = 560;
const ROW_H = 22;

function cell(value: Value | undefined): string {
  return value === null || value === undefined ? "NaN" : String(value);
}

export default function MergeSim(): ReactNode {
  const [how, setHow] = useState<JoinHow>("left");
  const [hasDuplicate, setHasDuplicate] = useState(false);
  const right = hasDuplicate ? [...AIRPORTS, DUPLICATE] : AIRPORTS;
  const rows = merge(INCIDENTS, right, "airport", how);
  const H = 40 + Math.max(rows.length, 6) * ROW_H;
  const code = `pd.merge(incidents, airports, on="airport", how="${how}")`;
  const missingCountry = rows.filter((r) => r.right === null).length;

  return (
    <SimFrame
      title="merge: juntar dos tablas por una clave"
      intro="Cinco incidentes y una tabla de aeropuertos. Cambia el tipo de unión y mira qué filas sobreviven y dónde aparecen NaN. Después activa el aeropuerto duplicado: con un left join el número de filas crece, que es justo lo que pasa en el examen (por eso pide comprobar cuántos registros salen)."
      onReset={() => {
        setHow("left");
        setHasDuplicate(false);
      }}
      controls={
        <>
          <Choice
            label="how"
            value={how}
            onChange={setHow}
            options={[
              { value: "inner", label: "inner" },
              { value: "left", label: "left" },
              { value: "right", label: "right" },
              { value: "outer", label: "outer" },
            ]}
          />
          <Toggle
            label="«denver intl» repetido en aeropuertos"
            isOn={hasDuplicate}
            onChange={setHasDuplicate}
          />
          <ControlNote>
            En el trabajo: <code>validate="many_to_one"</code> hace que pandas lance un error si la
            tabla de la derecha tiene claves repetidas, e <code>indicator=True</code> añade una
            columna que dice de qué tabla viene cada fila.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="Filas"
            value={`${String(rows.length)} (izquierda: ${String(INCIDENTS.length)})`}
            tone={how === "left" && rows.length > INCIDENTS.length ? "bad" : "default"}
          />
          <Stat label="Sin país (NaN)" value={missingCountry} />
        </>
      }
    >
      <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-sm)" }}>
        <code>{code}</code>
      </p>
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`${code} da ${String(rows.length)} filas: ${rows.map((r) => `${cell((r.left ?? r.right)?.airport)} ${cell(r.left?.damage)} ${cell(r.right?.country)}`).join("; ")}`}
      >
        <text x={10} y={16} fontSize={11} fontWeight={700} fill="var(--plot-1)">
          airport
        </text>
        <text x={200} y={16} fontSize={11} fontWeight={700} fill="var(--plot-1)">
          damage
        </text>
        <text x={300} y={16} fontSize={11} fontWeight={700} fill="var(--plot-2)">
          country
        </text>
        {rows.map((r, i) => {
          const y = 26 + i * ROW_H;
          const isNaNLeft = r.left === null;
          const isNaNRight = r.right === null;
          return (
            <g key={i} fontFamily="var(--font-mono)" fontSize={12}>
              <rect
                x={4}
                y={y}
                width={W - 8}
                height={ROW_H - 3}
                rx={3}
                fill={i % 2 === 0 ? "var(--color-surface-sunken)" : "transparent"}
              />
              <text x={10} y={y + 14} fill="var(--color-ink)">
                {cell((r.left ?? r.right)?.airport)}
              </text>
              <text
                x={200}
                y={y + 14}
                fill={isNaNLeft ? "var(--color-bad)" : "var(--color-ink)"}
                fontWeight={isNaNLeft ? 700 : 400}
              >
                {cell(r.left?.damage)}
              </text>
              <text
                x={300}
                y={y + 14}
                fill={isNaNRight ? "var(--color-bad)" : "var(--color-ink)"}
                fontWeight={isNaNRight ? 700 : 400}
              >
                {cell(r.right?.country)}
              </text>
            </g>
          );
        })}
      </svg>
    </SimFrame>
  );
}
