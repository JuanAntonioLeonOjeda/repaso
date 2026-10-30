import { useState, type ReactNode } from "react";

import { ControlNote, SimFrame, Slider, Stat, Toggle } from "@/features/simulations/kit";

import { sliceIndices, sliceText } from "./slicing";

const TEXT = "abcdefghij";
const N = TEXT.length;
const W = 560;
const H = 150;
const CELL = 48;
const X0 = (W - CELL * N) / 2;

export default function SlicingSim(): ReactNode {
  const [hasStart, setHasStart] = useState(true);
  const [hasStop, setHasStop] = useState(true);
  const [start, setStart] = useState(2);
  const [stop, setStop] = useState(8);
  const [step, setStep] = useState(1);
  const s = hasStart ? start : null;
  const e = hasStop ? stop : null;
  const indices = step === 0 ? [] : sliceIndices(N, s, e, step);
  const order = new Map(indices.map((idx, k) => [idx, k]));
  const expression = `s[${sliceText(s, e, step)}]`;
  const result =
    step === 0
      ? "ValueError: slice step cannot be zero"
      : `'${indices.map((i) => TEXT[i] ?? "").join("")}'`;

  return (
    <SimFrame
      title="Slicing: s[inicio:fin:paso]"
      intro="El inicio se incluye y el fin no. Los índices negativos cuentan desde el final y un paso negativo recorre al revés. Prueba s[::-1], s[-3:] o s[8:2:-2]."
      onReset={() => {
        setHasStart(true);
        setHasStop(true);
        setStart(2);
        setStop(8);
        setStep(1);
      }}
      controls={
        <>
          <Toggle label="Indicar inicio" isOn={hasStart} onChange={setHasStart} />
          {hasStart && <Slider label="inicio" value={start} min={-N} max={N} onChange={setStart} />}
          <Toggle label="Indicar fin" isOn={hasStop} onChange={setHasStop} />
          {hasStop && <Slider label="fin" value={stop} min={-N} max={N} onChange={setStop} />}
          <Slider label="paso" value={step} min={-3} max={3} onChange={setStep} />
          <ControlNote>
            Lo mismo vale para listas, tuplas, arrays de NumPy y <code>.iloc</code> de pandas. Con{" "}
            <code>.loc</code> y etiquetas, en cambio, el final <strong>sí</strong> se incluye.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Expresión" value={<code>{expression}</code>} />
          <Stat
            label="Resultado"
            value={<code>{result}</code>}
            tone={step === 0 ? "bad" : "default"}
          />
          <Stat label="Elementos" value={indices.length} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`${expression} selecciona los índices ${indices.join(", ") || "ninguno"}: ${result}`}
      >
        <text x={X0 - 8} y={36} textAnchor="end" fontSize={11} fill="var(--color-muted)">
          i
        </text>
        <text x={X0 - 8} y={118} textAnchor="end" fontSize={11} fill="var(--color-muted)">
          i − n
        </text>
        {TEXT.split("").map((ch, i) => {
          const k = order.get(i);
          const isSelected = k !== undefined;
          const x = X0 + i * CELL;
          return (
            <g key={i}>
              <text
                x={x + CELL / 2}
                y={36}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-muted)"
              >
                {i}
              </text>
              <rect
                x={x + 2}
                y={46}
                width={CELL - 4}
                height={50}
                rx={6}
                fill={isSelected ? "var(--subject-color)" : "var(--color-surface-sunken)"}
                stroke="var(--color-line)"
              />
              <text
                x={x + CELL / 2}
                y={79}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={20}
                fontWeight={isSelected ? 700 : 400}
                fill={isSelected ? "var(--color-surface)" : "var(--color-ink)"}
              >
                {ch}
              </text>
              {isSelected && (
                <text
                  x={x + CELL / 2}
                  y={20}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="var(--subject-color)"
                >
                  {`#${String(k + 1)}`}
                </text>
              )}
              <text
                x={x + CELL / 2}
                y={118}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-muted)"
              >
                {i - N}
              </text>
            </g>
          );
        })}
      </svg>
    </SimFrame>
  );
}
