import { useMemo, useState, type ReactNode } from "react";

import {
  ButtonRow,
  ControlNote,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

const ITEMS = [
  { name: "Portátil", weight: 3, value: 20 },
  { name: "Cámara", weight: 2, value: 15 },
  { name: "Libro", weight: 1, value: 4 },
  { name: "Tienda", weight: 4, value: 18 },
  { name: "Botiquín", weight: 1, value: 7 },
] as const;

/** 0/1 knapsack DP table: dp[i][w] = best value using the first i items with capacity w. */
export function knapsackTable(capacity: number): number[][] {
  const dp = range(ITEMS.length + 1).map(() => new Array<number>(capacity + 1).fill(0));
  for (let i = 1; i <= ITEMS.length; i++) {
    const item = ITEMS[i - 1] ?? { weight: Infinity, value: 0 };
    for (let w = 0; w <= capacity; w++) {
      const skip = dp[i - 1]?.[w] ?? 0;
      const take = item.weight <= w ? (dp[i - 1]?.[w - item.weight] ?? 0) + item.value : -Infinity;
      const row = dp[i];
      if (row) row[w] = Math.max(skip, take);
    }
  }
  return dp;
}

function chosenItems(dp: number[][], capacity: number): number[] {
  const out: number[] = [];
  let w = capacity;
  const n: number = ITEMS.length;
  for (let i = n; i > 0; i--) {
    if ((dp[i]?.[w] ?? 0) !== (dp[i - 1]?.[w] ?? 0)) {
      out.push(i - 1);
      w -= ITEMS[i - 1]?.weight ?? 0;
    }
  }
  return out;
}

export default function KnapsackSim(): ReactNode {
  const [capacity, setCapacity] = useState(7);
  const [filled, setFilled] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const dp = useMemo(() => knapsackTable(capacity), [capacity]);
  const total = ITEMS.length * (capacity + 1);
  const done = filled >= total;
  const chosen = done ? chosenItems(dp, capacity) : [];
  useAnimation(isPlaying && !done, 6, () => {
    setFilled((f) => f + 1);
  });
  const currentIndex = Math.min(filled, total - 1);
  const ci = Math.floor(currentIndex / (capacity + 1)) + 1;
  const cw = currentIndex % (capacity + 1);
  const item = ITEMS[ci - 1];

  return (
    <SimFrame
      title="Programación dinámica: la mochila 0/1"
      intro="Cada celda responde a una pregunta pequeña: «¿cuál es el mejor valor usando los primeros i objetos con capacidad w?». Se calcula mirando dos celdas de la fila de arriba: no coger el objeto (misma columna) o cogerlo (columna w − peso, más su valor)."
      onReset={() => {
        setCapacity(7);
        setFilled(0);
        setIsPlaying(false);
      }}
      controls={
        <>
          <Slider
            label="Capacidad de la mochila"
            value={capacity}
            min={3}
            max={10}
            onChange={(v) => {
              setCapacity(v);
              setFilled(0);
              setIsPlaying(false);
            }}
          />
          <ButtonRow>
            <SimButton
              onClick={() => {
                setFilled((f) => Math.min(total, f + 1));
              }}
              isDisabled={done}
            >
              Siguiente celda
            </SimButton>
            <SimButton
              isPrimary
              onClick={() => {
                setIsPlaying((p) => !p);
              }}
              isDisabled={done}
            >
              {isPlaying ? "Pausar" : "Reproducir"}
            </SimButton>
            <SimButton
              onClick={() => {
                setFilled(total);
              }}
            >
              Completar
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Coste: O(n·W) celdas. Fuerza bruta: 2ⁿ subconjuntos. Con 5 objetos da igual; con 100,
            no.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="Mejor valor"
            value={done ? (dp[ITEMS.length]?.[capacity] ?? 0) : "…"}
            tone={done ? "good" : "default"}
          />
          <Stat
            label="Objetos elegidos"
            value={done ? chosen.map((i) => ITEMS[i]?.name).join(", ") || "ninguno" : "…"}
          />
          {!done && item && (
            <Stat
              label={`Celda (${item.name}, w=${cw})`}
              value={`máx(${dp[ci - 1]?.[cw] ?? 0}, ${item.weight <= cw ? `${dp[ci - 1]?.[cw - item.weight] ?? 0} + ${item.value}` : "no cabe"})`}
            />
          )}
        </>
      }
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            margin: "0 auto",
          }}
        >
          <caption
            style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginBottom: 6 }}
          >
            Filas: objetos disponibles (peso, valor). Columnas: capacidad w.
          </caption>
          <thead>
            <tr>
              <th />
              {range(capacity + 1).map((w) => (
                <th key={w} scope="col" style={{ padding: "4px 8px", color: "var(--color-muted)" }}>
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {range(ITEMS.length + 1).map((i) => (
              <tr key={i}>
                <th
                  scope="row"
                  style={{
                    textAlign: "right",
                    padding: "4px 8px",
                    fontWeight: 500,
                    color: "var(--color-ink-soft)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {i === 0
                    ? "—"
                    : `${ITEMS[i - 1]?.name} (${ITEMS[i - 1]?.weight}, ${ITEMS[i - 1]?.value})`}
                </th>
                {range(capacity + 1).map((w) => {
                  const index = (i - 1) * (capacity + 1) + w;
                  const isVisible = i === 0 || index < filled;
                  const isCurrent = !done && i === ci && w === cw;
                  const isSource =
                    !done &&
                    i === ci - 1 &&
                    (w === cw || (item !== undefined && w === cw - item.weight));
                  const isChosenPath = done && chosen.includes(i - 1) && w === capacity;
                  return (
                    <td
                      key={w}
                      style={{
                        padding: "4px 8px",
                        textAlign: "center",
                        border: "1px solid var(--color-line)",
                        background: isCurrent
                          ? "var(--color-task)"
                          : isSource
                            ? "var(--color-task-soft)"
                            : isChosenPath
                              ? "var(--subject-soft)"
                              : undefined,
                        color: isCurrent ? "#2b2200" : "var(--color-ink)",
                        fontWeight: isCurrent ? 700 : 400,
                      }}
                    >
                      {isVisible ? (dp[i]?.[w] ?? 0) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SimFrame>
  );
}
