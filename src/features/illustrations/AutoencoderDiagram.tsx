import type { ReactNode } from "react";

import { Figure } from "@/features/ui";

const LAYERS = [
  { n: 8, label: "entrada x" },
  { n: 5, label: "" },
  { n: 2, label: "latente z" },
  { n: 5, label: "" },
  { n: 8, label: "reconstrucción x̂" },
] as const;

/** Encoder → bottleneck → decoder, the shape every autoencoder shares. */
export function AutoencoderDiagram(): ReactNode {
  const W = 560;
  const H = 240;
  const x = (i: number): number => 60 + i * ((W - 120) / (LAYERS.length - 1));
  const y = (j: number, n: number): number => H / 2 + (j - (n - 1) / 2) * 22;
  return (
    <Figure caption="Un autoencoder: el codificador comprime hasta el cuello de botella z y el decodificador intenta reconstruir la entrada. Se entrena sin etiquetas, minimizando ‖x − x̂‖².">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        role="img"
        aria-label="Diagrama de autoencoder con codificador, espacio latente y decodificador"
      >
        {LAYERS.slice(0, -1).map((layer, i) => {
          const next = LAYERS[i + 1];
          if (!next) return null;
          return Array.from({ length: layer.n }).flatMap((_, a) =>
            Array.from({ length: next.n }).map((__, b) => (
              <line
                key={`${i}-${a}-${b}`}
                x1={x(i)}
                y1={y(a, layer.n)}
                x2={x(i + 1)}
                y2={y(b, next.n)}
                stroke="var(--plot-axis)"
                strokeOpacity={0.35}
              />
            )),
          );
        })}
        {LAYERS.map((layer, i) =>
          Array.from({ length: layer.n }).map((_, j) => (
            <circle
              key={`n${i}-${j}`}
              cx={x(i)}
              cy={y(j, layer.n)}
              r={7}
              fill={i === 2 ? "var(--subject-color, var(--plot-4))" : "var(--color-surface)"}
              stroke="var(--color-ink)"
              strokeWidth={1.5}
            />
          )),
        )}
        {LAYERS.map((layer, i) => (
          <text
            key={`l${i}`}
            x={x(i)}
            y={H - 18}
            textAnchor="middle"
            fontSize={12}
            fill="var(--color-ink)"
            fontWeight={600}
          >
            {layer.label}
          </text>
        ))}
        <text
          x={(x(0) + x(2)) / 2}
          y={20}
          textAnchor="middle"
          fontSize={12}
          fill="var(--color-muted)"
        >
          codificador
        </text>
        <text
          x={(x(2) + x(4)) / 2}
          y={20}
          textAnchor="middle"
          fontSize={12}
          fill="var(--color-muted)"
        >
          decodificador
        </text>
      </svg>
    </Figure>
  );
}
