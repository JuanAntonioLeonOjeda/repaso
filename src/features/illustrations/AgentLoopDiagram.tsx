import type { ReactNode } from "react";

import { Figure } from "@/features/ui";

/** The reinforcement-learning loop: action goes out, state and reward come back. */
export function AgentLoopDiagram(): ReactNode {
  return (
    <Figure caption="El bucle del refuerzo: en cada paso t el agente ve el estado, actúa, y el entorno responde con el nuevo estado y una recompensa.">
      <svg
        viewBox="0 0 560 230"
        width={560}
        role="img"
        aria-label="Bucle agente-entorno: acción, estado y recompensa"
      >
        <defs>
          <marker
            id="loop-arrow"
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
        <rect
          x={190}
          y={14}
          width={180}
          height={60}
          rx={14}
          fill="var(--subject-soft, var(--color-surface-sunken))"
          stroke="var(--subject-color, var(--color-ink))"
          strokeWidth={2}
        />
        <text
          x={280}
          y={42}
          textAnchor="middle"
          fontSize={16}
          fontWeight={700}
          fill="var(--color-ink)"
        >
          Agente
        </text>
        <text x={280} y={62} textAnchor="middle" fontSize={12} fill="var(--color-muted)">
          política π(a | s)
        </text>
        <rect
          x={190}
          y={156}
          width={180}
          height={60}
          rx={14}
          fill="var(--color-surface-sunken)"
          stroke="var(--color-ink-soft)"
          strokeWidth={2}
        />
        <text
          x={280}
          y={184}
          textAnchor="middle"
          fontSize={16}
          fontWeight={700}
          fill="var(--color-ink)"
        >
          Entorno
        </text>
        <text x={280} y={204} textAnchor="middle" fontSize={12} fill="var(--color-muted)">
          reglas (desconocidas)
        </text>
        <path
          d="M370,44 C470,44 470,186 374,186"
          fill="none"
          stroke="var(--color-ink-soft)"
          strokeWidth={2}
          markerEnd="url(#loop-arrow)"
        />
        <text x={478} y={120} fontSize={13} fontWeight={650} fill="var(--color-ink)">
          acción aₜ
        </text>
        <path
          d="M190,186 C90,186 90,44 186,44"
          fill="none"
          stroke="var(--color-ink-soft)"
          strokeWidth={2}
          markerEnd="url(#loop-arrow)"
        />
        <path
          d="M190,196 C60,196 60,58 186,58"
          fill="none"
          stroke="var(--color-task)"
          strokeWidth={3}
          markerEnd="url(#loop-arrow)"
        />
        <text x={12} y={108} fontSize={13} fontWeight={650} fill="var(--color-ink)">
          estado sₜ₊₁
        </text>
        <text x={12} y={128} fontSize={13} fontWeight={650} fill="var(--color-ink)">
          recompensa rₜ₊₁
        </text>
      </svg>
    </Figure>
  );
}
