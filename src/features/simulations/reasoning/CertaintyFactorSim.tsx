import { useState, type ReactNode } from "react";

import { ControlNote, format, SimFrame, Slider, Stat, Toggle } from "@/features/simulations/kit";

/** MYCIN's rule for combining two certainty factors that support the same conclusion. */
export function combineCf(a: number, b: number): number {
  if (a >= 0 && b >= 0) return a + b * (1 - a);
  if (a <= 0 && b <= 0) return a + b * (1 + a);
  return (a + b) / (1 - Math.min(Math.abs(a), Math.abs(b)));
}

function Bar({ value, label }: { value: number; label: string }): ReactNode {
  const width = 240;
  const mid = width / 2;
  return (
    <svg
      viewBox={`0 0 ${width} 34`}
      role="img"
      aria-label={`${label}: ${format(value)}`}
      style={{ background: "transparent" }}
    >
      <rect x={0} y={10} width={width} height={14} rx={7} fill="var(--color-surface-sunken)" />
      <rect
        x={value >= 0 ? mid : mid + value * mid}
        y={10}
        width={Math.abs(value) * mid}
        height={14}
        rx={4}
        fill={value >= 0 ? "var(--plot-3)" : "var(--plot-7)"}
      />
      <line x1={mid} x2={mid} y1={6} y2={28} stroke="var(--color-ink)" />
      <text x={2} y={8} fontSize={9} fill="var(--color-muted)">
        −1
      </text>
      <text x={width - 2} y={8} fontSize={9} textAnchor="end" fill="var(--color-muted)">
        +1
      </text>
    </svg>
  );
}

export default function CertaintyFactorSim(): ReactNode {
  const [r1, setR1] = useState(0.8);
  const [r2, setR2] = useState(0.7);
  const [r3, setR3] = useState(-0.4);
  const [useThird, setUseThird] = useState(false);
  const twoRules = combineCf(r1, r2);
  const result = useThird ? combineCf(twoRules, r3) : twoRules;

  return (
    <SimFrame
      title="Factores de certeza (MYCIN)"
      intro="Ejemplo del tema: R1 «si es viernes → hay tráfico» y R2 «si llueve → hay tráfico». Dos evidencias a favor se refuerzan sin pasar nunca de 1; una en contra resta fuerza. Añade la R3 «si es fin de mes → tráfico» con certeza negativa."
      onReset={() => {
        setR1(0.8);
        setR2(0.7);
        setR3(-0.4);
        setUseThird(false);
      }}
      controls={
        <>
          <Slider
            label="CF R1 (viernes)"
            value={r1}
            min={-1}
            max={1}
            step={0.05}
            onChange={setR1}
            format={(v) => format(v)}
          />
          <Slider
            label="CF R2 (llueve)"
            value={r2}
            min={-1}
            max={1}
            step={0.05}
            onChange={setR2}
            format={(v) => format(v)}
          />
          <Toggle label="Aplicar R3 (fin de mes)" isOn={useThird} onChange={setUseThird} />
          {useThird && (
            <Slider
              label="CF R3"
              value={r3}
              min={-1}
              max={1}
              step={0.05}
              onChange={setR3}
              format={(v) => format(v)}
            />
          )}
          <ControlNote>
            Si una regla vale +1 y otra −1, la fórmula se rompe (división por 0): es una
            contradicción total.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="R1 ⊕ R2" value={format(twoRules, 3)} />
          {useThird && <Stat label="(R1 ⊕ R2) ⊕ R3" value={format(result, 3)} />}
        </>
      }
    >
      <div style={{ display: "grid", gap: 6, maxWidth: 420 }}>
        {[
          ["R1", r1],
          ["R2", r2],
          ...(useThird ? [["R3", r3] as const] : []),
          ["Certeza de «tráfico»", result],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "150px 1fr",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: label === "Certeza de «tráfico»" ? 700 : 500,
            }}
          >
            <span>
              {label} · {format(Number(value))}
            </span>
            <Bar value={Number.isFinite(Number(value)) ? Number(value) : 0} label={String(label)} />
          </div>
        ))}
      </div>
    </SimFrame>
  );
}
