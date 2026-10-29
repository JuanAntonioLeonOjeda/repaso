import { useState, type ReactNode } from "react";

import {
  Axes,
  ButtonRow,
  ControlNote,
  format,
  linearScale,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

const W = 560;
const H = 300;
const M = { top: 16, right: 16, bottom: 34, left: 40 };

// Two valleys: a local minimum near x ≈ 1.64 and the global one near x ≈ −1.81.
const f = (x: number): number => x ** 4 / 4 - (3 * x ** 2) / 2 + x / 2 + 3.5;
const df = (x: number): number => x ** 3 - 3 * x + 0.5;

export default function GradientDescentSim(): ReactNode {
  const [start, setStart] = useState(2.4);
  const [lr, setLr] = useState(0.05);
  const [path, setPath] = useState<number[]>([2.4]);
  const [isPlaying, setIsPlaying] = useState(false);
  const current = path.at(-1) ?? start;
  const diverged = !Number.isFinite(current) || Math.abs(current) > 6;
  const converged = Math.abs(df(current)) < 1e-3;

  function step(): void {
    setPath((p) => {
      const x = p.at(-1) ?? start;
      return [...p, x - lr * df(x)];
    });
  }
  useAnimation(isPlaying && !diverged && !converged && path.length < 200, 6, step);

  function restart(nextStart = start): void {
    setIsPlaying(false);
    setPath([nextStart]);
  }

  const x = linearScale([-3, 3], [M.left, W - M.right]);
  const y = linearScale([0, 8], [H - M.bottom, M.top]);
  const clampY = (v: number): number => y(Math.max(0, Math.min(8, v)));

  return (
    <SimFrame
      title="Descenso del gradiente en una dimensión"
      intro="En cada paso: x ← x − η · f′(x). La pendiente dice hacia dónde bajar y η (learning rate) cuánto. Elige el punto de partida y η, y mira dónde acaba."
      onReset={() => {
        setStart(2.4);
        setLr(0.05);
        restart(2.4);
      }}
      controls={
        <>
          <Slider
            label="Punto de partida x₀"
            value={start}
            min={-2.8}
            max={2.8}
            step={0.1}
            onChange={(v) => {
              setStart(v);
              restart(v);
            }}
            format={(v) => format(v, 1)}
          />
          <Slider
            label="Learning rate η"
            value={lr}
            min={0.005}
            max={0.7}
            step={0.005}
            onChange={(v) => {
              setLr(v);
              restart();
            }}
            format={(v) => format(v, 3)}
          />
          <ButtonRow>
            <SimButton onClick={step} isDisabled={diverged}>
              Paso
            </SimButton>
            <SimButton
              isPrimary
              onClick={() => {
                setIsPlaying((p) => !p);
              }}
              isDisabled={diverged || converged}
            >
              {isPlaying ? "Pausar" : "Reproducir"}
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Desde x₀ = 2,4 acabas en el mínimo local, no en el global. Con η por encima de ≈ 0,4
            rebota de un lado a otro del valle y acaba divergiendo.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Paso" value={path.length - 1} />
          <Stat
            label="x"
            value={diverged ? "diverge" : format(current, 3)}
            tone={diverged ? "bad" : "default"}
          />
          <Stat label="f(x)" value={diverged ? "—" : format(f(current), 3)} />
          <Stat label="f′(x)" value={diverged ? "—" : format(df(current), 3)} />
          <Stat
            label="Estado"
            value={
              diverged
                ? "divergido"
                : converged
                  ? current < 0
                    ? "mínimo global"
                    : "mínimo local"
                  : "bajando"
            }
            tone={converged ? (current < 0 ? "good" : "bad") : "default"}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Función con dos mínimos y el recorrido del descenso"
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[-3, -2, -1, 0, 1, 2, 3]}
          yTicks={[0, 2, 4, 6, 8]}
          x={x}
          y={y}
          xLabel="x"
          yLabel="f(x)"
        />
        <path
          d={range(241)
            .map((i) => {
              const v = -3 + i * 0.025;
              return `${i === 0 ? "M" : "L"}${x(v)},${clampY(f(v))}`;
            })
            .join(" ")}
          fill="none"
          stroke="var(--plot-1)"
          strokeWidth={2.5}
        />
        <polyline
          points={path
            .filter((p) => Math.abs(p) <= 3.2)
            .map((p) => `${x(p)},${clampY(f(p))}`)
            .join(" ")}
          fill="none"
          stroke="var(--plot-2)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {path
          .filter((p) => Math.abs(p) <= 3.2)
          .map((p, i) => (
            <circle
              key={i}
              cx={x(p)}
              cy={clampY(f(p))}
              r={i === path.length - 1 ? 7 : 3.5}
              fill="var(--plot-2)"
              stroke="var(--color-surface)"
            />
          ))}
      </svg>
    </SimFrame>
  );
}
