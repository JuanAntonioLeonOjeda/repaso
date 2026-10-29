import { useState, type ReactNode } from "react";

import { ControlNote, format, SimFrame, Slider, Stat } from "@/features/simulations/kit";

// "El animal no cruzó la calle porque estaba cansado"
const TOKENS = [
  "El",
  "animal",
  "no",
  "cruzó",
  "la",
  "calle",
  "porque",
  "estaba",
  "cansado",
] as const;

/**
 * Toy query and key vectors in a 4D space (dims ≈ "is an animal", "is a place",
 * "is about tiredness", "is grammar"). In a trained transformer these come from learned
 * projections W_Q, W_K; here they are hand-made so the result is readable.
 */
const K: number[][] = [
  [0.1, 0.1, 0, 1],
  [1.2, 0, 0.4, 0],
  [0, 0, 0, 0.9],
  [0.3, 0.4, 0, 0.2],
  [0, 0.1, 0, 1],
  [0, 1.2, 0, 0],
  [0, 0, 0, 0.8],
  [0.4, 0, 0.6, 0.3],
  [0.6, 0, 1.2, 0],
];
const Q: number[][] = [
  [0.4, 0, 0, 0.4],
  [0.2, 0.2, 0.6, 0],
  [0, 0, 0, 0.6],
  [0.8, 0.8, 0, 0],
  [0, 0.6, 0, 0.4],
  [0.2, 0.4, 0, 0],
  [0.3, 0, 0.6, 0.2],
  [1, 0, 0.8, 0],
  [1, 0, 0.6, 0],
];

export function softmax(xs: readonly number[]): number[] {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export default function AttentionSim(): ReactNode {
  const [query, setQuery] = useState(8);
  const [temperature, setTemperature] = useState(0.5);
  const d = 4;
  // Scaled dot-product attention: softmax(q·k / √d) — the temperature only exaggerates it for the demo
  const weights = TOKENS.map((_, i) =>
    softmax(
      K.map(
        (k) => k.reduce((s, kv, j) => s + kv * (Q[i]?.[j] ?? 0), 0) / Math.sqrt(d) / temperature,
      ),
    ),
  );
  const row = weights[query] ?? [];
  const top = row.indexOf(Math.max(...row));

  return (
    <SimFrame
      title="Autoatención: ¿a quién mira cada palabra?"
      intro="Elige una palabra (la query). Su vector se compara (producto escalar) con el de todas las demás (las keys) y un softmax convierte esas puntuaciones en pesos que suman 1. «cansado» debería mirar sobre todo a «animal»: así resuelve el modelo a qué se refiere."
      onReset={() => {
        setQuery(8);
        setTemperature(0.5);
      }}
      controls={
        <>
          <Slider
            label="Palabra que pregunta"
            value={query}
            min={0}
            max={TOKENS.length - 1}
            onChange={setQuery}
            format={(v) => TOKENS[v] ?? ""}
          />
          <Slider
            label="Temperatura"
            value={temperature}
            min={0.1}
            max={3}
            step={0.1}
            onChange={setTemperature}
            format={(v) => format(v, 1)}
          />
          <ControlNote>
            Temperatura baja: atención casi «a una sola palabra». Alta: atención repartida por
            igual.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Query" value={TOKENS[query]} />
          <Stat
            label="Más atendida"
            value={`${TOKENS[top] ?? ""} (${format((row[top] ?? 0) * 100, 0)}%)`}
          />
        </>
      }
    >
      <div style={{ overflowX: "auto" }}>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}
          aria-label="Pesos de atención de la palabra elegida"
        >
          {TOKENS.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setQuery(i);
              }}
              aria-pressed={i === query}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: i === query ? "2px solid var(--color-ink)" : "1px solid var(--color-line)",
                background: `color-mix(in srgb, var(--subject-color, var(--plot-7)) ${Math.round((row[i] ?? 0) * 100)}%, var(--color-surface))`,
                color: (row[i] ?? 0) > 0.45 ? "var(--color-surface)" : "var(--color-ink)",
                fontWeight: i === query ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {t}
              <small style={{ display: "block", fontSize: 10, opacity: 0.8 }}>
                {format((row[i] ?? 0) * 100, 0)}%
              </small>
            </button>
          ))}
        </div>
        <table
          style={{ borderCollapse: "collapse", fontSize: 11, margin: "0 auto" }}
          aria-label="Matriz de atención completa"
        >
          <thead>
            <tr>
              <th />
              {TOKENS.map((t) => (
                <th
                  key={t}
                  style={{
                    padding: 2,
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    fontWeight: 500,
                    color: "var(--color-muted)",
                  }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weights.map((r, i) => (
              <tr key={i}>
                <th
                  style={{
                    textAlign: "right",
                    paddingRight: 6,
                    fontWeight: i === query ? 700 : 500,
                    color: i === query ? "var(--color-ink)" : "var(--color-muted)",
                  }}
                >
                  {TOKENS[i]}
                </th>
                {r.map((v, j) => (
                  <td
                    key={j}
                    title={format(v)}
                    style={{
                      width: 26,
                      height: 22,
                      background: `color-mix(in srgb, var(--subject-color, var(--plot-7)) ${Math.round(v * 100)}%, var(--color-surface))`,
                      outline: i === query ? "1px solid var(--color-ink)" : undefined,
                    }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SimFrame>
  );
}
