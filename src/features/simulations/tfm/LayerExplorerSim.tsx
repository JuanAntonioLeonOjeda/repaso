import { useState, type ReactNode } from "react";

import { Choice, ControlNote, format, SimFrame, Stat } from "@/features/simulations/kit";
import { localUrl, WithLocalAssets, type Manifest } from "@/features/tfm";

const STAGES = [
  {
    id: "conv1",
    label: "conv1",
    rf: 7,
    note: "La primera convolución (7×7, stride 2): bordes y cambios de intensidad, como un filtro de Sobel.",
  },
  {
    id: "layer1",
    label: "layer1",
    rf: 35,
    note: "Texturas finas y orientaciones. Todavía muy local: cada neurona ve unos 35 píxeles.",
  },
  {
    id: "layer2",
    label: "layer2",
    rf: 91,
    note: "Patrones repetidos y contornos de estructuras (bordes de vértebras, costillas).",
  },
  {
    id: "layer3",
    label: "layer3",
    rf: 267,
    note: "Partes: aparecen canales con forma de columna o de cuerpo vertebral. Ya ven casi toda la imagen.",
  },
  {
    id: "layer4",
    label: "layer4",
    rf: 427,
    note: "7×7 «regiones» con significado para la tarea. De aquí sale el vector de 2048 que leen las cabezas.",
  },
] as const;
type StageId = (typeof STAGES)[number]["id"];
type ModelId = "tuned" | "imagenet";

const tile = {
  width: "100%",
  height: "auto",
  imageRendering: "pixelated",
  borderRadius: 6,
  background: "#000",
} as const;

function Explorer({ manifest }: { manifest: Manifest }): ReactNode {
  const samples = manifest.samples;
  const [sampleId, setSampleId] = useState(samples[0]?.id ?? "");
  const [stage, setStage] = useState<StageId>("layer3");
  const [model, setModel] = useState<ModelId>("tuned");
  const sample = samples.find((s) => s.id === sampleId) ?? samples[0];
  if (!sample) return null;
  const info = sample.layers[stage];
  const meta = STAGES.find((s) => s.id === stage);
  const base = `muestras/${sample.id}/${model}/${stage}`;

  return (
    <SimFrame
      title="Qué ve cada etapa de la ResNet50"
      intro="Mapas de activación reales de LumosNet sobre radiografías del test: cada recuadro es un canal (los 8 con más estructura de la etapa). Compara el backbone tal como venía de ImageNet con el ajustado a LUMOS, sobre los mismos canales: el fine-tuning cambia sobre todo las etapas profundas."
      controls={
        <>
          <Choice
            label="Radiografía"
            value={sample.id}
            onChange={setSampleId}
            options={samples.map((s, i) => ({ value: s.id, label: `${i + 1} · ${s.view}` }))}
          />
          <Choice
            label="Etapa"
            value={stage}
            onChange={setStage}
            options={STAGES.map((s) => ({ value: s.id, label: s.label }))}
          />
          <Choice
            label="Pesos"
            value={model}
            onChange={setModel}
            options={[
              { value: "tuned", label: "LumosNet" },
              { value: "imagenet", label: "ImageNet" },
            ]}
          />
          <ControlNote>{meta?.note}</ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Tamaño del mapa" value={info ? `${info.size}×${info.size}` : "—"} />
          <Stat label="Canales de la etapa" value={info?.channels ?? "—"} />
          <Stat label="Campo receptivo ≈" value={`${meta?.rf ?? "—"} px`} />
          <Stat
            label="Real → predicho"
            value={`${sample.trueClass} → ${sample.predictedClass}`}
            tone={sample.trueClass === sample.predictedClass ? "good" : "bad"}
          />
          <Stat
            label="BMD real / predicha"
            value={`${format(sample.trueBmd, 3)} / ${format(sample.predictedBmd, 3)}`}
          />
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 3fr)",
          gap: "var(--space-3)",
          alignItems: "start",
        }}
      >
        <figure style={{ margin: 0 }}>
          <img
            src={localUrl(`muestras/${sample.id}/input.png`)}
            alt={`Radiografía ${sample.view} tras CLAHE`}
            style={tile}
          />
          <figcaption style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
            Entrada (224×224, CLAHE)
          </figcaption>
          <img
            src={localUrl(`${base}/mean.png`)}
            alt={`Media de todos los canales de ${stage}`}
            style={{ ...tile, marginTop: 8 }}
          />
          <figcaption style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
            Media de los {info?.channels} canales
          </figcaption>
        </figure>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
          {info?.shown.map((c) => (
            <figure key={c} style={{ margin: 0 }}>
              <img
                src={localUrl(`${base}/c${c}.png`)}
                alt={`Canal ${c} de ${stage}`}
                style={tile}
              />
              <figcaption
                style={{ fontSize: 10, color: "var(--color-muted)", textAlign: "center" }}
              >
                canal {c}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </SimFrame>
  );
}

export default function LayerExplorerSim(): ReactNode {
  return <WithLocalAssets>{(manifest) => <Explorer manifest={manifest} />}</WithLocalAssets>;
}
