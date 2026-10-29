import { useMemo, useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  createRng,
  gaussian,
  linearScale,
  plotColour,
  range,
  SimFrame,
  Slider,
  Stat,
  type Point,
} from "@/features/simulations/kit";

import { assign, kmeansPlusPlus, updateCentroids, dbscan } from "./clustering";

const W = 520;
const H = 360;
type Algo = "dbscan" | "kmeans";

function moons(rng: () => number): Point[] {
  const upper = range(70).map((i) => {
    const t = (Math.PI * i) / 69;
    return {
      x: Math.cos(t) * 1.4 - 0.7 + gaussian(rng) * 0.09,
      y: Math.sin(t) * 1.4 - 0.3 + gaussian(rng) * 0.09,
    };
  });
  const lower = range(70).map((i) => {
    const t = (Math.PI * i) / 69;
    return {
      x: 0.7 - Math.cos(t) * 1.4 + gaussian(rng) * 0.09,
      y: 0.3 - Math.sin(t) * 1.4 + gaussian(rng) * 0.09,
    };
  });
  const noise = range(14).map(() => ({ x: rng() * 6 - 3, y: rng() * 5 - 2.5 }));
  return [...upper, ...lower, ...noise];
}

function kmeans(points: readonly Point[], k: number): number[] {
  let centroids = kmeansPlusPlus(points, k, createRng(3));
  let labels = assign(points, centroids);
  for (let i = 0; i < 20; i++) {
    centroids = updateCentroids(points, labels, centroids);
    labels = assign(points, centroids);
  }
  return labels;
}

export default function DbscanSim(): ReactNode {
  const [eps, setEps] = useState(0.35);
  const [minPts, setMinPts] = useState(4);
  const [algo, setAlgo] = useState<Algo>("dbscan");
  const points = useMemo(() => moons(createRng(10)), []);
  const result = useMemo(() => dbscan(points, eps, minPts), [points, eps, minPts]);
  const kmLabels = useMemo(() => kmeans(points, 2), [points]);
  const nClusters = new Set(result.labels.filter((l) => l >= 0)).size;
  const nNoise = result.roles.filter((r) => r === "noise").length;

  const x = linearScale([-3, 3], [0, W]);
  const y = linearScale([-2.5, 2.5], [H, 0]);
  const r = Math.abs(x(eps) - x(0));

  return (
    <SimFrame
      title="DBSCAN: clusters por densidad"
      intro="Dos lunas con algo de ruido alrededor. K-means solo sabe hacer grupos «redondos»; DBSCAN une puntos que están en zonas densas y deja el ruido fuera. Cambia ε y minPts."
      onReset={() => {
        setEps(0.35);
        setMinPts(4);
        setAlgo("dbscan");
      }}
      controls={
        <>
          <Choice
            label="Algoritmo"
            value={algo}
            onChange={setAlgo}
            options={[
              { value: "dbscan", label: "DBSCAN" },
              { value: "kmeans", label: "K-means (k=2)" },
            ]}
          />
          <Slider label="ε (radio)" value={eps} min={0.1} max={1} step={0.01} onChange={setEps} />
          <Slider label="minPts" value={minPts} min={2} max={12} onChange={setMinPts} />
          <ControlNote>
            Puntos grandes: núcleo. Medianos: frontera. Grises con aspa: ruido. El círculo muestra ε
            alrededor de un punto.
          </ControlNote>
        </>
      }
      readout={
        algo === "dbscan" ? (
          <>
            <Stat label="Clusters" value={nClusters} tone={nClusters === 2 ? "good" : "default"} />
            <Stat label="Puntos de ruido" value={nNoise} />
            <Stat
              label="Núcleo / frontera"
              value={`${result.roles.filter((ro) => ro === "core").length} / ${result.roles.filter((ro) => ro === "border").length}`}
            />
          </>
        ) : (
          <Stat label="Clusters" value="2 (impuestos)" />
        )
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Resultado de ${algo === "dbscan" ? "DBSCAN" : "K-means"}`}
      >
        {algo === "dbscan" && points[20] && (
          <circle
            cx={x(points[20].x)}
            cy={y(points[20].y)}
            r={r}
            fill="var(--color-ink)"
            fillOpacity={0.06}
            stroke="var(--color-ink)"
            strokeDasharray="4 3"
          />
        )}
        {points.map((p, i) => {
          if (algo === "kmeans")
            return (
              <circle key={i} cx={x(p.x)} cy={y(p.y)} r={4.5} fill={plotColour(kmLabels[i] ?? 0)} />
            );
          const role = result.roles[i];
          const label = result.labels[i] ?? -1;
          if (role === "noise") {
            return (
              <path
                key={i}
                d={`M${x(p.x) - 4},${y(p.y) - 4} l8,8 m0,-8 l-8,8`}
                stroke="var(--plot-noise)"
                strokeWidth={2}
              />
            );
          }
          return (
            <circle
              key={i}
              cx={x(p.x)}
              cy={y(p.y)}
              r={role === "core" ? 5 : 3.5}
              fill={plotColour(label)}
              fillOpacity={role === "core" ? 0.9 : 0.55}
            />
          );
        })}
      </svg>
    </SimFrame>
  );
}
