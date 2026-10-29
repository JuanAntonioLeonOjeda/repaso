import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  format,
  SimFrame,
  Slider,
  Stat,
  simStyles,
} from "@/features/simulations/kit";

const SIZE = 28;
type Kernel = number[][];

const PRESETS: Record<string, { label: string; k: Kernel }> = {
  identity: {
    label: "Identidad",
    k: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  blur: {
    label: "Desenfoque",
    k: [
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
    ],
  },
  sharpen: {
    label: "Enfocar",
    k: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
  sobelX: {
    label: "Bordes verticales (Sobel x)",
    k: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
  },
  sobelY: {
    label: "Bordes horizontales (Sobel y)",
    k: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
  },
  laplace: {
    label: "Todos los bordes",
    k: [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0],
    ],
  },
};
type PresetName = keyof typeof PRESETS;
const IDENTITY: Kernel = [[1]];

/** A small synthetic image: a square, a disc and a diagonal stroke (like a hand-drawn digit). */
function makeImage(): number[][] {
  return Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => {
      const square = r > 4 && r < 13 && c > 3 && c < 12 ? 1 : 0;
      const disc = Math.hypot(r - 18, c - 18) < 6 ? 0.8 : 0;
      const stroke = Math.abs(r - (27 - c)) < 1.2 && c > 14 ? 1 : 0;
      return Math.max(square, disc, stroke);
    }),
  );
}

/** 2D cross-correlation (what deep-learning libraries call convolution) with stride and zero padding. */
export function convolve(
  img: readonly (readonly number[])[],
  k: Kernel,
  stride: number,
  padding: number,
): number[][] {
  const n = img.length;
  const ks = k.length;
  const out = Math.floor((n + 2 * padding - ks) / stride) + 1;
  return Array.from({ length: out }, (_, i) =>
    Array.from({ length: out }, (_, j) => {
      let sum = 0;
      for (let a = 0; a < ks; a++) {
        for (let b = 0; b < ks; b++) {
          const r = i * stride + a - padding;
          const c = j * stride + b - padding;
          sum += (img[r]?.[c] ?? 0) * (k[a]?.[b] ?? 0);
        }
      }
      return sum;
    }),
  );
}

function Pixels({
  data,
  label,
  selected,
}: {
  data: number[][];
  label: string;
  selected?: [number, number] | null;
}): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null);
  const n = data.length;
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const flat = data.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    const image = ctx.createImageData(n, n);
    flat.forEach((v, i) => {
      const g = max === min ? 0 : (v - min) / (max - min);
      image.data[i * 4] = image.data[i * 4 + 1] = image.data[i * 4 + 2] = Math.round(g * 255);
      image.data[i * 4 + 3] = 255;
    });
    ctx.putImageData(image, 0, 0);
  }, [data, n]);
  return (
    <figure style={{ margin: 0 }}>
      <div
        className={simStyles.canvasWrap}
        style={{ position: "relative" }}
        role="img"
        aria-label={label}
      >
        <canvas ref={ref} width={n} height={n} />
        {selected && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${(selected[1] / n) * 100}%`,
              top: `${(selected[0] / n) * 100}%`,
              width: `${100 / n}%`,
              height: `${100 / n}%`,
              outline: "2px solid var(--plot-5)",
            }}
          />
        )}
      </div>
      <figcaption style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: 4 }}>
        {label}
      </figcaption>
    </figure>
  );
}

export default function ConvolutionSim(): ReactNode {
  const [preset, setPreset] = useState<PresetName>("sobelX");
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(1);
  const [row, setRow] = useState(8);
  const [col, setCol] = useState(4);
  const img = useMemo(() => makeImage(), []);
  const kernel = PRESETS[preset]?.k ?? IDENTITY;
  const out = useMemo(() => convolve(img, kernel, stride, padding), [img, kernel, stride, padding]);
  const sel: [number, number] | null = row < out.length && col < out.length ? [row, col] : null;

  const patch = sel
    ? kernel.map((row, a) =>
        row.map((_, b) => img[sel[0] * stride + a - padding]?.[sel[1] * stride + b - padding] ?? 0),
      )
    : null;

  return (
    <SimFrame
      title="Una convolución por dentro"
      intro="Un filtro 3×3 recorre la imagen; en cada posición multiplica sus 9 pesos por los 9 píxeles de debajo y suma. Elige un píxel de salida (recuadro amarillo) para ver su cuenta. En una CNN, esos 9 pesos no los eliges tú: se aprenden."
      onReset={() => {
        setPreset("sobelX");
        setStride(1);
        setPadding(1);
      }}
      controls={
        <>
          <Choice
            label="Filtro"
            value={preset}
            onChange={setPreset}
            options={Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label }))}
          />
          <Slider label="Stride (salto)" value={stride} min={1} max={3} onChange={setStride} />
          <Slider
            label="Padding (relleno de ceros)"
            value={padding}
            min={0}
            max={2}
            onChange={setPadding}
          />
          <Slider
            label="Píxel inspeccionado: fila"
            value={row}
            min={0}
            max={out.length - 1}
            onChange={setRow}
          />
          <Slider
            label="Píxel inspeccionado: columna"
            value={col}
            min={0}
            max={out.length - 1}
            onChange={setCol}
          />
          <ControlNote>
            Tamaño de salida = ⌊(N + 2P − K) / S⌋ + 1. Con P = 1 y S = 1 un filtro 3×3 conserva el
            tamaño («same»).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Entrada" value={`${SIZE}×${SIZE}`} />
          <Stat label="Salida" value={`${out.length}×${out.length}`} />
          <Stat label="Parámetros del filtro" value="9 + 1 sesgo" />
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "var(--space-3)",
          alignItems: "start",
        }}
      >
        <Pixels data={img} label="Entrada (28×28)" />
        <div>
          <table
            style={{
              borderCollapse: "collapse",
              margin: "0 auto",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
            aria-label="Pesos del filtro"
          >
            <tbody>
              {kernel.map((row, a) => (
                <tr key={a}>
                  {row.map((v, b) => (
                    <td
                      key={b}
                      style={{
                        border: "1px solid var(--color-line-strong)",
                        padding: "6px 8px",
                        textAlign: "center",
                        background:
                          v > 0
                            ? "var(--subject-soft)"
                            : v < 0
                              ? "var(--color-warn-soft)"
                              : undefined,
                      }}
                    >
                      {Number.isInteger(v) ? v : format(v, 2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {patch && sel && (
            <p
              style={{
                fontSize: "var(--text-xs)",
                marginTop: 8,
                fontFamily: "var(--font-mono)",
                overflowWrap: "anywhere",
              }}
            >
              salida[{sel[0]},{sel[1]}] ={" "}
              {patch
                .flatMap((row, a) =>
                  row.map((p, b) => `${format(p, 1)}·${format(kernel[a]?.[b] ?? 0, 1)}`),
                )
                .filter((_, i) => (kernel.flat()[i] ?? 0) !== 0)
                .join(" + ")}{" "}
              = <strong>{format(out[sel[0]]?.[sel[1]] ?? 0, 2)}</strong>
            </p>
          )}
        </div>
        <Pixels data={out} label={`Salida (${out.length}×${out.length})`} selected={sel} />
      </div>
    </SimFrame>
  );
}
