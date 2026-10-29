import { useState, type ReactNode } from "react";

import {
  ControlNote,
  format,
  plotColour,
  SimFrame,
  Slider,
  Stat,
  Toggle,
} from "@/features/simulations/kit";

const W = 520;
const H = 340;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  object: number;
}

export function iou(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  return inter / (a.w * a.h + b.w * b.h - inter);
}

/** Greedy non-maximum suppression: keep the best box, drop those overlapping it too much, repeat. */
export function nms(boxes: readonly Box[], threshold: number, minScore: number): Box[] {
  const sorted = boxes.filter((b) => b.score >= minScore).sort((a, b) => b.score - a.score);
  const kept: Box[] = [];
  for (const box of sorted) {
    if (kept.every((k) => iou(k, box) < threshold)) kept.push(box);
  }
  return kept;
}

// Raw detector output: several overlapping guesses per object, as a real detector produces.
const RAW: Box[] = [
  { x: 60, y: 70, w: 150, h: 190, score: 0.93, object: 0 },
  { x: 72, y: 60, w: 140, h: 185, score: 0.86, object: 0 },
  { x: 48, y: 85, w: 160, h: 170, score: 0.71, object: 0 },
  { x: 90, y: 100, w: 110, h: 150, score: 0.42, object: 0 },
  { x: 250, y: 120, w: 130, h: 120, score: 0.88, object: 1 },
  { x: 262, y: 110, w: 125, h: 130, score: 0.79, object: 1 },
  { x: 240, y: 135, w: 120, h: 105, score: 0.55, object: 1 },
  { x: 330, y: 150, w: 120, h: 110, score: 0.67, object: 2 },
  { x: 345, y: 160, w: 110, h: 100, score: 0.6, object: 2 },
  { x: 410, y: 40, w: 70, h: 60, score: 0.21, object: 3 },
];

export default function IouNmsSim(): ReactNode {
  const [threshold, setThreshold] = useState(0.5);
  const [minScore, setMinScore] = useState(0.3);
  const [isApplied, setIsApplied] = useState(true);
  const kept = nms(RAW, threshold, minScore);
  const shown = isApplied ? kept : RAW.filter((b) => b.score >= minScore);
  const [a, b] = [RAW[4], RAW[7]];

  return (
    <SimFrame
      title="IoU y non-maximum suppression"
      intro="Un detector suelta muchas cajas solapadas por objeto. NMS se queda con la de mayor confianza y elimina las que la solapen más de un umbral de IoU (intersección / unión). Ojo con los dos objetos de la derecha: están pegados."
      onReset={() => {
        setThreshold(0.5);
        setMinScore(0.3);
        setIsApplied(true);
      }}
      controls={
        <>
          <Toggle label="Aplicar NMS" isOn={isApplied} onChange={setIsApplied} />
          <Slider
            label="Umbral IoU de NMS"
            value={threshold}
            min={0.1}
            max={0.95}
            step={0.05}
            onChange={setThreshold}
            format={(v) => format(v)}
          />
          <Slider
            label="Confianza mínima"
            value={minScore}
            min={0}
            max={0.9}
            step={0.05}
            onChange={setMinScore}
            format={(v) => format(v)}
          />
          <ControlNote>
            Con umbral IoU bajo (0,2) NMS se come el objeto de la derecha: lo confunde con un
            duplicado de su vecino.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Cajas mostradas" value={shown.length} />
          <Stat label="Objetos reales" value={3} />
          <Stat label="IoU entre los dos de la derecha" value={a && b ? format(iou(a, b)) : "—"} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${shown.length} cajas de detección`}>
        <rect
          x={70}
          y={80}
          width={135}
          height={175}
          rx={60}
          fill="var(--plot-noise)"
          fillOpacity={0.35}
        />
        <rect
          x={255}
          y={125}
          width={120}
          height={110}
          rx={20}
          fill="var(--plot-noise)"
          fillOpacity={0.35}
        />
        <circle cx={392} cy={207} r={50} fill="var(--plot-noise)" fillOpacity={0.35} />
        {shown.map((box, i) => (
          <g key={i}>
            <rect
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              fill="none"
              stroke={plotColour(box.object)}
              strokeWidth={kept.includes(box) && isApplied ? 3 : 1.5}
            />
            <rect x={box.x} y={box.y - 16} width={38} height={16} fill={plotColour(box.object)} />
            <text x={box.x + 4} y={box.y - 4} fontSize={11} fill="#fff" fontWeight={700}>
              {format(box.score)}
            </text>
          </g>
        ))}
      </svg>
    </SimFrame>
  );
}
