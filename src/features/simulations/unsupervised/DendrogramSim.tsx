import { useMemo, useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  createRng,
  format,
  linearScale,
  makeBlobs,
  plotColour,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

import { agglomerative, cutTree, type Linkage, type Merge } from "./clustering";

const W = 600;
const H = 320;

interface Node {
  x: number;
  height: number;
}

/** Leaf order and node positions for drawing the dendrogram without crossings. */
function layout(
  n: number,
  merges: readonly Merge[],
): { leafX: Map<number, number>; nodes: Map<number, Node> } {
  const children = new Map(merges.map((m) => [m.id, [m.a, m.b] as const]));
  const order: number[] = [];
  const visit = (id: number): void => {
    const c = children.get(id);
    if (c === undefined) order.push(id);
    else {
      visit(c[0]);
      visit(c[1]);
    }
  };
  const root = merges.at(-1);
  if (root) visit(root.id);
  const leafX = new Map(order.map((leaf, i) => [leaf, i]));
  const nodes = new Map<number, Node>();
  for (let i = 0; i < n; i++) nodes.set(i, { x: leafX.get(i) ?? 0, height: 0 });
  for (const m of merges) {
    const a = nodes.get(m.a);
    const b = nodes.get(m.b);
    nodes.set(m.id, { x: ((a?.x ?? 0) + (b?.x ?? 0)) / 2, height: m.height });
  }
  return { leafX, nodes };
}

export default function DendrogramSim(): ReactNode {
  const [linkage, setLinkage] = useState<Linkage>("ward");
  const [cut, setCut] = useState(0.5);
  const points = useMemo(
    () =>
      makeBlobs(
        createRng(31),
        [
          { x: -1.5, y: 1 },
          { x: 1.2, y: 1.1 },
          { x: 0, y: -1.3 },
        ],
        6,
        0.45,
      ),
    [],
  );
  const merges = useMemo(() => agglomerative(points, linkage), [points, linkage]);
  const maxH = merges.at(-1)?.height ?? 1;
  const cutHeight = cut * maxH;
  const labels = cutTree(points.length, merges, cutHeight);
  const nClusters = new Set(labels).size;
  const { nodes } = layout(points.length, merges);

  const sx = linearScale([-3, 3], [10, 230]);
  const sy = linearScale([-3, 3], [H - 10, 10]);
  const dx = linearScale([0, points.length - 1], [270, W - 16]);
  const dy = linearScale([0, maxH * 1.05], [H - 20, 14]);

  return (
    <SimFrame
      title="Clustering jerárquico y dendrograma"
      intro="El algoritmo aglomerativo une, en cada paso, los dos grupos más cercanos. El dendrograma guarda la historia de uniones; cortarlo a una altura da los clusters. Mueve la línea de corte."
      onReset={() => {
        setLinkage("ward");
        setCut(0.5);
      }}
      controls={
        <>
          <Choice
            label="Criterio de unión"
            value={linkage}
            onChange={setLinkage}
            options={[
              { value: "single", label: "Mínimo" },
              { value: "complete", label: "Máximo" },
              { value: "average", label: "Media" },
              { value: "ward", label: "Ward" },
            ]}
          />
          <Slider
            label="Altura de corte"
            value={cut}
            min={0}
            max={1}
            step={0.01}
            onChange={setCut}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <ControlNote>
            Busca la zona donde las ramas verticales son más largas: ahí cortar es más «natural».
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Clusters" value={nClusters} />
          <Stat label="Altura de corte" value={format(cutHeight)} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Dendrograma con ${linkage}, corte en ${nClusters} clusters`}
      >
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={9}
              fill={plotColour(labels[i] ?? 0)}
              fillOpacity={0.85}
            />
            <text
              x={sx(p.x)}
              y={sy(p.y) + 3.5}
              fontSize={9}
              textAnchor="middle"
              fill="var(--color-surface)"
              fontWeight={700}
            >
              {i}
            </text>
          </g>
        ))}
        {merges.map((m) => {
          const a = nodes.get(m.a);
          const b = nodes.get(m.b);
          if (!a || !b) return null;
          const isBelow = m.height <= cutHeight;
          const colour = isBelow
            ? plotColour(labels[firstLeaf(m.id, merges, points.length)] ?? 0)
            : "var(--plot-axis)";
          return (
            <path
              key={m.id}
              d={`M${dx(a.x)},${dy(a.height)} V${dy(m.height)} H${dx(b.x)} V${dy(b.height)}`}
              fill="none"
              stroke={colour}
              strokeWidth={2}
            />
          );
        })}
        {points.map((_, i) => (
          <text
            key={`l${i}`}
            x={dx(nodes.get(i)?.x ?? 0)}
            y={H - 6}
            fontSize={9}
            textAnchor="middle"
            fill="var(--color-muted)"
          >
            {i}
          </text>
        ))}
        <line
          x1={260}
          x2={W - 8}
          y1={dy(cutHeight)}
          y2={dy(cutHeight)}
          stroke="var(--color-ink)"
          strokeDasharray="6 4"
          strokeWidth={1.5}
        />
      </svg>
    </SimFrame>
  );
}

function firstLeaf(id: number, merges: readonly Merge[], n: number): number {
  let current = id;
  while (current >= n) {
    const m = merges.find((x) => x.id === current);
    if (!m) break;
    current = m.a;
  }
  return current;
}
