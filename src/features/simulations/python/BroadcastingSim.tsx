import { useState, type ReactNode } from "react";

import { Choice, ControlNote, SimFrame, Slider, Stat } from "@/features/simulations/kit";

import { broadcastShapes, shapeText } from "./broadcasting";

const W = 560;
const H = 220;
const CELL = 26;
type BKind = "scalar" | "row" | "column" | "matrix";

function bShape(kind: BKind, rows: number, cols: number): number[] {
  switch (kind) {
    case "scalar":
      return [];
    case "row":
      return [cols];
    case "column":
      return [rows, 1];
    case "matrix":
      return [rows, cols];
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

/** A shape drawn as a grid; cells beyond the real size are the virtual copies broadcasting makes. */
function Grid({
  x,
  label,
  shape,
  target,
}: {
  x: number;
  label: string;
  shape: readonly number[];
  target: readonly number[] | null;
}): ReactNode {
  const realRows = shape.length === 2 ? (shape[0] ?? 1) : 1;
  const realCols = shape.length >= 1 ? (shape.at(-1) ?? 1) : 1;
  const rows = target ? (target.length === 2 ? (target[0] ?? 1) : 1) : realRows;
  const cols = target ? (target.at(-1) ?? 1) : realCols;
  return (
    <g>
      <text x={x} y={20} fontSize={12} fontWeight={700} fill="var(--color-ink)">
        {label}{" "}
        <tspan fontFamily="var(--font-mono)" fontWeight={400}>
          {shapeText(shape.length ? shape : [])}
        </tspan>
      </text>
      {Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => {
          const isReal = i < realRows && j < realCols;
          return (
            <rect
              key={`${String(i)}-${String(j)}`}
              x={x + j * CELL}
              y={32 + i * CELL}
              width={CELL - 3}
              height={CELL - 3}
              rx={3}
              fill={isReal ? "var(--subject-color)" : "var(--subject-soft)"}
              stroke={isReal ? "none" : "var(--subject-color)"}
              strokeDasharray={isReal ? undefined : "3 2"}
            />
          );
        }),
      )}
    </g>
  );
}

export default function BroadcastingSim(): ReactNode {
  const [aRows, setARows] = useState(3);
  const [aCols, setACols] = useState(4);
  const [kind, setKind] = useState<BKind>("row");
  const [bRows, setBRows] = useState(3);
  const [bCols, setBCols] = useState(4);
  const a = [aRows, aCols];
  const b = bShape(kind, bRows, bCols);
  const result = broadcastShapes(a, b);
  const target = result.ok ? result.shape : null;
  const bText = b.length === 0 ? "()" : shapeText(b);

  return (
    <SimFrame
      title="Broadcasting"
      intro="NumPy opera arrays de formas distintas «estirando» virtualmente las dimensiones de tamaño 1 (las celdas punteadas no existen en memoria). Las formas se comparan desde la derecha: cada pareja de tamaños debe ser igual o uno de los dos 1."
      onReset={() => {
        setARows(3);
        setACols(4);
        setKind("row");
        setBRows(3);
        setBCols(4);
      }}
      controls={
        <>
          <Slider label="Filas de A" value={aRows} min={1} max={5} onChange={setARows} />
          <Slider label="Columnas de A" value={aCols} min={1} max={6} onChange={setACols} />
          <Choice
            label="B es…"
            value={kind}
            onChange={setKind}
            options={[
              { value: "scalar", label: "escalar" },
              { value: "row", label: "fila (n,)" },
              { value: "column", label: "columna (m,1)" },
              { value: "matrix", label: "matriz (m,n)" },
            ]}
          />
          {(kind === "column" || kind === "matrix") && (
            <Slider label="Filas de B" value={bRows} min={1} max={5} onChange={setBRows} />
          )}
          {(kind === "row" || kind === "matrix") && (
            <Slider label="Columnas de B" value={bCols} min={1} max={6} onChange={setBCols} />
          )}
          <ControlNote>
            El caso típico: <code>X - X.mean(axis=0)</code> resta a cada columna su media. La media
            tiene forma <code>(n,)</code> y se repite en todas las filas.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="A + B" value={<code>{`(${aRows}, ${aCols}) + ${bText}`}</code>} />
          <Stat
            label="Resultado"
            value={result.ok ? <code>{shapeText(result.shape)}</code> : "ValueError"}
            tone={result.ok ? "good" : "bad"}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={
          result.ok
            ? `A ${shapeText(a)} más B ${bText} da ${shapeText(result.shape)}`
            : `A ${shapeText(a)} y B ${bText} no son compatibles: en el eje ${String(result.axis)} los tamaños son ${String(result.sizes[0])} y ${String(result.sizes[1])}`
        }
      >
        <Grid x={10} label="A" shape={a} target={null} />
        <text x={190} y={100} fontSize={22} fill="var(--color-muted)">
          +
        </text>
        <Grid x={215} label="B" shape={b} target={target} />
        <text x={385} y={100} fontSize={22} fill="var(--color-muted)">
          =
        </text>
        {result.ok ? (
          <Grid x={405} label="A + B" shape={result.shape} target={null} />
        ) : (
          <text x={405} y={100} fontSize={13} fill="var(--color-bad)">
            <tspan x={405}>operands could not be</tspan>
            <tspan x={405} dy={16}>
              broadcast together
            </tspan>
            <tspan
              x={405}
              dy={16}
            >{`(${String(result.sizes[0])} ≠ ${String(result.sizes[1])} y ninguno es 1)`}</tspan>
          </text>
        )}
      </svg>
    </SimFrame>
  );
}
