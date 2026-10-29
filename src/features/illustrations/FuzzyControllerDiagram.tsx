import type { ReactNode } from "react";

import { Figure } from "@/features/ui";

const STEPS = [
  { title: "Borrosificación", sub: "6,5 → bueno 0,5" },
  { title: "Inferencia", sub: "evaluar las reglas" },
  { title: "Agregación", sub: "unir con máx" },
  { title: "Desborrosificación", sub: "centroide → 13,2 %" },
] as const;

/** The fuzzy controller pipeline, from a crisp sensor value to a crisp command. */
export function FuzzyControllerDiagram(): ReactNode {
  const w = 120;
  const gap = 22;
  return (
    <Figure caption="Arquitectura de un controlador borroso. La base de reglas (el conocimiento del experto) alimenta la inferencia.">
      <svg
        viewBox="0 0 640 180"
        width={640}
        role="img"
        aria-label="Entrada nítida, borrosificación, inferencia con la base de reglas, agregación, desborrosificación y salida nítida"
      >
        <defs>
          <marker
            id="fc-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-muted)" />
          </marker>
        </defs>
        <text x={4} y={98} fontSize={11} fill="var(--color-ink)" fontWeight={650}>
          sensor
        </text>
        {STEPS.map((s, i) => {
          const x = 52 + i * (w + gap);
          return (
            <g key={s.title}>
              <rect
                x={x}
                y={70}
                width={w}
                height={50}
                rx={10}
                fill={
                  i === 1
                    ? "var(--subject-soft, var(--color-surface-sunken))"
                    : "var(--color-surface)"
                }
                stroke="var(--subject-color, var(--color-ink))"
                strokeWidth={1.6}
              />
              <text
                x={x + w / 2}
                y={92}
                textAnchor="middle"
                fontSize={12}
                fontWeight={650}
                fill="var(--color-ink)"
              >
                {s.title}
              </text>
              <text
                x={x + w / 2}
                y={109}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-muted)"
              >
                {s.sub}
              </text>
              <path
                d={`M${x - gap + 2},95 h${gap - 6}`}
                stroke="var(--color-muted)"
                markerEnd="url(#fc-arrow)"
              />
            </g>
          );
        })}
        <path
          d={`M${52 + 4 * (w + gap) - gap + 2},95 h${gap - 6}`}
          stroke="var(--color-muted)"
          markerEnd="url(#fc-arrow)"
        />
        <text
          x={52 + 4 * (w + gap) + 2}
          y={98}
          fontSize={11}
          fill="var(--color-ink)"
          fontWeight={650}
        >
          actuador
        </text>
        <rect
          x={52 + (w + gap)}
          y={8}
          width={w}
          height={36}
          rx={8}
          fill="var(--color-task-soft)"
          stroke="var(--color-ink-soft)"
        />
        <text
          x={52 + (w + gap) + w / 2}
          y={31}
          textAnchor="middle"
          fontSize={11}
          fontWeight={650}
          fill="var(--color-ink)"
        >
          Base de reglas
        </text>
        <path
          d={`M${52 + (w + gap) + w / 2},44 v22`}
          stroke="var(--color-muted)"
          markerEnd="url(#fc-arrow)"
        />
        <text x={320} y={160} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
          número nítido → grados de pertenencia → conjunto borroso de salida → número nítido
        </text>
      </svg>
    </Figure>
  );
}
