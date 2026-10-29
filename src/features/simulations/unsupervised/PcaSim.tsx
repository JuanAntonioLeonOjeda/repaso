import { useMemo, useState, type ReactNode } from "react";

import {
  ControlNote,
  createRng,
  format,
  gaussian,
  linearScale,
  mean,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  Toggle,
} from "@/features/simulations/kit";

const W = 520;
const H = 380;

/** Principal direction of 2D data from its covariance matrix (closed form for 2×2). */
export function principalAngle(xs: readonly number[], ys: readonly number[]): number {
  const mx = mean(xs);
  const my = mean(ys);
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  xs.forEach((x, i) => {
    const dx = x - mx;
    const dy = (ys[i] ?? 0) - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  });
  return 0.5 * Math.atan2(2 * sxy, sxx - syy);
}

export default function PcaSim(): ReactNode {
  const [angle, setAngle] = useState(0);
  const [showProjections, setShowProjections] = useState(true);
  const data = useMemo(() => {
    const rng = createRng(17);
    const raw = range(80).map(() => {
      const a = gaussian(rng) * 1.4;
      const b = gaussian(rng) * 0.45;
      return { x: a * Math.cos(0.6) - b * Math.sin(0.6), y: a * Math.sin(0.6) + b * Math.cos(0.6) };
    });
    // Centred, as PCA requires (StandardScaler first in practice)
    const mx = mean(raw.map((p) => p.x));
    const my = mean(raw.map((p) => p.y));
    return raw.map((p) => ({ x: p.x - mx, y: p.y - my }));
  }, []);
  const theta = (angle * Math.PI) / 180;
  const u = { x: Math.cos(theta), y: Math.sin(theta) };
  const proj = data.map((p) => p.x * u.x + p.y * u.y);
  const varProj = mean(proj.map((v) => v * v));
  const varTotal = mean(data.map((p) => p.x * p.x + p.y * p.y));
  const best = principalAngle(
    data.map((p) => p.x),
    data.map((p) => p.y),
  );

  const x = linearScale([-4, 4], [(W - H) / 2, (W + H) / 2]);
  const y = linearScale([-4, 4], [H, 0]);

  return (
    <SimFrame
      title="PCA: busca la dirección con más varianza"
      intro="Gira el eje. Cada punto se proyecta sobre él (líneas finas). PCA busca la dirección en la que las proyecciones están más dispersas: esa es la primera componente principal. La segunda es la perpendicular."
      onReset={() => {
        setAngle(0);
      }}
      controls={
        <>
          <Slider
            label="Ángulo del eje"
            value={angle}
            min={-90}
            max={90}
            onChange={setAngle}
            format={(v) => `${v}°`}
          />
          <Toggle label="Ver proyecciones" isOn={showProjections} onChange={setShowProjections} />
          <SimButton
            isPrimary
            onClick={() => {
              setAngle(Math.round((best * 180) / Math.PI));
            }}
          >
            Ir a la PC1
          </SimButton>
          <ControlNote>
            Si te quedas solo con la PC1, conservas el «% varianza explicada» de la información con
            la mitad de columnas.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Varianza proyectada" value={format(varProj)} />
          <Stat
            label="% varianza explicada"
            value={`${format((100 * varProj) / varTotal, 1)}%`}
            tone={varProj / varTotal > 0.85 ? "good" : "default"}
          />
          <Stat label="Ángulo de la PC1" value={`${format((best * 180) / Math.PI, 0)}°`} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Proyección sobre un eje a ${angle} grados`}
      >
        <line
          x1={x(-4 * u.x)}
          y1={y(-4 * u.y)}
          x2={x(4 * u.x)}
          y2={y(4 * u.y)}
          stroke="var(--plot-2)"
          strokeWidth={2.5}
        />
        <line
          x1={x(4 * u.y)}
          y1={y(-4 * u.x)}
          x2={x(-4 * u.y)}
          y2={y(4 * u.x)}
          stroke="var(--plot-2)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {data.map((p, i) => {
          const t = proj[i] ?? 0;
          return (
            <g key={i}>
              {showProjections && (
                <line
                  x1={x(p.x)}
                  y1={y(p.y)}
                  x2={x(t * u.x)}
                  y2={y(t * u.y)}
                  stroke="var(--plot-axis)"
                  strokeOpacity={0.4}
                />
              )}
              <circle cx={x(p.x)} cy={y(p.y)} r={4} fill="var(--plot-1)" fillOpacity={0.7} />
              {showProjections && (
                <circle cx={x(t * u.x)} cy={y(t * u.y)} r={2.5} fill="var(--plot-2)" />
              )}
            </g>
          );
        })}
      </svg>
    </SimFrame>
  );
}
