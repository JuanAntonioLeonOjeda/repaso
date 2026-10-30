import { useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  format,
  plotColour,
  SimFrame,
  Stat,
} from "@/features/simulations/kit";

import { groupBy, type Aggregation, type Row } from "./tables";

/** Eight tickets from the café of the exam, already clean. */
const SALES: Row[] = [
  { item: "Coffee", pago: "Cash", total: 4 },
  { item: "Cake", pago: "Card", total: 12 },
  { item: "Coffee", pago: "Card", total: 6 },
  { item: "Salad", pago: "Cash", total: 10 },
  { item: "Cake", pago: "Cash", total: 3 },
  { item: "Coffee", pago: "Cash", total: 2 },
  { item: "Salad", pago: "Card", total: 15 },
  { item: "Coffee", pago: "Card", total: 8 },
];
type Key = "item" | "pago";
const W = 560;
const ROW_H = 24;
const H = 30 + SALES.length * ROW_H;

export default function GroupBySim(): ReactNode {
  const [by, setBy] = useState<Key>("item");
  const [how, setHow] = useState<Aggregation>("sum");
  const groups = groupBy(SALES, by, "total", how);
  const colourOf = new Map(groups.map((g, i) => [g.key, plotColour(i)]));
  const code = `df.groupby("${by}")["total"].${how}()`;
  const digits = how === "mean" ? 2 : 0;

  return (
    <SimFrame
      title="groupby: separar, aplicar, combinar"
      intro="groupby parte la tabla en trozos según una columna, aplica una función a cada trozo y junta los resultados en una Series cuyo índice son los grupos (ordenados). Cambia la clave y la agregación."
      onReset={() => {
        setBy("item");
        setHow("sum");
      }}
      controls={
        <>
          <Choice
            label="Agrupar por"
            value={by}
            onChange={setBy}
            options={[
              { value: "item", label: "item" },
              { value: "pago", label: "pago" },
            ]}
          />
          <Choice
            label="Agregación"
            value={how}
            onChange={setHow}
            options={[
              { value: "count", label: "count" },
              { value: "sum", label: "sum" },
              { value: "mean", label: "mean" },
              { value: "max", label: "max" },
            ]}
          />
          <ControlNote>
            Variantes que caen en el examen: <code>.agg(["mean", "median"])</code> (varias a la
            vez), <code>.transform("mean")</code> (devuelve un valor por fila, para comparar cada
            fila con la media de su grupo) y <code>pd.crosstab(df.item, df.pago)</code> (una tabla).
          </ControlNote>
        </>
      }
      readout={<Stat label="Código" value={<code>{code}</code>} />}
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`${code}: ${groups.map((g) => `${g.key} ${format(g.value, digits)}`).join(", ")}`}
      >
        <text x={10} y={16} fontSize={11} fill="var(--color-muted)">
          item · pago · total
        </text>
        {SALES.map((row, i) => {
          const colour = colourOf.get(String(row[by])) ?? "var(--color-muted)";
          return (
            <g key={i}>
              <rect
                x={6}
                y={24 + i * ROW_H}
                width={210}
                height={ROW_H - 4}
                rx={4}
                fill={colour}
                fillOpacity={0.18}
                stroke={colour}
              />
              <text
                x={14}
                y={24 + i * ROW_H + 15}
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill="var(--color-ink)"
              >
                {`${String(row.item).padEnd(7)} ${String(row.pago).padEnd(5)} ${String(row.total).padStart(3)}`}
              </text>
            </g>
          );
        })}
        {groups.map((g, gi) => {
          const y = 24 + gi * 52;
          const colour = colourOf.get(g.key) ?? "var(--color-muted)";
          return (
            <g key={g.key}>
              {g.rows.map((r) => {
                const i = SALES.indexOf(r);
                return (
                  <path
                    key={i}
                    d={`M216,${String(24 + i * ROW_H + 10)} C300,${String(24 + i * ROW_H + 10)} 300,${String(y + 18)} 360,${String(y + 18)}`}
                    stroke={colour}
                    strokeOpacity={0.6}
                    fill="none"
                  />
                );
              })}
              <rect
                x={360}
                y={y}
                width={190}
                height={36}
                rx={6}
                fill={colour}
                fillOpacity={0.18}
                stroke={colour}
                strokeWidth={2}
              />
              <text
                x={372}
                y={y + 23}
                fontFamily="var(--font-mono)"
                fontSize={13}
                fill="var(--color-ink)"
              >
                {g.key}
              </text>
              <text
                x={540}
                y={y + 23}
                textAnchor="end"
                fontFamily="var(--font-mono)"
                fontSize={15}
                fontWeight={700}
                fill="var(--color-ink)"
              >
                {format(g.value, digits)}
              </text>
            </g>
          );
        })}
      </svg>
    </SimFrame>
  );
}
