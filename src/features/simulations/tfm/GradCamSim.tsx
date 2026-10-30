import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  Choice,
  ControlNote,
  format,
  SimFrame,
  Slider,
  Stat,
  simStyles,
} from "@/features/simulations/kit";
import { localUrl, WithLocalAssets, type Manifest } from "@/features/tfm";

const SIZE = 224;
type Target = "classification" | "bmd";
type Stage = "layer2" | "layer3" | "layer4";

/** A "jet"-like colour map: blue (low) → green → yellow → red (high). */
function jet(v: number): [number, number, number] {
  const r = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 3)));
  const g = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 2)));
  const b = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 1)));
  return [r * 255, g * 255, b * 255];
}

function loadGray(src: string): Promise<Uint8ClampedArray> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no 2d context"));
        return;
      }
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      resolve(ctx.getImageData(0, 0, SIZE, SIZE).data);
    };
    img.onerror = () => {
      reject(new Error(`cannot load ${src}`));
    };
    img.src = src;
  });
}

function Overlay({
  base,
  cam,
  alpha,
  label,
}: {
  base: string;
  cam: string;
  alpha: number;
  label: string;
}): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadGray(base), loadGray(cam)])
      .then(([b, c]) => {
        const ctx = ref.current?.getContext("2d");
        if (cancelled || !ctx) return;
        const out = ctx.createImageData(SIZE, SIZE);
        for (let i = 0; i < SIZE * SIZE; i++) {
          const g = b[i * 4] ?? 0;
          const v = (c[i * 4] ?? 0) / 255;
          const [r, gg, bb] = jet(v);
          // Blend more where the map is high, so low-importance areas keep the radiograph visible
          const a = alpha * v;
          out.data[i * 4] = g * (1 - a) + r * a;
          out.data[i * 4 + 1] = g * (1 - a) + gg * a;
          out.data[i * 4 + 2] = g * (1 - a) + bb * a;
          out.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(out, 0, 0);
      })
      .catch(() => undefined); // missing file: the canvas stays empty and the notice above explains why
    return () => {
      cancelled = true;
    };
  }, [base, cam, alpha]);
  return (
    <div className={simStyles.canvasWrap} role="img" aria-label={label} style={{ maxWidth: 360 }}>
      <canvas ref={ref} width={SIZE} height={SIZE} style={{ imageRendering: "auto" }} />
    </div>
  );
}

function Explorer({ manifest }: { manifest: Manifest }): ReactNode {
  const samples = manifest.samples;
  const [sampleId, setSampleId] = useState(samples[0]?.id ?? "");
  const [target, setTarget] = useState<Target>("classification");
  const [stage, setStage] = useState<Stage>("layer4");
  const [alpha, setAlpha] = useState(0.6);
  const sample = samples.find((s) => s.id === sampleId) ?? samples[0];
  if (!sample) return null;

  return (
    <SimFrame
      title="Grad-CAM: dónde mira el modelo"
      intro="Grad-CAM pesa cada canal de una capa por cuánto afecta a la salida (la media de su gradiente) y suma: las zonas cálidas son las que más empujan la predicción. Compara la cabeza de clasificación con la de BMD y la capa elegida: layer4 es la que usa el TFM (y la que se usó para pseudo-etiquetar las cajas del YOLO)."
      onReset={() => {
        setTarget("classification");
        setStage("layer4");
        setAlpha(0.6);
      }}
      controls={
        <>
          <Choice
            label="Radiografía"
            value={sample.id}
            onChange={setSampleId}
            options={samples.map((s, i) => ({ value: s.id, label: `${i + 1} · ${s.view}` }))}
          />
          <Choice
            label="Explicar"
            value={target}
            onChange={setTarget}
            options={[
              { value: "classification", label: "Clase predicha" },
              { value: "bmd", label: "BMD" },
            ]}
          />
          <Choice
            label="Capa"
            value={stage}
            onChange={setStage}
            options={[
              { value: "layer2", label: "layer2" },
              { value: "layer3", label: "layer3" },
              { value: "layer4", label: "layer4" },
            ]}
          />
          <Slider
            label="Opacidad del mapa"
            value={alpha}
            min={0}
            max={1}
            step={0.05}
            onChange={setAlpha}
            format={(v) => format(v, 2)}
          />
          <ControlNote>
            En capas tempranas el mapa es fino pero ruidoso (aún no «sabe» de la tarea); en layer4
            es grueso (7×7) pero semántico. Por eso Grad-CAM se suele aplicar a la última capa
            convolucional.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Real" value={`${sample.trueClass} (T = ${format(sample.tScore, 2)})`} />
          <Stat
            label="Predicho"
            value={sample.predictedClass}
            tone={sample.trueClass === sample.predictedClass ? "good" : "bad"}
          />
          <Stat
            label="P(sano / op / os)"
            value={sample.probs.map((p) => format(p, 2)).join(" / ")}
          />
          <Stat
            label="BMD real / predicha"
            value={`${format(sample.trueBmd, 3)} / ${format(sample.predictedBmd, 3)}`}
          />
        </>
      }
    >
      <Overlay
        base={localUrl(`muestras/${sample.id}/input.png`)}
        cam={localUrl(`muestras/${sample.id}/gradcam/${target}-${stage}.png`)}
        alpha={alpha}
        label={`Grad-CAM de ${target === "bmd" ? "la BMD" : "la clase predicha"} en ${stage}`}
      />
    </SimFrame>
  );
}

export default function GradCamSim(): ReactNode {
  return <WithLocalAssets>{(manifest) => <Explorer manifest={manifest} />}</WithLocalAssets>;
}
