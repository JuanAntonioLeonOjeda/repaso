import { useMemo, useState, type ReactNode } from "react";

import {
  ControlNote,
  format,
  linearScale,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

import { nextToken } from "./llm-next-token";
import { entropyBits, filtered, keptTokens, softmaxWithTemperature } from "./sampling";

const W = 560;
const ROW = 17;
const SHOWN = 15;
const LABEL_W = 120;

/** "Show" a token: its leading space as a visible mark, so " Sancho" and "Sancho" differ. */
function show(token: string): string {
  return token.replace(/^ /, "␣").replace(/\n/g, "⏎");
}

/** Temperature, top-k and top-p on the real next-token distribution of the tutorial's GPT. */
export default function SamplingSim(): ReactNode {
  const [temperature, setTemperature] = useState(1);
  const [topK, setTopK] = useState(30);
  const [topP, setTopP] = useState(1);
  const probs = useMemo(() => softmaxWithTemperature(nextToken.logits, temperature), [temperature]);
  const kept = useMemo(() => keptTokens(probs, topK, topP), [probs, topK, topP]);
  const final = useMemo(() => filtered(probs, kept), [probs, kept]);
  const survivors = kept.filter(Boolean).length;
  const best = final[0] ?? 0;
  const x = linearScale([0, 1], [LABEL_W, W - 60]);
  const H = SHOWN * ROW + 8;

  return (
    <SimFrame
      title="Elegir la siguiente palabra"
      intro={`Las barras son las probabilidades reales que da el GPT del tutorial para el token que sigue a «${nextToken.prompt}» (los 30 más probables). Baja la temperatura hasta 0,3 y mira cómo se concentra todo en uno; súbela a 2 y mira cómo se reparte. Después recorta con top-k y top-p.`}
      onReset={() => {
        setTemperature(1);
        setTopK(30);
        setTopP(1);
      }}
      controls={
        <>
          <Slider
            label="Temperatura"
            value={temperature}
            min={0.1}
            max={2}
            step={0.1}
            onChange={setTemperature}
            format={(v) => format(v, 1)}
          />
          <Slider label="Top-k" value={topK} min={1} max={30} onChange={setTopK} />
          <Slider
            label="Top-p"
            value={topP}
            min={0.1}
            max={1}
            step={0.05}
            onChange={setTopP}
            format={(v) => format(v, 2)}
          />
          <ControlNote>
            Las probabilidades se recalculan entre esos 30 tokens y solo se dibujan los 15 primeros.
            Los que quedan fuera de top-k o top-p salen tachados y su probabilidad pasa a los demás.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Tokens que pueden salir" value={survivors} />
          <Stat label="Probabilidad del más probable" value={`${format(best * 100, 1)}%`} />
          <Stat label="Entropía" value={`${format(entropyBits(final), 2)} bits`} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Con temperatura ${format(temperature, 1)}, top-k ${topK} y top-p ${format(topP, 2)} pueden salir ${survivors} tokens; el más probable, «${nextToken.tokens[0].trim()}», tiene un ${format(best * 100, 1)}% y la entropía es de ${format(entropyBits(final), 2)} bits`}
      >
        {nextToken.tokens.slice(0, SHOWN).map((token, i) => {
          const y = 4 + i * ROW;
          const p = final[i] ?? 0;
          const isKept = kept[i] === true;
          return (
            <g key={token + String(i)}>
              <text
                x={LABEL_W - 8}
                y={y + 12}
                textAnchor="end"
                fontSize={12}
                fontFamily="var(--font-mono)"
                fill="var(--color-ink-soft)"
                textDecoration={isKept ? undefined : "line-through"}
              >
                {show(token)}
              </text>
              <rect
                x={LABEL_W}
                y={y + 2}
                width={Math.max(0, x(p) - LABEL_W)}
                height={ROW - 5}
                rx={2}
                fill="var(--subject-color)"
                opacity={isKept ? 1 : 0.4}
              />
              <text x={x(p) + 6} y={y + 12} fontSize={11} fill="var(--color-muted)">
                {isKept ? `${format(p * 100, 1)}%` : "fuera"}
              </text>
            </g>
          );
        })}
      </svg>
    </SimFrame>
  );
}
