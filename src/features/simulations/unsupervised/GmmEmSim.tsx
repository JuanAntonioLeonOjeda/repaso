import { useMemo, useState, type ReactNode } from "react";

import {
  Axes,
  ButtonRow,
  ControlNote,
  createRng,
  format,
  gaussian,
  linearScale,
  range,
  SimButton,
  SimFrame,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

const W = 560;
const H = 300;
const M = { top: 16, right: 16, bottom: 34, left: 40 };

interface Component {
  mu: number;
  sigma: number;
  pi: number;
}

const normalPdf = (x: number, mu: number, sigma: number): number =>
  Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));

/** One EM iteration for a 1D Gaussian mixture. Returns the new parameters and the log-likelihood. */
export function emStep(
  xs: readonly number[],
  comps: readonly Component[],
): { comps: Component[]; logLik: number } {
  // E step: responsibilities r[i][k] = P(component k | x_i)
  let logLik = 0;
  const resp = xs.map((x) => {
    const w = comps.map((c) => c.pi * normalPdf(x, c.mu, c.sigma));
    const total = w.reduce((s, v) => s + v, 0) || 1e-300;
    logLik += Math.log(total);
    return w.map((v) => v / total);
  });
  // M step: re-estimate each component from the points weighted by responsibility
  const next = comps.map((_, k) => {
    const nk = resp.reduce((s, r) => s + (r[k] ?? 0), 0) || 1e-9;
    const mu = xs.reduce((s, x, i) => s + (resp[i]?.[k] ?? 0) * x, 0) / nk;
    const variance = xs.reduce((s, x, i) => s + (resp[i]?.[k] ?? 0) * (x - mu) ** 2, 0) / nk;
    return { mu, sigma: Math.max(0.05, Math.sqrt(variance)), pi: nk / xs.length };
  });
  return { comps: next, logLik };
}

const START: Component[] = [
  { mu: -1, sigma: 1.5, pi: 0.5 },
  { mu: 0.5, sigma: 1.5, pi: 0.5 },
];

export default function GmmEmSim(): ReactNode {
  const xs = useMemo(() => {
    const rng = createRng(12);
    return [
      ...range(140).map(() => -2 + gaussian(rng) * 0.6),
      ...range(80).map(() => 2.2 + gaussian(rng) * 1),
    ];
  }, []);
  const [comps, setComps] = useState<Component[]>(START);
  const [history, setHistory] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  function advance(): void {
    const { comps: next, logLik } = emStep(xs, comps);
    setComps(next);
    setHistory((h) => [...h, logLik]);
  }
  useAnimation(isPlaying && history.length < 40, 3, advance);

  const x = linearScale([-5, 6], [M.left, W - M.right]);
  const bins = 30;
  const hist = range(bins).map((b) => {
    const lo = -5 + (11 * b) / bins;
    const hi = lo + 11 / bins;
    return { lo, density: xs.filter((v) => v >= lo && v < hi).length / (xs.length * (11 / bins)) };
  });
  const y = linearScale([0, 0.6], [H - M.bottom, M.top]);
  const colours = ["var(--plot-1)", "var(--plot-2)"];

  return (
    <SimFrame
      title="Mezcla de gaussianas con EM"
      intro="Los datos (histograma) vienen de dos grupos solapados. EM alterna: E) calcular, para cada punto, la probabilidad de pertenecer a cada gaussiana; M) reajustar cada gaussiana con esos pesos. Pulsa «Paso EM» y mira cómo encajan."
      onReset={() => {
        setComps(START);
        setHistory([]);
        setIsPlaying(false);
      }}
      controls={
        <>
          <ButtonRow>
            <SimButton onClick={advance}>Paso EM</SimButton>
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
            A diferencia de k-means, cada punto pertenece «un poco» a cada grupo (asignación blanda)
            y cada grupo tiene su propia anchura.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Iteraciones" value={history.length} />
          <Stat label="Log-verosimilitud" value={format(history.at(-1) ?? NaN, 1)} />
          {comps.map((c, i) => (
            <Stat
              key={i}
              label={`Gaussiana ${i + 1}: μ, σ, π`}
              value={`${format(c.mu)}, ${format(c.sigma)}, ${format(c.pi)}`}
            />
          ))}
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Histograma con las dos gaussianas ajustadas"
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[-4, -2, 0, 2, 4, 6]}
          yTicks={[0, 0.2, 0.4, 0.6]}
          x={x}
          y={y}
        />
        {hist.map((h) => (
          <rect
            key={h.lo}
            x={x(h.lo)}
            y={y(h.density)}
            width={x(11 / bins) - x(0) - 1}
            height={y(0) - y(h.density)}
            fill="var(--plot-noise)"
            fillOpacity={0.45}
          />
        ))}
        {comps.map((c, k) => (
          <path
            key={k}
            d={range(221)
              .map((i) => {
                const xv = -5 + i * 0.05;
                return `${i === 0 ? "M" : "L"}${x(xv)},${y(Math.min(0.6, c.pi * normalPdf(xv, c.mu, c.sigma)))}`;
              })
              .join(" ")}
            fill="none"
            stroke={colours[k]}
            strokeWidth={3}
          />
        ))}
      </svg>
    </SimFrame>
  );
}
