import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Choice, ControlNote, SimFrame, Slider, Stat, simStyles } from "@/features/simulations/kit";
import { localUrl, useTfmManifest } from "@/features/tfm";

import { clahe, histogram, syntheticSpine } from "./clahe";

const SIZE = 224;

function GrayCanvas({ pixels, label }: { pixels: Uint8Array; label: string }): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const image = ctx.createImageData(SIZE, SIZE);
    pixels.forEach((v, i) => {
      image.data[i * 4] = image.data[i * 4 + 1] = image.data[i * 4 + 2] = v;
      image.data[i * 4 + 3] = 255;
    });
    ctx.putImageData(image, 0, 0);
  }, [pixels]);
  return (
    <figure style={{ margin: 0 }}>
      <div className={simStyles.canvasWrap} role="img" aria-label={label}>
        <canvas ref={ref} width={SIZE} height={SIZE} style={{ imageRendering: "auto" }} />
      </div>
      <figcaption style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: 4 }}>
        {label}
      </figcaption>
    </figure>
  );
}

function Histogram({ pixels }: { pixels: Uint8Array }): ReactNode {
  const h = histogram(pixels, 64);
  const max = Math.max(...h);
  return (
    <svg
      viewBox="0 0 256 60"
      role="img"
      aria-label="Histograma de intensidades"
      style={{ marginTop: 6 }}
    >
      {h.map((v, i) => (
        <rect
          key={i}
          x={i * 4}
          y={60 - (v / max) * 58}
          width={3.4}
          height={(v / max) * 58}
          fill="var(--subject-color, var(--plot-1))"
        />
      ))}
    </svg>
  );
}

/** Loads an exported raw (pre-CLAHE) radiograph as grayscale pixels, or null if unavailable. */
function useLocalRaw(sampleId: string | null): Uint8Array | null {
  const [pixels, setPixels] = useState<Uint8Array | null>(null);
  useEffect(() => {
    if (sampleId === null) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
      const gray = new Uint8Array(SIZE * SIZE);
      for (let i = 0; i < gray.length; i++) gray[i] = data[i * 4] ?? 0;
      setPixels(gray);
    };
    img.src = localUrl(`muestras/${sampleId}/raw.png`);
  }, [sampleId]);
  return pixels;
}

export default function ClaheSim(): ReactNode {
  const manifest = useTfmManifest();
  const samples = manifest.status === "ready" ? manifest.manifest.samples : [];
  const [source, setSource] = useState<string>("sintetica");
  const [clip, setClip] = useState(2);
  const [grid, setGrid] = useState(8);
  const synthetic = useMemo(() => syntheticSpine(SIZE), []);
  const local = useLocalRaw(source === "sintetica" ? null : source);
  const raw = source !== "sintetica" && local ? local : synthetic;
  const out = useMemo(() => clahe(raw, SIZE, SIZE, clip, grid), [raw, clip, grid]);
  const std = (p: Uint8Array): number => {
    let s = 0;
    let s2 = 0;
    for (const v of p) {
      s += v;
      s2 += v * v;
    }
    const m = s / p.length;
    return Math.sqrt(s2 / p.length - m * m);
  };

  return (
    <SimFrame
      title="CLAHE: el preprocesado de cada radiografía"
      intro="Las radiografías salen del DICOM con poco contraste. El TFM aplica CLAHE (clipLimit 2,0, rejilla 8×8): ecualiza el histograma por zonas, limitando cuánto se puede estirar cada una para no amplificar el ruido. Prueba sin límite (clip 0) o con una rejilla de 1×1 (ecualización global)."
      onReset={() => {
        setClip(2);
        setGrid(8);
      }}
      controls={
        <>
          <Choice
            label="Imagen"
            value={source}
            onChange={setSource}
            options={[
              { value: "sintetica", label: "Sintética" },
              ...samples
                .filter((s) => s.view === "AP")
                .map((s, i) => ({ value: s.id, label: `Real ${i + 1}` })),
            ]}
          />
          <Slider
            label="clipLimit (0 = sin límite)"
            value={clip}
            min={0}
            max={10}
            step={0.5}
            onChange={setClip}
            format={(v) => v.toFixed(1)}
          />
          <Slider
            label="Rejilla de teselas"
            value={grid}
            min={1}
            max={16}
            onChange={setGrid}
            format={(v) => `${v}×${v}`}
          />
          <ControlNote>
            {samples.length === 0
              ? "Sin las imágenes locales del TFM solo está la radiografía sintética."
              : "Las imágenes reales son las exportadas por scripts/tfm/export_assets.py."}
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Contraste antes (σ)" value={std(raw).toFixed(1)} />
          <Stat label="Contraste después (σ)" value={std(out).toFixed(1)} />
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <GrayCanvas pixels={raw} label="Original (DICOM normalizado)" />
          <Histogram pixels={raw} />
        </div>
        <div>
          <GrayCanvas pixels={out} label={`CLAHE (clip ${clip.toFixed(1)}, ${grid}×${grid})`} />
          <Histogram pixels={out} />
        </div>
      </div>
    </SimFrame>
  );
}
