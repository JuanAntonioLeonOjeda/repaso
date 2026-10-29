import { useState, type ReactNode } from "react";

import {
  ButtonRow,
  ControlNote,
  format,
  SimButton,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const W = 520;
const H = 340;
const NODES = ["A", "B", "C", "D", "E"] as const;
const POS = [
  { x: 120, y: 80 },
  { x: 400, y: 70 },
  { x: 260, y: 180 },
  { x: 110, y: 280 },
  { x: 410, y: 280 },
];
/** Links of the example web: from → to. E links to nobody (a dead end). */
const LINKS: readonly [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 0],
  [3, 2],
  [3, 0],
  [1, 4],
  [2, 4],
];

/** One power-iteration step of PageRank with damping (teleport probability 1 − d). */
export function pagerankStep(rank: readonly number[], d: number): number[] {
  const n = rank.length;
  const out = rank.map((_, i) => LINKS.filter(([f]) => f === i).length);
  const next = new Array<number>(n).fill((1 - d) / n);
  rank.forEach((r, i) => {
    if (out[i] === 0) {
      // A dead end spreads its rank over every page, otherwise it would leak away.
      for (let j = 0; j < n; j++) next[j] = (next[j] ?? 0) + (d * r) / n;
      return;
    }
    LINKS.filter(([f]) => f === i).forEach(([, t]) => {
      next[t] = (next[t] ?? 0) + (d * r) / (out[i] ?? 1);
    });
  });
  return next;
}

const UNIFORM = NODES.map(() => 1 / NODES.length);

export default function PageRankSim(): ReactNode {
  const [d, setD] = useState(0.85);
  const [rank, setRank] = useState<number[]>(UNIFORM);
  const [iterations, setIterations] = useState(0);

  function iterate(times: number): void {
    let r = rank;
    for (let i = 0; i < times; i++) r = pagerankStep(r, d);
    setRank(r);
    setIterations((n) => n + times);
  }

  return (
    <SimFrame
      title="PageRank como un paseo aleatorio"
      intro="Imagina a alguien que navega haciendo clic al azar en enlaces y, a veces (probabilidad 1 − d), salta a una página cualquiera. El PageRank de una página es la fracción de tiempo que pasa en ella. Itera y mira cómo convergen los tamaños."
      onReset={() => {
        setRank(UNIFORM);
        setIterations(0);
        setD(0.85);
      }}
      controls={
        <>
          <Slider
            label="d (factor de amortiguación)"
            value={d}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => {
              setD(v);
              setRank(UNIFORM);
              setIterations(0);
            }}
            format={(v) => format(v)}
          />
          <ButtonRow>
            <SimButton
              onClick={() => {
                iterate(1);
              }}
            >
              1 iteración
            </SimButton>
            <SimButton
              isPrimary
              onClick={() => {
                iterate(20);
              }}
            >
              20 iteraciones
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Con d = 0 todas valen lo mismo; con d = 1 no hay teletransporte y el resultado depende
            demasiado de la estructura.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Iteraciones" value={iterations} />
          {NODES.map((n, i) => (
            <Stat key={n} label={n} value={format(rank[i] ?? 0, 3)} />
          ))}
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafo de páginas con su PageRank">
        <defs>
          <marker
            id="pr-arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--plot-axis)" />
          </marker>
        </defs>
        {LINKS.map(([f, t], i) => {
          const a = POS[f];
          const b = POS[t];
          if (!a || !b) return null;
          const rb = 18 + 120 * (rank[t] ?? 0);
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const ex = b.x - ((b.x - a.x) / len) * (rb + 4);
          const ey = b.y - ((b.y - a.y) / len) * (rb + 4);
          // Slight curve so A→C and C→A do not overlap
          const mx = (a.x + ex) / 2 + ((ey - a.y) / len) * 18;
          const my = (a.y + ey) / 2 - ((ex - a.x) / len) * 18;
          return (
            <path
              key={i}
              d={`M${a.x},${a.y} Q${mx},${my} ${ex},${ey}`}
              fill="none"
              stroke="var(--plot-axis)"
              strokeWidth={1.5}
              markerEnd="url(#pr-arrow)"
            />
          );
        })}
        {NODES.map((n, i) => {
          const p = POS[i];
          if (!p) return null;
          const r = 18 + 120 * (rank[i] ?? 0);
          return (
            <g key={n}>
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill="var(--subject-color, var(--plot-4))"
                fillOpacity={0.85}
              />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                fontSize={15}
                fontWeight={700}
                fill="var(--color-surface)"
              >
                {n}
              </text>
            </g>
          );
        })}
      </svg>
    </SimFrame>
  );
}
