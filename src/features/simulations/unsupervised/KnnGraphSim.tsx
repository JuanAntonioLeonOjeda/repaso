import { useMemo, useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  createRng,
  distance,
  gaussian,
  linearScale,
  plotColour,
  range,
  SimFrame,
  Slider,
  Stat,
  type Point,
} from "@/features/simulations/kit";

import { assign, kmeansPlusPlus, updateCentroids } from "./clustering";

const W = 520;
const H = 380;
type View = "graph" | "kmeans";

function circles(rng: () => number): Point[] {
  return range(120).map((i) => {
    const t = rng() * 2 * Math.PI;
    const r = i < 60 ? 0.9 : 2.2;
    return { x: Math.cos(t) * r + gaussian(rng) * 0.08, y: Math.sin(t) * r + gaussian(rng) * 0.08 };
  });
}

/** Symmetric kNN graph and its connected components (union–find). */
export function knnComponents(
  points: readonly Point[],
  k: number,
): { edges: [number, number][]; labels: number[]; components: number } {
  const edges: [number, number][] = [];
  points.forEach((p, i) => {
    points
      .map((q, j) => ({ j, d: distance(p, q) }))
      .filter((n) => n.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
      .forEach((n) => edges.push([i, n.j]));
  });
  const parent = points.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i] ?? i] ?? i;
    return i;
  };
  edges.forEach(([a, b]) => {
    parent[find(a)] = find(b);
  });
  const ids = new Map<number, number>();
  const labels = points.map((_, i) => {
    const r = find(i);
    if (!ids.has(r)) ids.set(r, ids.size);
    return ids.get(r) ?? 0;
  });
  return { edges, labels, components: ids.size };
}

export default function KnnGraphSim(): ReactNode {
  const [k, setK] = useState(3);
  const [view, setView] = useState<View>("graph");
  const points = useMemo(() => circles(createRng(2)), []);
  const graph = useMemo(() => knnComponents(points, k), [points, k]);
  const kmLabels = useMemo(() => {
    let c = kmeansPlusPlus(points, 2, createRng(1));
    let l = assign(points, c);
    for (let i = 0; i < 15; i++) {
      c = updateCentroids(points, l, c);
      l = assign(points, c);
    }
    return l;
  }, [points]);

  const x = linearScale([-3, 3], [(W - H) / 2, (W + H) / 2]);
  const y = linearScale([-3, 3], [H, 0]);
  const labels = view === "graph" ? graph.labels : kmLabels;

  return (
    <SimFrame
      title="La idea del clustering espectral: piensa en grafos"
      intro="Dos anillos concéntricos. K-means los corta por la mitad porque mide distancias al centro. Si en vez de eso conectamos cada punto con sus k vecinos, los anillos quedan como piezas separadas del grafo: eso es lo que el clustering espectral encuentra con los vectores propios del laplaciano."
      onReset={() => {
        setK(3);
        setView("graph");
      }}
      controls={
        <>
          <Choice
            label="Ver"
            value={view}
            onChange={setView}
            options={[
              { value: "graph", label: "Grafo kNN" },
              { value: "kmeans", label: "K-means" },
            ]}
          />
          <Slider label="k vecinos del grafo" value={k} min={1} max={12} onChange={setK} />
          <ControlNote>
            Con k muy pequeño el grafo se rompe en muchos trozos; con k grande acaba uniendo los dos
            anillos.
          </ControlNote>
        </>
      }
      readout={
        <Stat
          label="Componentes conexas"
          value={graph.components}
          tone={graph.components === 2 ? "good" : "default"}
        />
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          view === "graph"
            ? `Grafo de ${k} vecinos con ${graph.components} componentes`
            : "K-means sobre los anillos"
        }
      >
        {view === "graph" &&
          graph.edges.map(([a, b], i) => {
            const pa = points[a];
            const pb = points[b];
            return pa && pb ? (
              <line
                key={i}
                x1={x(pa.x)}
                y1={y(pa.y)}
                x2={x(pb.x)}
                y2={y(pb.y)}
                stroke="var(--plot-axis)"
                strokeOpacity={0.4}
              />
            ) : null;
          })}
        {points.map((p, i) => (
          <circle key={i} cx={x(p.x)} cy={y(p.y)} r={4} fill={plotColour(labels[i] ?? 0)} />
        ))}
      </svg>
    </SimFrame>
  );
}
