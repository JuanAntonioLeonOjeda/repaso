import { useState, type ReactNode } from "react";

import { Choice, ControlNote, format, SimFrame, Stat } from "@/features/simulations/kit";

import { belief, combine, plausibility, type Masses } from "./dempster-shafer";

// The case from the slides: who killed Karen? Bob (B), Jim (J) or Sally (S).
const NAMES = ["B", "J", "S"] as const;
const SUBSETS = [1, 2, 4, 3, 5, 6, 7];
const label = (mask: number): string => `{${NAMES.filter((_, i) => mask & (1 << i)).join(",")}}`;

// Watson's first assignment (m) and the one after finding the cigarette ends (mr)
const M1: Masses = new Map([
  [1, 0.1],
  [2, 0.2],
  [4, 0.1],
  [3, 0.1],
  [5, 0.1],
  [6, 0.3],
  [7, 0.1],
]);
const M2: Masses = new Map([
  [1, 0.2],
  [2, 0.1],
  [4, 0.05],
  [3, 0.05],
  [5, 0.3],
  [6, 0.1],
  [7, 0.2],
]);

type View = "m1" | "m2" | "combined";

export default function DempsterShaferSim(): ReactNode {
  const [view, setView] = useState<View>("m1");
  const { masses: combined, conflict } = combine(M1, M2);
  const m = view === "m1" ? M1 : view === "m2" ? M2 : combined;
  const W = 520;
  const rowH = 30;

  return (
    <SimFrame
      title="Creencia y plausibilidad (Dempster-Shafer)"
      intro="El ejemplo de Watson. En vez de una probabilidad por sospechoso, se reparte «masa» entre conjuntos («fue Jim o Sally»). Cada hipótesis queda con un intervalo [creencia, plausibilidad]: la barra sólida es lo que la evidencia apoya seguro; la clara, lo que no descarta."
      onReset={() => {
        setView("m1");
      }}
      controls={
        <>
          <Choice
            label="Evidencia"
            value={view}
            onChange={setView}
            options={[
              { value: "m1", label: "Inicial" },
              { value: "m2", label: "Colillas" },
              { value: "combined", label: "Combinada" },
            ]}
          />
          <ControlNote>
            Al combinar, la masa que caería en conjuntos incompatibles (intersección vacía) es el
            conflicto, y se reparte renormalizando.
          </ControlNote>
        </>
      }
      readout={
        <>
          {view === "combined" && <Stat label="Conflicto K" value={format(conflict, 3)} />}
          <Stat label="Masa de {B,J,S} (ignorancia)" value={format(m.get(7) ?? 0, 3)} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${SUBSETS.length * rowH + 20}`}
        role="img"
        aria-label="Intervalos de creencia y plausibilidad por conjunto"
      >
        {SUBSETS.map((s, i) => {
          const bel = belief(m, s);
          const pl = plausibility(m, s);
          const x0 = 110;
          const span = W - x0 - 90;
          return (
            <g key={s} transform={`translate(0 ${i * rowH + 10})`}>
              <text
                x={8}
                y={16}
                fontSize={13}
                fontFamily="var(--font-mono)"
                fill="var(--color-ink)"
              >
                {label(s)}
              </text>
              <rect
                x={x0}
                y={4}
                width={span}
                height={16}
                rx={4}
                fill="var(--color-surface-sunken)"
              />
              <rect
                x={x0}
                y={4}
                width={pl * span}
                height={16}
                rx={4}
                fill="var(--subject-color, var(--plot-6))"
                fillOpacity={0.3}
              />
              <rect
                x={x0}
                y={4}
                width={bel * span}
                height={16}
                rx={4}
                fill="var(--subject-color, var(--plot-6))"
              />
              <text
                x={W - 84}
                y={16}
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill="var(--color-muted)"
              >
                [{format(bel)}, {format(pl)}]
              </text>
            </g>
          );
        })}
      </svg>
    </SimFrame>
  );
}
