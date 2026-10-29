import { useRef, useState, type ReactNode } from "react";

import {
  ButtonRow,
  ControlNote,
  createRng,
  format,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

import { ACTIONS, cellAt, COLS, createQ, greedy, ROWS, runEpisode } from "./gridworld";

const CELL = 70;
const W = COLS * CELL;
const H = ROWS * CELL;

export default function GridWorldSim(): ReactNode {
  const [alpha, setAlpha] = useState(0.5);
  const [gamma, setGamma] = useState(0.9);
  const [epsilon, setEpsilon] = useState(0.2);
  const [q, setQ] = useState(createQ);
  const [rewards, setRewards] = useState<number[]>([]);
  const [lastPath, setLastPath] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const rng = useRef(createRng(1));

  function train(episodes: number): void {
    let current = q;
    const newRewards: number[] = [];
    let path: number[] = [];
    for (let i = 0; i < episodes; i++) {
      const result = runEpisode(current, { alpha, gamma, epsilon }, rng.current);
      current = result.q;
      newRewards.push(result.totalReward);
      path = result.path;
    }
    setQ(current);
    setRewards((r) => [...r, ...newRewards].slice(-300));
    setLastPath(path);
  }
  useAnimation(isPlaying, 8, () => {
    train(1);
  });

  const values = q.map((row) => Math.max(...row));
  const maxAbs = Math.max(1, ...values.map(Math.abs));
  const recent = rewards.slice(-20);
  const avg = recent.length ? recent.reduce((s, v) => s + v, 0) / recent.length : NaN;
  const maxR = 10;
  const minR = -12;

  return (
    <SimFrame
      title="Q-learning en un GridWorld"
      intro="El agente (sale de S) aprende solo, a base de prueba y error, a llegar a la meta G (+10) evitando los agujeros X (−10). Cada paso cuesta −0,1. El color de cada casilla es su valor V(s) = máx Q(s,a) y la flecha, la acción que el agente cree mejor."
      onReset={() => {
        setQ(createQ());
        setRewards([]);
        setLastPath([]);
        setIsPlaying(false);
        rng.current = createRng(1);
      }}
      controls={
        <>
          <Slider
            label="α (learning rate)"
            value={alpha}
            min={0.05}
            max={1}
            step={0.05}
            onChange={setAlpha}
            format={(v) => format(v)}
          />
          <Slider
            label="γ (descuento)"
            value={gamma}
            min={0}
            max={0.99}
            step={0.01}
            onChange={setGamma}
            format={(v) => format(v)}
          />
          <Slider
            label="ε (exploración)"
            value={epsilon}
            min={0}
            max={1}
            step={0.05}
            onChange={setEpsilon}
            format={(v) => format(v)}
          />
          <ButtonRow>
            <SimButton
              onClick={() => {
                train(1);
              }}
            >
              1 episodio
            </SimButton>
            <SimButton
              onClick={() => {
                train(50);
              }}
            >
              50 episodios
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
            Prueba ε = 0 desde cero: sin explorar, puede quedarse atascado. Y γ = 0: solo le importa
            el siguiente paso, así que el valor de la meta no se propaga.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Episodios" value={rewards.length} />
          <Stat
            label="Recompensa media (últimos 20)"
            value={format(avg, 1)}
            tone={avg > 8 ? "good" : "default"}
          />
          <svg
            viewBox="0 0 160 44"
            width={160}
            height={44}
            role="img"
            aria-label="Recompensa por episodio"
            style={{ background: "transparent" }}
          >
            <line
              x1={0}
              x2={160}
              y1={44 - ((0 - minR) / (maxR - minR)) * 44}
              y2={44 - ((0 - minR) / (maxR - minR)) * 44}
              stroke="var(--plot-grid)"
            />
            <polyline
              points={rewards
                .slice(-160)
                .map((r, i) => `${i},${44 - ((Math.max(minR, r) - minR) / (maxR - minR)) * 44}`)
                .join(" ")}
              fill="none"
              stroke="var(--subject-color, var(--plot-5))"
              strokeWidth={1.2}
            />
          </svg>
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Cuadrícula con el valor y la mejor acción de cada casilla"
        style={{ maxWidth: 520 }}
      >
        {range(ROWS * COLS).map((s) => {
          const r = Math.floor(s / COLS);
          const c = s % COLS;
          const cell = cellAt(r, c);
          const v = values[s] ?? 0;
          const fill =
            cell === "#"
              ? "var(--color-ink)"
              : cell === "G"
                ? "var(--plot-3)"
                : cell === "X"
                  ? "var(--plot-7)"
                  : v >= 0
                    ? "var(--plot-3)"
                    : "var(--plot-7)";
          const opacity = cell === "." || cell === "S" ? Math.min(0.75, Math.abs(v) / maxAbs) : 0.9;
          const best = greedy(q[s] ?? []);
          const hasLearnt = (q[s] ?? []).some((x) => x !== 0);
          return (
            <g key={s} transform={`translate(${c * CELL} ${r * CELL})`}>
              <rect
                width={CELL - 2}
                height={CELL - 2}
                x={1}
                y={1}
                rx={6}
                fill={fill}
                fillOpacity={opacity}
                stroke="var(--color-line)"
              />
              {(cell === "." || cell === "S") && (
                <>
                  {hasLearnt && (
                    <text
                      x={CELL / 2}
                      y={CELL / 2 + 2}
                      textAnchor="middle"
                      fontSize={22}
                      fill="var(--color-ink)"
                    >
                      {ACTIONS[best]?.arrow}
                    </text>
                  )}
                  <text
                    x={CELL / 2}
                    y={CELL - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--color-ink)"
                    opacity={0.75}
                  >
                    {format(v, 1)}
                  </text>
                </>
              )}
              {cell !== "." && cell !== "#" && (
                <text x={8} y={18} fontSize={13} fontWeight={800} fill="var(--color-ink)">
                  {cell}
                </text>
              )}
            </g>
          );
        })}
        {lastPath.length > 1 && (
          <polyline
            points={lastPath
              .map(
                (s) => `${(s % COLS) * CELL + CELL / 2},${Math.floor(s / COLS) * CELL + CELL / 2}`,
              )
              .join(" ")}
            fill="none"
            stroke="var(--plot-5)"
            strokeWidth={3}
            strokeOpacity={0.7}
            strokeLinejoin="round"
          />
        )}
      </svg>
    </SimFrame>
  );
}
