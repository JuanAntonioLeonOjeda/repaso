import { useState, type ReactNode } from "react";

import { Choice, ControlNote, format, SimFrame, Slider, Stat } from "@/features/simulations/kit";

import { CLASS_NAMES, classWeights } from "./bone";

const W = 520;
const H = 220;
type Scheme = "inverse" | "effective";

export default function ClassWeightsSim(): ReactNode {
  // Training images per class in the TFM split: sano, osteopenia, osteoporosis
  const [minority, setMinority] = useState(314);
  const [beta, setBeta] = useState(0.999);
  const [scheme, setScheme] = useState<Scheme>("effective");
  const counts = [406, 411, minority];
  const weights = classWeights(counts, scheme, beta);
  const maxW = Math.max(3, ...weights);

  return (
    <SimFrame
      title="Pesos de clase: inverso frente a número efectivo"
      intro="En entrenamiento hay 406 imágenes sanas, 411 de osteopenia y 314 de osteoporosis. Para que la clase pequeña no pese menos en la pérdida se le da más peso. El TFM probó dos fórmulas: inversa a la frecuencia y el «número efectivo de muestras» de Cui et al. (2019). Reduce la clase minoritaria y compara."
      onReset={() => {
        setMinority(314);
        setBeta(0.999);
        setScheme("effective");
      }}
      controls={
        <>
          <Choice
            label="Esquema"
            value={scheme}
            onChange={setScheme}
            options={[
              { value: "inverse", label: "Inverso" },
              { value: "effective", label: "Efectivo" },
            ]}
          />
          <Slider
            label="Imágenes de osteoporosis"
            value={minority}
            min={10}
            max={600}
            step={2}
            onChange={setMinority}
          />
          {scheme === "effective" && (
            <Slider
              label="β"
              value={beta}
              min={0.9}
              max={0.9999}
              step={0.0001}
              onChange={setBeta}
              format={(v) => v.toFixed(4)}
            />
          )}
          <ControlNote>
            Con β → 1 el número efectivo se parece al recuento real (pesos casi inversos); con β
            pequeño todas las clases «saturan» y los pesos se igualan. Es una forma de no exagerar
            la corrección.
          </ControlNote>
        </>
      }
      readout={
        <>
          {CLASS_NAMES.map((name, i) => (
            <Stat
              key={name}
              label={`Peso ${name.toLowerCase()} (n = ${counts[i]})`}
              value={format(weights[i] ?? 0, 3)}
            />
          ))}
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Pesos de clase con el esquema ${scheme}`}
      >
        {CLASS_NAMES.map((name, i) => {
          const w = weights[i] ?? 0;
          const bx = 60 + i * 160;
          const bh = (w / maxW) * 150;
          return (
            <g key={name}>
              <rect
                x={bx}
                y={180 - bh}
                width={90}
                height={bh}
                rx={6}
                fill="var(--subject-color, var(--plot-1))"
                fillOpacity={0.75}
              />
              <text
                x={bx + 45}
                y={172 - bh}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="var(--color-ink)"
              >
                {format(w, 2)}
              </text>
              <text x={bx + 45} y={200} textAnchor="middle" fontSize={12} fill="var(--color-ink)">
                {name}
              </text>
              <text x={bx + 45} y={215} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                n = {counts[i]}
              </text>
            </g>
          );
        })}
        <line
          x1={40}
          x2={W - 20}
          y1={180 - 150 / maxW}
          y2={180 - 150 / maxW}
          stroke="var(--plot-axis)"
          strokeDasharray="4 3"
        />
        <text
          x={W - 22}
          y={176 - 150 / maxW}
          textAnchor="end"
          fontSize={10}
          fill="var(--color-muted)"
        >
          peso 1
        </text>
      </svg>
    </SimFrame>
  );
}
