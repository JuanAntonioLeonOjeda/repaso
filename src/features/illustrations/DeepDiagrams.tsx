import type { ReactNode } from "react";

import { Figure } from "@/features/ui";

interface Block {
  label: string;
  sub: string;
  /** Visual height and depth, proportional to spatial size and number of channels. */
  h: number;
  d: number;
  kind: "data" | "conv" | "pool" | "dense";
}

const FILL: Record<Block["kind"], string> = {
  data: "var(--color-surface-sunken)",
  conv: "var(--subject-soft, var(--plot-grid))",
  pool: "var(--color-surface)",
  dense: "var(--color-task-soft)",
};

function Blocks({ blocks, width }: { blocks: readonly Block[]; width: number }): ReactNode {
  const gap = width / blocks.length;
  return (
    <>
      {blocks.map((b, i) => {
        const x = 20 + i * gap;
        const y = 110 - b.h / 2;
        return (
          <g key={i}>
            <path
              d={`M${x},${y} l${b.d},-${b.d / 2} v${b.h} l-${b.d},${b.d / 2} z M${x},${y} h18 l${b.d},-${b.d / 2} h-18`}
              fill={FILL[b.kind]}
              stroke="var(--color-ink-soft)"
            />
            <rect
              x={x}
              y={y}
              width={18}
              height={b.h}
              fill={FILL[b.kind]}
              stroke="var(--color-ink-soft)"
            />
            <text
              x={x + 14}
              y={196}
              textAnchor="middle"
              fontSize={11}
              fontWeight={650}
              fill="var(--color-ink)"
            >
              {b.label}
            </text>
            <text x={x + 14} y={210} textAnchor="middle" fontSize={10} fill="var(--color-muted)">
              {b.sub}
            </text>
            {i < blocks.length - 1 && (
              <path
                d={`M${x + 22 + b.d},110 h${gap - 30 - b.d}`}
                stroke="var(--color-muted)"
                markerEnd="url(#dd-arrow)"
              />
            )}
          </g>
        );
      })}
    </>
  );
}

function Arrow(): ReactNode {
  return (
    <defs>
      <marker
        id="dd-arrow"
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
  );
}

/** A typical small CNN: the image shrinks while channels grow, then a dense head. */
export function CnnDiagram(): ReactNode {
  const blocks: Block[] = [
    { label: "Imagen", sub: "32×32×3", h: 120, d: 8, kind: "data" },
    { label: "Conv ×2", sub: "32×32×32", h: 120, d: 24, kind: "conv" },
    { label: "MaxPool", sub: "16×16×32", h: 64, d: 24, kind: "pool" },
    { label: "Conv ×2", sub: "16×16×64", h: 64, d: 44, kind: "conv" },
    { label: "MaxPool", sub: "8×8×64", h: 34, d: 44, kind: "pool" },
    { label: "GAP", sub: "64", h: 70, d: 4, kind: "dense" },
    { label: "Dense", sub: "10 clases", h: 30, d: 4, kind: "dense" },
  ];
  return (
    <Figure caption="Una CNN típica: la base convolucional reduce el tamaño espacial y aumenta los canales; la cabeza (aquí global average pooling + densa) clasifica.">
      <svg
        viewBox="0 0 620 220"
        width={620}
        role="img"
        aria-label="Arquitectura de una CNN: convoluciones y pooling seguidos de capas densas"
      >
        <Arrow />
        <Blocks blocks={blocks} width={590} />
      </svg>
    </Figure>
  );
}

/** Transfer learning: a frozen pretrained base and a new trainable head. */
export function TransferDiagram(): ReactNode {
  return (
    <Figure caption="Transfer learning: la base preentrenada con ImageNet se reutiliza (congelada al principio) y solo se entrena una cabeza nueva para tus clases.">
      <svg
        viewBox="0 0 600 170"
        width={600}
        role="img"
        aria-label="Base convolucional preentrenada congelada y cabeza nueva entrenable"
      >
        <Arrow />
        <rect
          x={20}
          y={40}
          width={330}
          height={90}
          rx={12}
          fill="var(--color-surface-sunken)"
          stroke="var(--color-ink-soft)"
          strokeDasharray="6 4"
        />
        <text
          x={185}
          y={30}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill="var(--color-ink)"
        >
          Base preentrenada (VGG, ResNet…) · congelada ❄
        </text>
        {["bordes", "texturas", "partes", "objetos"].map((t, i) => (
          <g key={t}>
            <rect
              x={36 + i * 78}
              y={62}
              width={64}
              height={46}
              rx={6}
              fill="var(--color-surface)"
              stroke="var(--color-line-strong)"
            />
            <text
              x={68 + i * 78}
              y={90}
              textAnchor="middle"
              fontSize={11}
              fill="var(--color-ink-soft)"
            >
              {t}
            </text>
          </g>
        ))}
        <path d="M352,85 h46" stroke="var(--color-muted)" markerEnd="url(#dd-arrow)" />
        <rect
          x={402}
          y={40}
          width={176}
          height={90}
          rx={12}
          fill="var(--color-task-soft)"
          stroke="var(--color-ink)"
        />
        <text
          x={490}
          y={30}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill="var(--color-ink)"
        >
          Cabeza nueva · se entrena
        </text>
        <text x={490} y={78} textAnchor="middle" fontSize={11} fill="var(--color-ink)">
          GlobalAvgPool
        </text>
        <text x={490} y={96} textAnchor="middle" fontSize={11} fill="var(--color-ink)">
          Dense(n_clases)
        </text>
        <text x={185} y={156} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
          fine-tuning: descongelar las últimas capas con lr muy bajo
        </text>
      </svg>
    </Figure>
  );
}

/** Generator vs discriminator. */
export function GanDiagram(): ReactNode {
  const box = (x: number, y: number, w: number, label: string, fill: string): ReactNode => (
    <g>
      <rect x={x} y={y} width={w} height={44} rx={10} fill={fill} stroke="var(--color-ink-soft)" />
      <text
        x={x + w / 2}
        y={y + 27}
        textAnchor="middle"
        fontSize={12}
        fontWeight={650}
        fill="var(--color-ink)"
      >
        {label}
      </text>
    </g>
  );
  return (
    <Figure caption="El generador transforma ruido en imágenes falsas; el discriminador recibe reales y falsas y estima si son reales. Su error es la señal con la que aprenden los dos.">
      <svg
        viewBox="0 0 600 190"
        width={600}
        role="img"
        aria-label="Esquema de una GAN: generador y discriminador"
      >
        <Arrow />
        {box(10, 120, 90, "ruido z", "var(--color-surface-sunken)")}
        {box(140, 120, 120, "Generador G", "var(--subject-soft, var(--plot-grid))")}
        {box(300, 120, 110, "imagen falsa", "var(--color-surface)")}
        {box(300, 20, 110, "imagen real", "var(--color-surface)")}
        {box(450, 70, 130, "Discriminador D", "var(--color-task-soft)")}
        <path d="M100,142 h36" stroke="var(--color-muted)" markerEnd="url(#dd-arrow)" />
        <path d="M260,142 h36" stroke="var(--color-muted)" markerEnd="url(#dd-arrow)" />
        <path
          d="M410,142 C430,142 430,104 446,100"
          fill="none"
          stroke="var(--color-muted)"
          markerEnd="url(#dd-arrow)"
        />
        <path
          d="M410,42 C430,42 430,80 446,84"
          fill="none"
          stroke="var(--color-muted)"
          markerEnd="url(#dd-arrow)"
        />
        <text x={515} y={140} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
          P(real)
        </text>
        <path
          d="M515,118 C515,180 200,186 200,168"
          fill="none"
          stroke="var(--color-muted)"
          strokeDasharray="4 4"
          markerEnd="url(#dd-arrow)"
        />
        <text x={360} y={182} textAnchor="middle" fontSize={10} fill="var(--color-muted)">
          gradiente para engañar mejor
        </text>
      </svg>
    </Figure>
  );
}
