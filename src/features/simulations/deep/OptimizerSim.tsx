import { useMemo, useState, type ReactNode } from "react";

import {
  ButtonRow,
  Choice,
  ControlNote,
  format,
  linearScale,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

import {
  initState,
  optimizerStep,
  type OptimizerName,
  type OptState,
  type Vec,
} from "./optimizers";

const W = 520;
const H = 360;
type Surface = "valley" | "bumpy";

const SURFACES: Record<
  Surface,
  { f: (p: Vec) => number; g: (p: Vec) => Vec; start: Vec; min: Vec }
> = {
  // An elongated valley: steep across, gentle along. Plain SGD zig-zags here.
  valley: {
    f: (p) => 0.1 * p.x ** 2 + 2 * p.y ** 2,
    g: (p) => ({ x: 0.2 * p.x, y: 4 * p.y }),
    start: { x: -4.5, y: 1.6 },
    min: { x: 0, y: 0 },
  },
  // A bowl with ripples: local minima that momentum can roll over.
  bumpy: {
    f: (p) => 0.15 * (p.x ** 2 + p.y ** 2) + 0.6 * Math.sin(2 * p.x) * Math.sin(2 * p.y) + 0.6,
    g: (p) => ({
      x: 0.3 * p.x + 1.2 * Math.cos(2 * p.x) * Math.sin(2 * p.y),
      y: 0.3 * p.y + 1.2 * Math.sin(2 * p.x) * Math.cos(2 * p.y),
    }),
    start: { x: -4, y: 3.5 },
    min: { x: 0, y: 0 },
  },
};

const NAMES: OptimizerName[] = ["sgd", "momentum", "rmsprop", "adam"];
const LABELS: Record<OptimizerName, string> = {
  sgd: "SGD",
  momentum: "Momentum",
  rmsprop: "RMSProp",
  adam: "Adam",
};
const COLOURS: Record<OptimizerName, string> = {
  sgd: "var(--plot-1)",
  momentum: "var(--plot-2)",
  rmsprop: "var(--plot-3)",
  adam: "var(--plot-4)",
};

type Runs = Record<OptimizerName, { state: OptState; path: Vec[] }>;

function freshRuns(start: Vec): Runs {
  return Object.fromEntries(
    NAMES.map((n) => [n, { state: initState(start), path: [start] }]),
  ) as Runs;
}

export default function OptimizerSim(): ReactNode {
  const [surface, setSurface] = useState<Surface>("valley");
  const [lr, setLr] = useState(0.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const s = SURFACES[surface];
  const [runs, setRuns] = useState<Runs>(() => freshRuns(SURFACES.valley.start));
  const steps = runs.sgd.path.length - 1;

  function restart(next: Surface = surface): void {
    setIsPlaying(false);
    setRuns(freshRuns(SURFACES[next].start));
  }

  function advance(): void {
    setRuns((r) => {
      const out = { ...r };
      for (const n of NAMES) {
        const st = optimizerStep(n, r[n].state, s.g(r[n].state.p), lr);
        out[n] = { state: st, path: [...r[n].path, st.p] };
      }
      return out;
    });
  }
  useAnimation(isPlaying && steps < 150, 15, advance);

  const x = linearScale([-5, 5], [0, W]);
  const y = linearScale([-3.6, 3.6], [H, 0]);
  const contours = useMemo(() => {
    const cells: { cx: number; cy: number; v: number }[] = [];
    const n = 52;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const px = -5 + (10 * (i + 0.5)) / n;
        const py = -3.6 + (7.2 * (j + 0.5)) / n;
        cells.push({ cx: i, cy: j, v: s.f({ x: px, y: py }) });
      }
    }
    const max = Math.max(...cells.map((c) => c.v));
    return { cells, max, n };
  }, [s]);

  return (
    <SimFrame
      title="Carrera de optimizadores"
      intro="Cuatro optimizadores salen del mismo punto y bajan por la misma función de pérdida (más oscuro = más bajo). En el valle alargado, SGD zigzaguea; momentum acumula velocidad; RMSProp y Adam adaptan el paso por dirección."
      onReset={() => {
        setSurface("valley");
        setLr(0.2);
        restart("valley");
      }}
      controls={
        <>
          <Choice
            label="Superficie"
            value={surface}
            onChange={(v) => {
              setSurface(v);
              restart(v);
            }}
            options={[
              { value: "valley", label: "Valle alargado" },
              { value: "bumpy", label: "Con baches" },
            ]}
          />
          <Slider
            label="Learning rate"
            value={lr}
            min={0.01}
            max={0.6}
            step={0.01}
            onChange={(v) => {
              setLr(v);
              restart();
            }}
            format={(v) => format(v)}
          />
          <ButtonRow>
            <SimButton onClick={advance}>Paso</SimButton>
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
            Sube el learning rate por encima de 0,5 en el valle: SGD diverge (el paso en la
            dirección empinada es demasiado grande).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Pasos" value={steps} />
          {NAMES.map((n) => (
            <Stat
              key={n}
              label={`Pérdida ${LABELS[n]}`}
              value={<span style={{ color: COLOURS[n] }}>{format(s.f(runs[n].state.p), 3)}</span>}
            />
          ))}
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Trayectorias de los optimizadores sobre la superficie de pérdida"
      >
        {contours.cells.map((c) => (
          <rect
            key={`${c.cx}-${c.cy}`}
            x={(c.cx * W) / contours.n}
            y={H - ((c.cy + 1) * H) / contours.n}
            width={W / contours.n + 0.5}
            height={H / contours.n + 0.5}
            fill="var(--color-ink)"
            fillOpacity={0.32 * (1 - Math.sqrt(c.v / contours.max))}
          />
        ))}
        <circle
          cx={x(s.min.x)}
          cy={y(s.min.y)}
          r={6}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={2}
        />
        {NAMES.map((n) => (
          <g key={n}>
            <polyline
              points={runs[n].path
                .map(
                  (p) =>
                    `${x(Math.max(-6, Math.min(6, p.x)))},${y(Math.max(-5, Math.min(5, p.y)))}`,
                )
                .join(" ")}
              fill="none"
              stroke={COLOURS[n]}
              strokeWidth={2.2}
            />
            <circle
              cx={x(Math.max(-6, Math.min(6, runs[n].state.p.x)))}
              cy={y(Math.max(-5, Math.min(5, runs[n].state.p.y)))}
              r={5}
              fill={COLOURS[n]}
              stroke="var(--color-surface)"
            />
          </g>
        ))}
        {NAMES.map((n, i) => (
          <text
            key={`l${n}`}
            x={10}
            y={18 + i * 15}
            fontSize={12}
            fontWeight={700}
            fill={COLOURS[n]}
          >
            ● {LABELS[n]}
          </text>
        ))}
      </svg>
    </SimFrame>
  );
}
