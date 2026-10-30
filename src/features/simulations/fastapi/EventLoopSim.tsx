import { useState, type ReactNode } from "react";

import { Choice, ControlNote, SimFrame, Slider, Stat } from "@/features/simulations/kit";

import { schedule, type Mode, type Segment } from "./event-loop";

// Narrow on purpose: it shares the frame with the controls and must stay legible on a phone.
const W = 420;
const LEFT = 34;
const ROW_H = 20;
const TOP = 8;

const MODE_CODE: Record<Mode, string> = {
  await: "async def + await asyncio.sleep(…)",
  blocking: "async def + time.sleep(…)",
  threads: "def + time.sleep(…)",
};

function ms(value: number): string {
  return `${String(Math.round(value))} ms`;
}

function Bar({
  segment,
  y,
  scale,
  isBlocking,
}: {
  segment: Segment;
  y: number;
  scale: (t: number) => number;
  isBlocking: boolean;
}): ReactNode {
  const x = scale(segment.start);
  const width = Math.max(1, scale(segment.end) - x);
  const mid = y + ROW_H / 2 - 1;
  switch (segment.kind) {
    case "queued":
    case "waiting-cpu":
      return (
        <path
          d={`M${String(x)},${String(mid)} h${String(width)}`}
          stroke="var(--color-muted)"
          strokeDasharray={segment.kind === "queued" ? "6 3" : "1 3"}
          strokeWidth={1.5}
        />
      );
    case "cpu":
      return <rect x={x} y={y + 2} width={width} height={ROW_H - 6} fill="var(--subject-color)" />;
    case "io":
      return (
        <rect
          x={x}
          y={y + 2}
          width={width}
          height={ROW_H - 6}
          fill={isBlocking ? "var(--color-bad-soft)" : "var(--subject-soft)"}
          stroke={isBlocking ? "var(--color-bad)" : "var(--subject-color)"}
        />
      );
    default: {
      const unreachable: never = segment.kind;
      return unreachable;
    }
  }
}

export default function EventLoopSim(): ReactNode {
  const [mode, setMode] = useState<Mode>("await");
  const [n, setN] = useState(8);
  const [ioMs, setIoMs] = useState(100);
  const [cpuMs, setCpuMs] = useState(10);
  const [threads, setThreads] = useState(40);
  const result = schedule({ mode, n, cpuMs, ioMs, threads });
  // Fixed to the worst case (everything in a row) so switching modes shows the difference.
  const worst = Math.max(1, schedule({ mode: "blocking", n, cpuMs, ioMs }).total);
  const scale = (t: number): number => LEFT + ((W - LEFT - 10) * t) / worst;
  const H = TOP + n * ROW_H + 24;

  return (
    <SimFrame
      title="El event loop: def, async def y lo que bloquea"
      intro="Llegan varias peticiones a la vez. Cada una hace un poco de trabajo en Python y luego espera a algo de fuera (una base de datos, otra API). Cambia cómo está escrito el endpoint y mira cuánto tarda la última respuesta."
      onReset={() => {
        setMode("await");
        setN(8);
        setIoMs(100);
        setCpuMs(10);
        setThreads(40);
      }}
      controls={
        <>
          <Choice
            label="Endpoint"
            value={mode}
            onChange={setMode}
            options={[
              { value: "await", label: "async def que espera con await" },
              { value: "blocking", label: "async def con una llamada bloqueante" },
              { value: "threads", label: "def (pool de hilos)" },
            ]}
          />
          <Slider label="Peticiones simultáneas" value={n} min={1} max={12} onChange={setN} />
          <Slider
            label="Espera de E/S"
            value={ioMs}
            min={0}
            max={300}
            step={10}
            onChange={setIoMs}
            format={ms}
          />
          <Slider
            label="Trabajo de CPU"
            value={cpuMs}
            min={0}
            max={100}
            step={5}
            onChange={setCpuMs}
            format={ms}
          />
          {mode === "threads" && (
            <Slider label="Hilos del pool" value={threads} min={1} max={40} onChange={setThreads} />
          )}
          <ControlNote>
            <code>{MODE_CODE[mode]}</code>. Prueba a subir el trabajo de CPU: ni async ni los hilos
            lo reparten, porque Python ejecuta su código de uno en uno (el GIL). Para eso hacen
            falta varios procesos (<code>uvicorn --workers 4</code>).
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Última respuesta" value={ms(result.total)} />
          <Stat label="Latencia media" value={ms(result.meanLatency)} />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`${MODE_CODE[mode]}: ${String(n)} peticiones, la última responde a los ${ms(result.total)}, latencia media ${ms(result.meanLatency)}`}
      >
        {result.requests.map((request, i) => {
          const y = TOP + i * ROW_H;
          return (
            <g key={i}>
              <text x={4} y={y + ROW_H / 2 + 3} fontSize={11} fill="var(--color-muted)">
                #{i + 1}
              </text>
              {request.segments.map((segment, j) => (
                <Bar
                  key={j}
                  segment={segment}
                  y={y}
                  scale={scale}
                  isBlocking={mode === "blocking"}
                />
              ))}
            </g>
          );
        })}
        <path
          d={`M${String(scale(result.total))},${String(TOP)} V${String(TOP + n * ROW_H)}`}
          stroke="var(--color-ink)"
          strokeDasharray="2 2"
        />
        <text
          x={Math.min(scale(result.total), W - 60)}
          y={TOP + n * ROW_H + 16}
          fontSize={11}
          fill="var(--color-ink)"
        >
          {ms(result.total)}
        </text>
      </svg>
      <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)" }}>
        Barra rellena: trabajo de Python. Barra hueca: esperando E/S
        {mode === "blocking" ? " (en rojo: bloquea el event loop)" : ""}. Línea de rayas: en cola
        por un hilo libre. Línea de puntos: esperando su turno para ejecutar Python.
      </p>
    </SimFrame>
  );
}
