import type { ReactNode } from "react";

import { Figure } from "@/features/ui";

interface BoxProps {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  fill?: string;
}

function Box({ x, y, w, h, title, sub, fill = "var(--color-surface)" }: BoxProps): ReactNode {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={fill}
        stroke="var(--color-ink-soft)"
        strokeWidth={1.4}
      />
      <text
        x={x + w / 2}
        y={y + (sub ? h / 2 - 2 : h / 2 + 4)}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="var(--color-ink)"
      >
        {title}
      </text>
      {sub !== undefined && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 14}
          textAnchor="middle"
          fontSize={10}
          fill="var(--color-muted)"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

/** LumosNet as defined in models/lumosnet.py of the TFM. */
export function LumosNetDiagram(): ReactNode {
  const arrow = (d: string): ReactNode => (
    <path
      d={d}
      fill="none"
      stroke="var(--color-muted)"
      strokeWidth={1.5}
      markerEnd="url(#ln-arrow)"
    />
  );
  return (
    <Figure caption="LumosNet: un backbone ResNet50 compartido, una rama opcional para las covariables clínicas y dos cabezas, una por tarea. Se entrena con L = entropía cruzada + 10 · MSE.">
      <svg
        viewBox="0 0 720 260"
        width={720}
        role="img"
        aria-label="Arquitectura de LumosNet: ResNet50, covariables, bloque compartido y cabezas de clasificación y regresión"
      >
        <defs>
          <marker
            id="ln-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-muted)" />
          </marker>
        </defs>
        <Box
          x={8}
          y={70}
          w={92}
          h={56}
          title="Radiografía"
          sub="224×224×3"
          fill="var(--color-surface-sunken)"
        />
        {arrow("M100,98 h22")}
        <Box
          x={126}
          y={50}
          w={150}
          h={96}
          title="ResNet50"
          sub="ImageNet · 23,5 M parám."
          fill="var(--subject-soft, var(--color-surface-sunken))"
        />
        <text x={201} y={130} textAnchor="middle" fontSize={9} fill="var(--color-muted)">
          conv1 → layer1…4 → GAP
        </text>
        {arrow("M276,98 h26")}
        <Box x={306} y={76} w={80} h={44} title="2048" sub="features" />
        <Box
          x={126}
          y={180}
          w={150}
          h={52}
          title="Covariables"
          sub="edad, sexo, IMC (z-score)"
          fill="var(--color-surface-sunken)"
        />
        {arrow("M276,206 h30")}
        <Box x={310} y={184} w={76} h={44} title="Linear+ReLU" sub="3 → 32" />
        {arrow("M386,206 C410,206 410,120 424,112")}
        {arrow("M386,98 h34")}
        <Box x={424} y={70} w={96} h={56} title="concat" sub="2048 + 32" />
        {arrow("M520,98 h18")}
        <Box x={542} y={70} w={70} h={56} title="Shared" sub="512 + Dropout" />
        {arrow("M612,90 C630,90 630,52 646,48")}
        {arrow("M612,106 C630,106 630,148 646,152")}
        <Box
          x={648}
          y={22}
          w={66}
          h={52}
          title="Clase"
          sub="3 · softmax"
          fill="var(--color-task-soft)"
        />
        <Box
          x={648}
          y={126}
          w={66}
          h={52}
          title="BMD"
          sub="1 · lineal"
          fill="var(--color-task-soft)"
        />
      </svg>
    </Figure>
  );
}
