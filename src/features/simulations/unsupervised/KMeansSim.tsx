import { useMemo, useState, type ReactNode } from "react";

import {
  ButtonRow,
  Choice,
  ControlNote,
  createRng,
  format,
  linearScale,
  makeBlobs,
  plotColour,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
  type Point,
} from "@/features/simulations/kit";

import { assign, inertia, kmeansPlusPlus, updateCentroids } from "./clustering";

const W = 520;
const H = 380;
type Init = "random" | "plusplus";

interface State {
  centroids: Point[];
  labels: number[] | null;
  /** Next half-step: assign points, or move centroids. */
  phase: "assign" | "update";
  iteration: number;
  history: Point[][];
  converged: boolean;
}

function initialState(points: readonly Point[], k: number, init: Init, seed: number): State {
  const rng = createRng(seed);
  const centroids =
    init === "plusplus"
      ? kmeansPlusPlus(points, k, rng)
      : Array.from({ length: k }, () => ({ x: rng() * 6 - 3, y: rng() * 6 - 3 }));
  return {
    centroids,
    labels: null,
    phase: "assign",
    iteration: 0,
    history: [centroids],
    converged: false,
  };
}

function step(points: readonly Point[], s: State): State {
  if (s.converged) return s;
  if (s.phase === "assign") {
    const labels = assign(points, s.centroids);
    const converged = s.labels !== null && labels.every((l, i) => l === s.labels?.[i]);
    return { ...s, labels, phase: "update", converged };
  }
  const centroids = updateCentroids(points, s.labels ?? [], s.centroids);
  return {
    ...s,
    centroids,
    phase: "assign",
    iteration: s.iteration + 1,
    history: [...s.history, centroids],
  };
}

export default function KMeansSim(): ReactNode {
  const [k, setK] = useState(3);
  const [init, setInit] = useState<Init>("random");
  const [seed, setSeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const points = useMemo(
    () =>
      makeBlobs(
        createRng(42),
        [
          { x: -1.6, y: 1.2 },
          { x: 1.4, y: 1.4 },
          { x: 0, y: -1.5 },
          { x: 2, y: -1.2 },
        ],
        30,
        0.45,
      ),
    [],
  );
  const [state, setState] = useState(() => initialState(points, 3, "random", 1));

  function restart(nextK = k, nextInit = init, nextSeed = seed): void {
    setIsPlaying(false);
    setState(initialState(points, nextK, nextInit, nextSeed));
  }

  useAnimation(isPlaying && !state.converged, 2, () => {
    setState((s) => step(points, s));
  });

  const x = linearScale([-3.5, 3.5], [0, W]);
  const y = linearScale([-3, 3], [H, 0]);
  const sse = state.labels ? inertia(points, state.labels, state.centroids) : NaN;

  return (
    <SimFrame
      title="K-means paso a paso"
      intro="Dos pasos que se repiten: (1) cada punto se asigna al centroide más cercano, (2) cada centroide se mueve a la media de sus puntos. Prueba distintas semillas con inicialización aleatoria y compárala con k-means++."
      onReset={() => {
        setK(3);
        setInit("random");
        setSeed(1);
        restart(3, "random", 1);
      }}
      controls={
        <>
          <Slider
            label="k (número de clusters)"
            value={k}
            min={1}
            max={7}
            onChange={(v) => {
              setK(v);
              restart(v);
            }}
          />
          <Choice
            label="Inicialización"
            value={init}
            onChange={(v) => {
              setInit(v);
              restart(k, v);
            }}
            options={[
              { value: "random", label: "Aleatoria" },
              { value: "plusplus", label: "k-means++" },
            ]}
          />
          <ButtonRow>
            <SimButton
              onClick={() => {
                setState((s) => step(points, s));
              }}
              isDisabled={state.converged}
            >
              {state.phase === "assign" ? "Asignar" : "Mover centroides"}
            </SimButton>
            <SimButton
              isPrimary
              onClick={() => {
                setIsPlaying((p) => !p);
              }}
              isDisabled={state.converged}
            >
              {isPlaying ? "Pausar" : "Reproducir"}
            </SimButton>
            <SimButton
              onClick={() => {
                const s = seed + 1;
                setSeed(s);
                restart(k, init, s);
              }}
            >
              Otra semilla
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Los datos tienen 4 grupos reales. ¿Qué pasa con k = 3? ¿Y con k = 5?
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Iteración" value={state.iteration} />
          <Stat label="Inercia (SSE)" value={format(sse, 1)} />
          <Stat
            label="Estado"
            value={state.converged ? "convergido" : "iterando"}
            tone={state.converged ? "good" : "default"}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`K-means con k=${k}, iteración ${state.iteration}`}
      >
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(p.x)}
            cy={y(p.y)}
            r={5}
            fill={state.labels ? plotColour(state.labels[i] ?? 0) : "var(--plot-noise)"}
            fillOpacity={0.75}
          />
        ))}
        {state.centroids.map((_, c) => (
          <polyline
            key={`h${c}`}
            points={state.history.map((h) => `${x(h[c]?.x ?? 0)},${y(h[c]?.y ?? 0)}`).join(" ")}
            fill="none"
            stroke={plotColour(c)}
            strokeDasharray="3 3"
            strokeWidth={1.5}
          />
        ))}
        {state.centroids.map((c, i) => (
          <g key={`c${i}`} transform={`translate(${x(c.x)} ${y(c.y)})`}>
            <path d="M-9,-9 L9,9 M-9,9 L9,-9" stroke="var(--color-surface)" strokeWidth={7} />
            <path d="M-9,-9 L9,9 M-9,9 L9,-9" stroke={plotColour(i)} strokeWidth={4} />
          </g>
        ))}
      </svg>
    </SimFrame>
  );
}
