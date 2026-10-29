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

interface Frame {
  /** queens[row] = column, for the rows filled so far */
  queens: number[];
  tryCol: number | null;
  event: "try" | "conflict" | "place" | "backtrack" | "solution";
  nodes: number;
}

function isSafe(queens: readonly number[], col: number): boolean {
  const row = queens.length;
  return queens.every((c, r) => c !== col && Math.abs(c - col) !== row - r);
}

/** Backtracking for N-queens, recording every step until the first solution. */
export function queensFrames(n: number, limit = 4000): Frame[] {
  const frames: Frame[] = [];
  let nodes = 0;
  const solve = (queens: number[]): boolean => {
    if (queens.length === n) {
      frames.push({ queens: [...queens], tryCol: null, event: "solution", nodes });
      return true;
    }
    for (let col = 0; col < n; col++) {
      if (frames.length > limit) return true;
      nodes++;
      if (!isSafe(queens, col)) {
        frames.push({ queens: [...queens], tryCol: col, event: "conflict", nodes });
        continue;
      }
      queens.push(col);
      frames.push({ queens: [...queens], tryCol: null, event: "place", nodes });
      if (solve(queens)) return true;
      queens.pop();
      frames.push({ queens: [...queens], tryCol: col, event: "backtrack", nodes });
    }
    return false;
  };
  solve([]);
  return frames;
}

const EVENT_TEXT: Record<Frame["event"], string> = {
  try: "probando",
  conflict: "conflicto: se descarta (poda)",
  place: "colocada, bajamos a la siguiente fila",
  backtrack: "sin salida: vuelta atrás",
  solution: "¡solución!",
};

export default function NQueensSim(): ReactNode {
  const [n, setN] = useState(6);
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const frames = useMemo(() => queensFrames(n), [n]);
  const current = frames[Math.min(frame, frames.length - 1)];
  const done = frame >= frames.length - 1;
  useAnimation(isPlaying && !done, speed, () => {
    setFrame((f) => f + 1);
  });
  const cell = 300 / n;
  // Brute force would test every placement of one queen per row: n^n
  const bruteForce = n ** n;

  return (
    <SimFrame
      title="Vuelta atrás: las N reinas"
      intro="Colocamos una reina por fila. Si una columna choca con alguna reina anterior, se descarta sin seguir (poda). Si una fila no admite ninguna, se deshace la última decisión y se prueba la siguiente columna."
      onReset={() => {
        setN(6);
        setFrame(0);
        setIsPlaying(false);
      }}
      controls={
        <>
          <Slider
            label="N"
            value={n}
            min={4}
            max={10}
            onChange={(v) => {
              setN(v);
              setFrame(0);
              setIsPlaying(false);
            }}
          />
          <Slider label="Velocidad" value={speed} min={1} max={60} onChange={setSpeed} />
          <ButtonRow>
            <SimButton
              onClick={() => {
                setFrame((f) => Math.min(frames.length - 1, f + 1));
              }}
              isDisabled={done}
            >
              Paso
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
                setFrame(frames.length - 1);
              }}
            >
              Al final
            </SimButton>
          </ButtonRow>
          <ControlNote>
            La poda es lo que convierte n^n posibilidades en unos cientos de nodos.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="Paso"
            value={current ? EVENT_TEXT[current.event] : ""}
            tone={
              current?.event === "solution"
                ? "good"
                : current?.event === "backtrack"
                  ? "bad"
                  : "default"
            }
          />
          <Stat label="Nodos explorados" value={current?.nodes ?? 0} />
          <Stat label="Fuerza bruta (nⁿ)" value={bruteForce.toLocaleString("es")} />
        </>
      }
    >
      <svg
        viewBox="0 0 300 300"
        role="img"
        aria-label={`Tablero de ${n} reinas con ${current?.queens.length ?? 0} colocadas`}
        style={{ maxWidth: 380 }}
      >
        {range(n).flatMap((r) =>
          range(n).map((c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill={(r + c) % 2 ? "var(--color-surface-sunken)" : "var(--color-surface)"}
            />
          )),
        )}
        {current?.queens.map((c, r) => (
          <text
            key={r}
            x={c * cell + cell / 2}
            y={r * cell + cell * 0.72}
            textAnchor="middle"
            fontSize={cell * 0.65}
            fill={current.event === "solution" ? "var(--plot-3)" : "var(--color-ink)"}
          >
            ♛
          </text>
        ))}
        {current?.tryCol !== null && current?.tryCol !== undefined && (
          <rect
            x={current.tryCol * cell + 2}
            y={current.queens.length * cell + 2}
            width={cell - 4}
            height={cell - 4}
            fill="none"
            stroke={current.event === "conflict" ? "var(--color-bad)" : "var(--plot-5)"}
            strokeWidth={3}
          />
        )}
      </svg>
    </SimFrame>
  );
}
