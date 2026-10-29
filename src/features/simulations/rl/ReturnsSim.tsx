import { useState, type ReactNode } from "react";

import {
  ControlNote,
  format,
  linearScale,
  SimFrame,
  Slider,
  Stat,
  Toggle,
} from "@/features/simulations/kit";

const W = 560;
const H = 260;
// A short episode: small costs, then a big reward at the end (e.g. scoring in Pong).
const REWARDS = [0, 0, -1, 0, 0, 0, -1, 0, 0, 10] as const;

/** Discounted return G_t = r_t + γ r_{t+1} + γ² r_{t+2} + … computed backwards. */
export function discountedReturns(rewards: readonly number[], gamma: number): number[] {
  const out = new Array<number>(rewards.length).fill(0);
  let running = 0;
  for (let t = rewards.length - 1; t >= 0; t--) {
    running = (rewards[t] ?? 0) + gamma * running;
    out[t] = running;
  }
  return out;
}

export default function ReturnsSim(): ReactNode {
  const [gamma, setGamma] = useState(0.9);
  const [isNormalised, setIsNormalised] = useState(false);
  const raw = discountedReturns(REWARDS, gamma);
  const mean = raw.reduce((s, v) => s + v, 0) / raw.length;
  const sd = Math.sqrt(raw.reduce((s, v) => s + (v - mean) ** 2, 0) / raw.length) || 1;
  const G = isNormalised ? raw.map((v) => (v - mean) / sd) : raw;
  const lim = Math.max(10, ...G.map(Math.abs));
  const y = linearScale([-lim, lim], [H - 20, 20]);
  const bw = (W - 40) / REWARDS.length;

  return (
    <SimFrame
      title="Recompensas descontadas"
      intro="En Policy Gradient cada acción se pondera por el retorno G_t que vino después. γ decide cuánto pesa el futuro: con γ cerca de 1, las acciones del principio también reciben el mérito del +10 final."
      onReset={() => {
        setGamma(0.9);
        setIsNormalised(false);
      }}
      controls={
        <>
          <Slider
            label="γ (descuento)"
            value={gamma}
            min={0}
            max={1}
            step={0.01}
            onChange={setGamma}
            format={(v) => format(v)}
          />
          <Toggle
            label="Normalizar (restar media, dividir por σ)"
            isOn={isNormalised}
            onChange={setIsNormalised}
          />
          <ControlNote>
            Normalizar actúa como una línea base: la mitad de las acciones se refuerzan y la otra
            mitad se penalizan, y la varianza baja.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="G₀ (retorno desde el inicio)" value={format(raw[0] ?? 0)} />
          <Stat
            label="Horizonte efectivo ≈ 1/(1−γ)"
            value={gamma >= 0.999 ? "∞" : format(1 / (1 - gamma), 1)}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Recompensa y retorno descontado por paso"
      >
        <line x1={20} x2={W - 20} y1={y(0)} y2={y(0)} stroke="var(--plot-axis)" />
        {REWARDS.map((r, t) => (
          <g key={t} transform={`translate(${20 + t * bw} 0)`}>
            <rect
              x={bw * 0.15}
              width={bw * 0.3}
              y={Math.min(y(r), y(0))}
              height={Math.abs(y(r) - y(0))}
              fill="var(--plot-noise)"
            />
            <rect
              x={bw * 0.5}
              width={bw * 0.35}
              y={Math.min(y(G[t] ?? 0), y(0))}
              height={Math.abs(y(G[t] ?? 0) - y(0))}
              fill="var(--subject-color, var(--plot-5))"
            />
            <text x={bw / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
              t={t}
            </text>
          </g>
        ))}
        <text x={24} y={16} fontSize={11} fill="var(--color-muted)">
          ■ gris: recompensa r_t · ■ color: retorno G_t
        </text>
      </svg>
    </SimFrame>
  );
}
