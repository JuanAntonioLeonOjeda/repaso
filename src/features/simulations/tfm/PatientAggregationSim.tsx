import { useMemo, useState, type ReactNode } from "react";

import {
  ButtonRow,
  ControlNote,
  createRng,
  format,
  gaussian,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const PATIENTS = 120;

function softmax(z: readonly number[]): number[] {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

/**
 * Synthetic patients (no real data): each has a true class and two radiographs. The model's
 * logits for each image are the true class plus a patient effect (shared by both views) and
 * image noise (independent per view). Averaging the two views' probabilities cancels the
 * image noise, not the patient effect.
 */
export function simulateAggregation(
  imageNoise: number,
  patientNoise: number,
  seed: number,
): { image: number; patient: number } {
  const rng = createRng(seed);
  let imageHits = 0;
  let patientHits = 0;
  for (let p = 0; p < PATIENTS; p++) {
    const label = p % 3;
    const shared = range(3).map(() => gaussian(rng) * patientNoise);
    const views = range(2).map(() =>
      softmax(
        range(3).map(
          (c) => (c === label ? 1.2 : 0) + (shared[c] ?? 0) + gaussian(rng) * imageNoise,
        ),
      ),
    );
    for (const probs of views) if (probs.indexOf(Math.max(...probs)) === label) imageHits++;
    const mean = range(3).map((c) => ((views[0]?.[c] ?? 0) + (views[1]?.[c] ?? 0)) / 2);
    if (mean.indexOf(Math.max(...mean)) === label) patientHits++;
  }
  return { image: imageHits / (2 * PATIENTS), patient: patientHits / PATIENTS };
}

export default function PatientAggregationSim(): ReactNode {
  const [imageNoise, setImageNoise] = useState(1.2);
  const [patientNoise, setPatientNoise] = useState(0.6);
  const [seed, setSeed] = useState(1);
  const result = useMemo(
    () => simulateAggregation(imageNoise, patientNoise, seed),
    [imageNoise, patientNoise, seed],
  );
  const gain = result.patient - result.image;

  return (
    <SimFrame
      title="¿Por imagen o por paciente?"
      intro="Cada paciente tiene dos radiografías (AP y lateral). El TFM promedia las probabilidades de ambas y da un diagnóstico por paciente, como en la consulta. Con pacientes sintéticos: el ruido «de imagen» es distinto en cada vista; el ruido «de paciente» lo comparten las dos (un paciente difícil lo es en ambas)."
      onReset={() => {
        setImageNoise(1.2);
        setPatientNoise(0.6);
        setSeed(1);
      }}
      controls={
        <>
          <Slider
            label="Ruido propio de cada imagen"
            value={imageNoise}
            min={0}
            max={3}
            step={0.1}
            onChange={setImageNoise}
            format={(v) => format(v, 1)}
          />
          <Slider
            label="Ruido compartido por el paciente"
            value={patientNoise}
            min={0}
            max={3}
            step={0.1}
            onChange={setPatientNoise}
            format={(v) => format(v, 1)}
          />
          <ButtonRow>
            <SimButton
              onClick={() => {
                setSeed((s) => s + 1);
              }}
            >
              Otros pacientes
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Promediar solo corrige lo que es independiente entre vistas. En tu TFM, la ganancia fue
            de unos 4 puntos (0,627 por imagen → 0,669 por paciente con el modelo final).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Accuracy por imagen" value={format(result.image, 3)} />
          <Stat label="Accuracy por paciente" value={format(result.patient, 3)} />
          <Stat
            label="Ganancia"
            value={`${gain >= 0 ? "+" : ""}${format(gain * 100, 1)} pts`}
            tone={gain > 0.02 ? "good" : "default"}
          />
        </>
      }
    >
      <svg
        viewBox="0 0 520 140"
        role="img"
        aria-label={`Accuracy por imagen ${format(result.image, 3)} y por paciente ${format(result.patient, 3)}`}
      >
        {[
          ["por imagen", result.image, "var(--plot-1)"],
          ["por paciente", result.patient, "var(--subject-color, var(--plot-3))"],
        ].map(([label, value, colour], i) => (
          <g key={String(label)} transform={`translate(0 ${20 + i * 55})`}>
            <text x={10} y={22} fontSize={13} fill="var(--color-ink)" fontWeight={600}>
              {label}
            </text>
            <rect
              x={120}
              y={6}
              width={380}
              height={24}
              rx={4}
              fill="var(--color-surface)"
              stroke="var(--color-line)"
            />
            <rect
              x={120}
              y={6}
              width={380 * Number(value)}
              height={24}
              rx={4}
              fill={String(colour)}
            />
            <text x={126 + 380 * Number(value)} y={23} fontSize={12} fill="var(--color-ink)">
              {format(Number(value), 3)}
            </text>
          </g>
        ))}
      </svg>
    </SimFrame>
  );
}
