import { useRef, useState, type ReactNode } from "react";

import {
  ButtonRow,
  ControlNote,
  createRng,
  format,
  gaussian,
  linearScale,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

const W = 520;
const H = 260;
/** Hidden average payout of each slot machine. The agent never sees these. */
const TRUE_MEANS = [1.0, 2.2, 0.4, 1.8, 3.0] as const;

interface State {
  estimates: number[];
  counts: number[];
  total: number;
  steps: number;
  optimalPicks: number;
}

const EMPTY: State = {
  estimates: [0, 0, 0, 0, 0],
  counts: [0, 0, 0, 0, 0],
  total: 0,
  steps: 0,
  optimalPicks: 0,
};

export default function BanditSim(): ReactNode {
  const [epsilon, setEpsilon] = useState(0.1);
  const [state, setState] = useState<State>(EMPTY);
  const [isPlaying, setIsPlaying] = useState(false);
  const rng = useRef(createRng(5));
  const best = TRUE_MEANS.indexOf(Math.max(...TRUE_MEANS) as (typeof TRUE_MEANS)[number]);

  function pull(times: number): void {
    setState((s) => {
      const est = [...s.estimates];
      const cnt = [...s.counts];
      let { total, optimalPicks } = s;
      for (let t = 0; t < times; t++) {
        const explore = rng.current() < epsilon;
        const arm = explore
          ? Math.floor(rng.current() * est.length)
          : est.indexOf(Math.max(...est));
        const reward = (TRUE_MEANS[arm] ?? 0) + gaussian(rng.current);
        cnt[arm] = (cnt[arm] ?? 0) + 1;
        // Incremental mean: Q ← Q + (r − Q) / n
        est[arm] = (est[arm] ?? 0) + (reward - (est[arm] ?? 0)) / (cnt[arm] ?? 1);
        total += reward;
        if (arm === best) optimalPicks++;
      }
      return { estimates: est, counts: cnt, total, steps: s.steps + times, optimalPicks };
    });
  }
  useAnimation(isPlaying && state.steps < 2000, 20, () => {
    pull(5);
  });

  const x = (i: number): number => 60 + i * 95;
  const y = linearScale([-1, 4], [H - 30, 14]);

  return (
    <SimFrame
      title="Explorar o explotar: el bandido multibrazo"
      intro="Cinco tragaperras con premios medios desconocidos. El agente con ε-greedy juega la que cree mejor, salvo un ε% de las veces, que prueba una al azar. Las barras son sus estimaciones; las rayas, la verdad oculta."
      onReset={() => {
        setState(EMPTY);
        setIsPlaying(false);
        rng.current = createRng(5);
      }}
      controls={
        <>
          <Slider
            label="ε (probabilidad de explorar)"
            value={epsilon}
            min={0}
            max={1}
            step={0.01}
            onChange={setEpsilon}
            format={(v) => format(v)}
          />
          <ButtonRow>
            <SimButton
              onClick={() => {
                pull(1);
              }}
            >
              Jugar 1
            </SimButton>
            <SimButton
              onClick={() => {
                pull(100);
              }}
            >
              Jugar 100
            </SimButton>
            <SimButton
              isPrimary
              onClick={() => {
                setIsPlaying((p) => !p);
              }}
            >
              {isPlaying ? "Pausar" : "Reproducir"}
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Con ε = 0 el agente se casa con la primera máquina que le dio algo. Con ε = 1 nunca
            aprovecha lo que sabe.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Tiradas" value={state.steps} />
          <Stat
            label="Premio medio"
            value={format(state.steps ? state.total / state.steps : NaN)}
          />
          <Stat label="Máximo posible" value={format(Math.max(...TRUE_MEANS))} />
          <Stat
            label="% veces la mejor"
            value={`${format(state.steps ? (100 * state.optimalPicks) / state.steps : 0, 0)}%`}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Estimación de cada máquina frente a su valor real"
      >
        <line x1={20} x2={W - 10} y1={y(0)} y2={y(0)} stroke="var(--plot-axis)" />
        {TRUE_MEANS.map((m, i) => {
          const est = state.estimates[i] ?? 0;
          return (
            <g key={i}>
              <rect
                x={x(i) - 22}
                y={Math.min(y(est), y(0))}
                width={44}
                height={Math.abs(y(est) - y(0))}
                rx={4}
                fill="var(--subject-color, var(--plot-5))"
                fillOpacity={0.7}
              />
              <line
                x1={x(i) - 30}
                x2={x(i) + 30}
                y1={y(m)}
                y2={y(m)}
                stroke="var(--color-ink)"
                strokeWidth={2.5}
                strokeDasharray="5 3"
              />
              <text x={x(i)} y={H - 12} textAnchor="middle" fontSize={12} fill="var(--color-ink)">
                🎰 {i + 1}
              </text>
              <text
                x={x(i)}
                y={y(Math.max(est, 0)) - 6}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-muted)"
              >
                n={state.counts[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </SimFrame>
  );
}
