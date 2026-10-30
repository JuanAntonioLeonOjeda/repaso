import { useState, type ReactNode } from "react";

import {
  ButtonRow,
  Choice,
  ControlNote,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  useAnimation,
} from "@/features/simulations/kit";

import { eagerEvents, lazyEvents, type PipelineEvent, type Stage } from "./pipeline";

const W = 560;
const H = 190;
const STAGES: readonly { stage: Stage; code: string }[] = [
  { stage: "source", code: "range(1, n + 1)" },
  { stage: "filter", code: "if x % 2 == 0" },
  { stage: "map", code: "x ** 2" },
  { stage: "take", code: "islice(…, k)" },
];
type Mode = "lazy" | "eager";

export default function GeneratorPipelineSim(): ReactNode {
  const [mode, setMode] = useState<Mode>("lazy");
  const [n, setN] = useState(30);
  const [k, setK] = useState(3);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const events = mode === "lazy" ? lazyEvents(n, k) : eagerEvents(n, k);
  const done = step >= events.length;
  useAnimation(isPlaying && !done, 6, () => {
    setStep((s) => Math.min(events.length, s + 1));
  });
  const seen = events.slice(0, step);
  const current: PipelineEvent | undefined = seen.at(-1);
  const work = STAGES.map(({ stage }) => seen.filter((e) => e.stage === stage).length);
  const output = seen.filter((e) => e.stage === "take").map((e) => e.value);
  const memory = current?.inMemory ?? 0;
  const peak = Math.max(0, ...seen.map((e) => e.inMemory));
  const restart = (): void => {
    setStep(0);
    setIsPlaying(false);
  };
  const colW = (W - 20) / STAGES.length;

  return (
    <SimFrame
      title="Listas frente a generadores"
      intro="Queremos los k primeros cuadrados pares de 1..n. Con listas, cada paso termina entero antes del siguiente y guarda su resultado. Con generadores, take pide un valor y ese valor recorre toda la cadena: se para en cuanto tiene k y no guarda nada por el camino."
      onReset={restart}
      controls={
        <>
          <Choice
            label="Estilo"
            value={mode}
            onChange={(v) => {
              setMode(v);
              restart();
            }}
            options={[
              { value: "lazy", label: "generadores (perezoso)" },
              { value: "eager", label: "listas (ansioso)" },
            ]}
          />
          <Slider
            label="n (datos)"
            value={n}
            min={10}
            max={60}
            onChange={(v) => {
              setN(v);
              restart();
            }}
          />
          <Slider
            label="k (los que quiero)"
            value={k}
            min={1}
            max={5}
            onChange={(v) => {
              setK(v);
              restart();
            }}
          />
          <ButtonRow>
            <SimButton
              isPrimary
              onClick={() => {
                setIsPlaying((p) => !p);
              }}
              isDisabled={done}
            >
              {isPlaying ? "Pausa" : "Reproducir"}
            </SimButton>
            <SimButton
              onClick={() => {
                setStep((s) => Math.min(events.length, s + 1));
              }}
              isDisabled={done}
            >
              Un paso
            </SimButton>
            <SimButton
              onClick={() => {
                setStep(events.length);
                setIsPlaying(false);
              }}
              isDisabled={done}
            >
              Hasta el final
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Así entrena Keras con datos que no caben en memoria: un generador (o un{" "}
            <code>PyDataset</code>) lee del disco un lote, el modelo lo consume y se pide el
            siguiente.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Pasos de trabajo" value={`${String(step)} / ${String(events.length)}`} />
          <Stat
            label="Valores en memoria"
            value={`${String(memory)} (pico ${String(peak)})`}
            tone={peak > k ? "bad" : "good"}
          />
          <Stat label="Salida" value={<code>[{output.join(", ")}]</code>} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`Paso ${String(step)} de ${String(events.length)}. Trabajo por etapa: ${work.join(", ")}. Salida: ${output.join(", ")}`}
      >
        {STAGES.map(({ stage, code }, i) => {
          const isActive = current?.stage === stage;
          const x = 10 + i * colW;
          return (
            <g key={stage}>
              <rect
                x={x + 4}
                y={10}
                width={colW - 8}
                height={110}
                rx={8}
                fill={isActive ? "var(--subject-soft)" : "var(--color-surface-sunken)"}
                stroke={isActive ? "var(--subject-color)" : "var(--color-line)"}
                strokeWidth={isActive ? 2 : 1}
              />
              <text
                x={x + colW / 2}
                y={32}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill="var(--color-muted)"
              >
                {code}
              </text>
              <text
                x={x + colW / 2}
                y={78}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={26}
                fontWeight={700}
                fill={
                  isActive && current.passed === false ? "var(--color-bad)" : "var(--color-ink)"
                }
              >
                {isActive ? String(current.value) : "·"}
              </text>
              <text
                x={x + colW / 2}
                y={108}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-muted)"
              >
                {`${String(work[i] ?? 0)} veces`}
              </text>
              {i < STAGES.length - 1 && (
                <path
                  d={`M${String(x + colW - 4)},65 l8,0`}
                  stroke="var(--color-muted)"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}
        <text x={14} y={146} fontSize={11} fill="var(--color-muted)">
          memoria
        </text>
        <rect x={70} y={136} width={W - 84} height={14} rx={4} fill="var(--color-surface-sunken)" />
        <rect
          x={70}
          y={136}
          width={((W - 84) * memory) / (2 * n + k)}
          height={14}
          rx={4}
          fill={memory > k ? "var(--color-bad)" : "var(--subject-color)"}
        />
        <text x={14} y={176} fontSize={12} fill="var(--color-ink)">
          {done
            ? mode === "lazy"
              ? `Terminado: el origen solo produjo ${String(work[0] ?? 0)} de ${String(n)} números.`
              : `Terminado: se procesaron los ${String(n)} números para quedarse con ${String(k)}.`
            : " "}
        </text>
      </svg>
    </SimFrame>
  );
}
