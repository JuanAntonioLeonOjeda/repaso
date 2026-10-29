import type { ReactNode } from "react";

import { Figure } from "@/features/ui";

const PHASES = ["Negocio", "Datos", "Preparación", "Modelado", "Evaluación", "Despliegue"] as const;

/** CRISP-DM as a cycle around the data, with the usual way back from evaluation. */
export function CrispDiagram(): ReactNode {
  const cx = 260;
  const cy = 170;
  const r = 125;
  const pos = PHASES.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / PHASES.length;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return (
    <Figure caption="CRISP-DM: seis fases en ciclo. Las flechas finas son las vueltas atrás más habituales.">
      <svg
        viewBox="0 0 520 340"
        width={520}
        role="img"
        aria-label="Ciclo CRISP-DM: negocio, datos, preparación, modelado, evaluación y despliegue"
      >
        <defs>
          <marker
            id="crisp-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-ink-soft)" />
          </marker>
        </defs>
        <circle cx={cx} cy={cy} r={48} fill="var(--subject-soft, var(--color-surface-sunken))" />
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fill="var(--color-ink)"
        >
          Datos
        </text>
        {pos.map((p, i) => {
          const next = pos[(i + 1) % pos.length] ?? p;
          const mx = (p.x + next.x) / 2;
          const my = (p.y + next.y) / 2;
          const k = 1.18;
          return (
            <path
              key={`a${i}`}
              d={`M${p.x + (next.x - p.x) * 0.28},${p.y + (next.y - p.y) * 0.28} Q${cx + (mx - cx) * k},${cy + (my - cy) * k} ${p.x + (next.x - p.x) * 0.72},${p.y + (next.y - p.y) * 0.72}`}
              fill="none"
              stroke="var(--color-ink-soft)"
              strokeWidth={2}
              markerEnd="url(#crisp-arrow)"
            />
          );
        })}
        {/* Typical loops back: data ↔ business, evaluation → business, modelling ↔ preparation */}
        {[
          [1, 0],
          [3, 2],
          [4, 0],
        ].map(([from, to]) => {
          const a = pos[from ?? 0];
          const b = pos[to ?? 0];
          if (!a || !b) return null;
          return (
            <path
              key={`b${from}${to}`}
              d={`M${a.x},${a.y} Q${cx + (a.x + b.x - 2 * cx) * 0.15},${cy + (a.y + b.y - 2 * cy) * 0.15} ${b.x},${b.y}`}
              fill="none"
              stroke="var(--subject-color, var(--color-muted))"
              strokeWidth={1.2}
              strokeDasharray="4 4"
              markerEnd="url(#crisp-arrow)"
              opacity={0.7}
            />
          );
        })}
        {pos.map((p, i) => (
          <g key={PHASES[i]}>
            <rect
              x={p.x - 58}
              y={p.y - 18}
              width={116}
              height={36}
              rx={18}
              fill="var(--color-surface)"
              stroke="var(--subject-color, var(--color-ink))"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y + 5}
              textAnchor="middle"
              fontSize={13}
              fontWeight={650}
              fill="var(--color-ink)"
            >
              {i + 1}. {PHASES[i]}
            </text>
          </g>
        ))}
      </svg>
    </Figure>
  );
}
