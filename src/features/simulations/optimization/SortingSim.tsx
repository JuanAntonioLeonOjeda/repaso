import { useMemo, useState, type ReactNode } from "react";

import {
  ButtonRow,
  Choice,
  ControlNote,
  createRng,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

import { sortFrames, type SortName } from "./sorting";

const W = 560;
const H = 240;
type Order = "random" | "sorted" | "reversed" | "almost";

function makeInput(n: number, order: Order): number[] {
  const rng = createRng(n * 13);
  const base = range(n).map((i) => i + 1);
  if (order === "sorted") return base;
  if (order === "reversed") return base.reverse();
  if (order === "almost") {
    const a = [...base];
    for (let k = 0; k < Math.max(1, Math.floor(n / 10)); k++) {
      const i = Math.floor(rng() * (n - 1));
      [a[i], a[i + 1]] = [a[i + 1] ?? 0, a[i] ?? 0];
    }
    return a;
  }
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [base[i], base[j]] = [base[j] ?? 0, base[i] ?? 0];
  }
  return base;
}

const NAMES: Record<SortName, string> = {
  bubble: "Burbuja",
  selection: "Selección",
  insertion: "Inserción",
  merge: "Mergesort",
  quick: "Quicksort",
};

export default function SortingSim(): ReactNode {
  const [algorithm, setAlgorithm] = useState<SortName>("bubble");
  const [n, setN] = useState(30);
  const [order, setOrder] = useState<Order>("random");
  const [speed, setSpeed] = useState(30);
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const frames = useMemo(() => sortFrames(algorithm, makeInput(n, order)), [algorithm, n, order]);
  const current = frames[Math.min(frame, frames.length - 1)];
  const done = frame >= frames.length - 1;

  useAnimation(isPlaying && !done, speed, () => {
    setFrame((f) => Math.min(frames.length - 1, f + 1));
  });

  function reset(): void {
    setFrame(0);
    setIsPlaying(false);
  }

  const bw = W / n;
  const totals = useMemo(
    () =>
      (Object.keys(NAMES) as SortName[]).map((name) => ({
        name,
        frames: sortFrames(name, makeInput(n, order)).at(-1),
      })),
    [n, order],
  );

  return (
    <SimFrame
      title="Algoritmos de ordenación, en directo"
      intro="Cada barra es un número. Las barras resaltadas son las que se están comparando o moviendo. Fíjate en el contador de comparaciones: con n = 60, la diferencia entre O(n²) y O(n log n) ya es enorme."
      onReset={() => {
        setAlgorithm("bubble");
        setN(30);
        setOrder("random");
        reset();
      }}
      controls={
        <>
          <Choice
            label="Algoritmo"
            value={algorithm}
            onChange={(v) => {
              setAlgorithm(v);
              reset();
            }}
            options={(Object.keys(NAMES) as SortName[]).map((k) => ({ value: k, label: NAMES[k] }))}
          />
          <Choice
            label="Datos de entrada"
            value={order}
            onChange={(v) => {
              setOrder(v);
              reset();
            }}
            options={[
              { value: "random", label: "Aleatorio" },
              { value: "almost", label: "Casi ordenado" },
              { value: "reversed", label: "Al revés" },
              { value: "sorted", label: "Ordenado" },
            ]}
          />
          <Slider
            label="n (elementos)"
            value={n}
            min={5}
            max={80}
            onChange={(v) => {
              setN(v);
              reset();
            }}
          />
          <Slider label="Velocidad (pasos/s)" value={speed} min={2} max={60} onChange={setSpeed} />
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
            Inserción con datos casi ordenados es casi lineal: por eso Timsort (el sort de Python)
            la usa en trozos pequeños.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Comparaciones" value={current?.comparisons ?? 0} />
          <Stat label="Escrituras" value={current?.writes ?? 0} />
          {totals.map((t) => (
            <Stat
              key={t.name}
              label={`Total ${NAMES[t.name]}`}
              value={t.frames?.comparisons ?? 0}
            />
          ))}
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${NAMES[algorithm]}, paso ${frame} de ${frames.length - 1}`}
      >
        {current?.array.map((v, i) => (
          <rect
            key={i}
            x={i * bw + 1}
            y={H - (v / n) * (H - 10)}
            width={Math.max(1, bw - 2)}
            height={(v / n) * (H - 10)}
            rx={2}
            fill={
              current.active.includes(i)
                ? "var(--plot-5)"
                : done
                  ? "var(--plot-3)"
                  : "var(--subject-color, var(--plot-3))"
            }
            fillOpacity={current.active.includes(i) ? 1 : 0.65}
          />
        ))}
      </svg>
    </SimFrame>
  );
}
