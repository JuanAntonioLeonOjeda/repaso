import { useMemo, useState, type ReactNode } from "react";

import {
  ControlNote,
  createRng,
  distance,
  linearScale,
  makeBlobs,
  plotColour,
  SimFrame,
  Slider,
  Stat,
  Toggle,
  type Point,
} from "@/features/simulations/kit";

const W = 520;
const H = 380;
const GRID = 46;

type Labelled = Point & { label: number };

export function knnPredict(data: readonly Labelled[], q: Point, k: number, xScale = 1): number {
  const nearest = [...data]
    .map((p) => ({ p, d: Math.hypot((p.x - q.x) * xScale, p.y - q.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k);
  const votes = new Map<number, number>();
  nearest.forEach(({ p }) => votes.set(p.label, (votes.get(p.label) ?? 0) + 1));
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
}

export default function KnnSim(): ReactNode {
  const [k, setK] = useState(1);
  const [noise, setNoise] = useState(0.9);
  const [isStretched, setIsStretched] = useState(false);
  const [query, setQuery] = useState<Point>({ x: 0, y: 0 });

  const data = useMemo(() => {
    const rng = createRng(5);
    return makeBlobs(
      rng,
      [
        { x: -1.2, y: 0.6 },
        { x: 1.1, y: -0.2 },
        { x: -0.1, y: -1.3 },
      ],
      22,
      noise,
    );
  }, [noise]);

  // "Unscaled" variant: x measured in a unit 10× larger, so it dominates the distance.
  const xScale = isStretched ? 10 : 1;
  const x = linearScale([-3.5, 3.5], [0, W]);
  const y = linearScale([-3, 3], [H, 0]);
  const cells = useMemo(() => {
    const out: { gx: number; gy: number; label: number }[] = [];
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const px = -3.5 + (7 * (i + 0.5)) / GRID;
        const py = -3 + (6 * (j + 0.5)) / GRID;
        out.push({ gx: i, gy: j, label: knnPredict(data, { x: px, y: py }, k, xScale) });
      }
    }
    return out;
  }, [data, k, xScale]);

  const neighbours = [...data]
    .sort(
      (a, b) =>
        Math.hypot((a.x - query.x) * xScale, a.y - query.y) -
        Math.hypot((b.x - query.x) * xScale, b.y - query.y),
    )
    .slice(0, k);
  const predicted = knnPredict(data, query, k, xScale);
  const radius = Math.max(...neighbours.map((n) => distance(n, query)));

  function onPointer(event: React.PointerEvent<SVGSVGElement>): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const py = ((event.clientY - rect.top) / rect.height) * H;
    setQuery({ x: -3.5 + (px / W) * 7, y: 3 - (py / H) * 6 });
  }

  return (
    <SimFrame
      title="k vecinos más cercanos"
      intro="Haz clic (o arrastra) para colocar el punto a clasificar. El fondo muestra qué clase predeciría el modelo en cada zona."
      onReset={() => {
        setK(1);
        setNoise(0.9);
        setIsStretched(false);
      }}
      controls={
        <>
          <Slider label="k" value={k} min={1} max={35} step={2} onChange={setK} />
          <Slider
            label="Solapamiento de clases"
            value={noise}
            min={0.3}
            max={1.5}
            step={0.1}
            onChange={setNoise}
          />
          <Toggle label="Olvidar escalar x (×10)" isOn={isStretched} onChange={setIsStretched} />
          <ControlNote>
            k = 1 dibuja islas alrededor de cada punto (sobreajuste). Con k grande la frontera se
            suaviza demasiado.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat
            label="Predicción"
            value={<span style={{ color: plotColour(predicted) }}>clase {predicted}</span>}
          />
          <Stat
            label="Votos"
            value={[0, 1, 2].map((c) => neighbours.filter((n) => n.label === c).length).join(" · ")}
          />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Frontera de decisión de kNN con k=${k}`}
        onPointerDown={onPointer}
        onPointerMove={(e) => {
          if (e.buttons === 1) onPointer(e);
        }}
        style={{ cursor: "crosshair" }}
      >
        {cells.map((c) => (
          <rect
            key={`${c.gx}-${c.gy}`}
            x={(c.gx * W) / GRID}
            y={H - ((c.gy + 1) * H) / GRID}
            width={W / GRID + 0.5}
            height={H / GRID + 0.5}
            fill={plotColour(c.label)}
            fillOpacity={0.14}
          />
        ))}
        {!isStretched && (
          <circle
            cx={x(query.x)}
            cy={y(query.y)}
            r={Math.abs(x(radius) - x(0))}
            fill="none"
            stroke="var(--color-ink)"
            strokeDasharray="4 3"
          />
        )}
        {neighbours.map((n, i) => (
          <line
            key={i}
            x1={x(query.x)}
            y1={y(query.y)}
            x2={x(n.x)}
            y2={y(n.y)}
            stroke="var(--color-ink)"
            strokeOpacity={0.35}
          />
        ))}
        {data.map((p, i) => (
          <circle
            key={i}
            cx={x(p.x)}
            cy={y(p.y)}
            r={4.5}
            fill={plotColour(p.label)}
            stroke="var(--color-surface)"
          />
        ))}
        <rect
          x={x(query.x) - 7}
          y={y(query.y) - 7}
          width={14}
          height={14}
          fill={plotColour(predicted)}
          stroke="var(--color-ink)"
          strokeWidth={2}
          transform={`rotate(45 ${x(query.x)} ${y(query.y)})`}
        />
      </svg>
    </SimFrame>
  );
}
