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
const M = { top: 16, right: 16, bottom: 30, left: 40 };
const REAL = { mu: 2, sigma: 0.7 };
const pdf = (x: number, mu: number, s: number): number =>
  Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));

/** Jensen–Shannon divergence between the real and generated densities, by numeric integration. */
function jsDivergence(mu: number, sigma: number): number {
  let js = 0;
  const dx = 0.02;
  for (let x = -6; x <= 8; x += dx) {
    const p = pdf(x, REAL.mu, REAL.sigma) + 1e-12;
    const q = pdf(x, mu, sigma) + 1e-12;
    const m = (p + q) / 2;
    js += 0.5 * (p * Math.log(p / m) + q * Math.log(q / m)) * dx;
  }
  return js / Math.log(2);
}

export default function GanSim(): ReactNode {
  const [mu, setMu] = useState(-2);
  const [sigma, setSigma] = useState(1.6);
  const [isTraining, setIsTraining] = useState(false);
  const x = linearScale([-5, 6], [M.left, W - M.right]);
  const y = linearScale([0, 1], [H - M.bottom, M.top]);
  const js = jsDivergence(mu, sigma);

  // With an optimal discriminator D*(x) = p_real / (p_real + p_gen), the generator's best
  // move is to reduce the JS divergence; a finite-difference step on it stands in for training.
  useAnimation(isTraining && js > 0.002, 20, () => {
    const e = 1e-3;
    const gMu = (jsDivergence(mu + e, sigma) - jsDivergence(mu - e, sigma)) / (2 * e);
    const gS = (jsDivergence(mu, sigma + e) - jsDivergence(mu, sigma - e)) / (2 * e);
    setMu((m) => m - 1.2 * gMu);
    setSigma((s) => Math.max(0.15, s - 0.6 * gS));
  });

  const curve = (f: (v: number) => number): string =>
    range(221)
      .map((i) => {
        const v = -5 + i * 0.05;
        return `${i === 0 ? "M" : "L"}${x(v)},${y(Math.min(1, f(v)))}`;
      })
      .join(" ");

  return (
    <SimFrame
      title="El juego de una GAN, en una dimensión"
      intro="Verde: los datos reales. Rosa: lo que genera el generador. Discontinua: lo que opina el discriminador óptimo, D(x) = P(«es real»). Mueve el generador a mano o pulsa «Entrenar»: aprende cuando consigue que D valga 0,5 en todas partes (no distingue)."
      onReset={() => {
        setMu(-2);
        setSigma(1.6);
        setIsTraining(false);
      }}
      controls={
        <>
          <Slider
            label="Generador: media"
            value={mu}
            min={-4}
            max={5}
            step={0.05}
            onChange={setMu}
            format={(v) => format(v)}
          />
          <Slider
            label="Generador: dispersión"
            value={sigma}
            min={0.15}
            max={2.5}
            step={0.05}
            onChange={setSigma}
            format={(v) => format(v)}
          />
          <ButtonRow>
            <SimButton
              isPrimary
              onClick={() => {
                setIsTraining((t) => !t);
              }}
            >
              {isTraining ? "Pausar" : "Entrenar generador"}
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Si el generador pone toda la masa en un único punto (dispersión mínima) cerca del pico
            real, engaña a D localmente pero no cubre la distribución: eso es el «mode collapse».
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="Divergencia JS (0 = idénticas)"
            value={format(js, 3)}
            tone={js < 0.02 ? "good" : "default"}
          />
          <Stat
            label="D(x) en el pico real"
            value={format(
              pdf(REAL.mu, REAL.mu, REAL.sigma) /
                (pdf(REAL.mu, REAL.mu, REAL.sigma) + pdf(REAL.mu, mu, sigma)),
            )}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Distribución real, generada y opinión del discriminador"
      >
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[-4, -2, 0, 2, 4, 6]}
          yTicks={[0, 0.5, 1]}
          x={x}
          y={y}
        />
        <path
          d={curve((v) => pdf(v, REAL.mu, REAL.sigma))}
          fill="var(--plot-3)"
          fillOpacity={0.18}
          stroke="var(--plot-3)"
          strokeWidth={2.5}
        />
        <path
          d={curve((v) => pdf(v, mu, sigma))}
          fill="var(--plot-7)"
          fillOpacity={0.15}
          stroke="var(--plot-7)"
          strokeWidth={2.5}
        />
        <path
          d={curve((v) => {
            const p = pdf(v, REAL.mu, REAL.sigma);
            const q = pdf(v, mu, sigma);
            return p + q < 1e-9 ? 0.5 : p / (p + q);
          })}
          fill="none"
          stroke="var(--color-ink)"
          strokeDasharray="6 4"
          strokeWidth={2}
        />
        <text x={W - 20} y={28} textAnchor="end" fontSize={11} fill="var(--plot-3)">
          real
        </text>
        <text x={W - 20} y={42} textAnchor="end" fontSize={11} fill="var(--plot-7)">
          generado
        </text>
        <text x={W - 20} y={56} textAnchor="end" fontSize={11} fill="var(--color-ink)">
          D(x)
        </text>
      </svg>
    </SimFrame>
  );
}
