import { useState, type ReactNode } from "react";

import { Choice, ControlNote, format, SimFrame, Stat } from "@/features/simulations/kit";

import { reduceMatrix, type Axis, type Reduction } from "./reductions";

const MATRIX = [
  [4, 9, 2, 7],
  [3, 5, 8, 1],
  [6, 1, 4, 9],
];
const W = 560;
const H = 230;
const CELL = 54;
const X0 = 40;
const Y0 = 40;

export default function AxisSim(): ReactNode {
  const [op, setOp] = useState<Reduction>("sum");
  const [axis, setAxis] = useState<Axis>(0);
  const result = reduceMatrix(MATRIX, op, axis);
  const digits = op === "mean" ? 2 : 0;
  const axisText = axis === "none" ? "" : `axis=${String(axis)}`;
  const code = `m.${op}(${axisText})`;
  const resultText =
    result.length === 1 && axis === "none"
      ? format(result[0] ?? 0, digits)
      : `[${result.map((v) => format(v, digits)).join(", ")}]`;

  return (
    <SimFrame
      title="¿Qué colapsa axis?"
      intro="axis dice qué dimensión desaparece. axis=0 recorre las filas hacia abajo y deja un valor por columna; axis=1 recorre cada fila y deja un valor por fila. Sin axis, todo el array se reduce a un número."
      onReset={() => {
        setOp("sum");
        setAxis(0);
      }}
      controls={
        <>
          <Choice
            label="Operación"
            value={op}
            onChange={setOp}
            options={[
              { value: "sum", label: "sum" },
              { value: "mean", label: "mean" },
              { value: "max", label: "max" },
              { value: "argmax", label: "argmax" },
            ]}
          />
          <Choice
            label="Eje"
            value={String(axis)}
            onChange={(v) => {
              setAxis(v === "none" ? "none" : (Number(v) as 0 | 1));
            }}
            options={[
              { value: "none", label: "ninguno" },
              { value: "0", label: "axis=0" },
              { value: "1", label: "axis=1" },
            ]}
          />
          <ControlNote>
            En pandas es igual: <code>df.mean()</code> (por defecto axis=0) da la media de cada
            columna y <code>df.isna().sum(axis=1)</code> cuenta NaN por fila.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Código" value={<code>{code}</code>} />
          <Stat label="Resultado" value={<code>{resultText}</code>} />
          <Stat
            label="Forma"
            value={<code>{axis === "none" ? "()" : `(${String(result.length)},)`}</code>}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`${code} sobre una matriz 3×4 da ${resultText}`}
      >
        {MATRIX.map((row, i) =>
          row.map((v, j) => (
            <g key={`${String(i)}-${String(j)}`}>
              <rect
                x={X0 + j * CELL}
                y={Y0 + i * CELL}
                width={CELL - 4}
                height={CELL - 4}
                rx={6}
                fill="var(--color-surface-sunken)"
                stroke="var(--color-line)"
              />
              <text
                x={X0 + j * CELL + (CELL - 4) / 2}
                y={Y0 + i * CELL + 32}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={18}
                fill="var(--color-ink)"
              >
                {v}
              </text>
            </g>
          )),
        )}
        {axis === 0 &&
          MATRIX[0]?.map((_, j) => (
            <g key={j}>
              <path
                d={`M${String(X0 + j * CELL + CELL - 12)},${String(Y0 - 14)} V${String(Y0 + 3 * CELL + 4)}`}
                stroke="var(--subject-color)"
                strokeWidth={2}
                markerEnd="url(#axis-arrow)"
              />
              <rect
                x={X0 + j * CELL}
                y={Y0 + 3 * CELL + 14}
                width={CELL - 4}
                height={34}
                rx={6}
                fill="var(--subject-color)"
              />
              <text
                x={X0 + j * CELL + 25}
                y={Y0 + 3 * CELL + 36}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={14}
                fontWeight={700}
                fill="var(--color-surface)"
              >
                {format(result[j] ?? 0, digits)}
              </text>
            </g>
          ))}
        {axis === 1 &&
          MATRIX.map((_, i) => (
            <g key={i}>
              <path
                d={`M${String(X0 - 14)},${String(Y0 + i * CELL + CELL - 12)} H${String(X0 + 4 * CELL + 4)}`}
                stroke="var(--subject-color)"
                strokeWidth={2}
                markerEnd="url(#axis-arrow)"
              />
              <rect
                x={X0 + 4 * CELL + 14}
                y={Y0 + i * CELL + 4}
                width={70}
                height={CELL - 12}
                rx={6}
                fill="var(--subject-color)"
              />
              <text
                x={X0 + 4 * CELL + 49}
                y={Y0 + i * CELL + 30}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={14}
                fontWeight={700}
                fill="var(--color-surface)"
              >
                {format(result[i] ?? 0, digits)}
              </text>
            </g>
          ))}
        {axis === "none" && (
          <g>
            <rect
              x={X0 - 6}
              y={Y0 - 6}
              width={4 * CELL + 8}
              height={3 * CELL + 8}
              rx={8}
              fill="none"
              stroke="var(--subject-color)"
              strokeWidth={2}
            />
            <rect
              x={X0 + 4 * CELL + 30}
              y={Y0 + CELL}
              width={90}
              height={CELL - 4}
              rx={6}
              fill="var(--subject-color)"
            />
            <text
              x={X0 + 4 * CELL + 75}
              y={Y0 + CELL + 32}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={16}
              fontWeight={700}
              fill="var(--color-surface)"
            >
              {resultText}
            </text>
          </g>
        )}
        <defs>
          <marker
            id="axis-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--subject-color)" />
          </marker>
        </defs>
      </svg>
    </SimFrame>
  );
}
