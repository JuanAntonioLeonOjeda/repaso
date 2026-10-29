import { useState, type ReactNode } from "react";

import {
  Axes,
  Choice,
  ControlNote,
  format,
  linearScale,
  range,
  sigmoid,
  SimFrame,
  Slider,
  Stat,
} from "@/features/simulations/kit";

const W = 560;
const H = 280;
const M = { top: 16, right: 16, bottom: 30, left: 36 };

type Fn = "sigmoid" | "tanh" | "relu" | "leaky" | "gelu";

const FNS: Record<Fn, { f: (z: number) => number; df: (z: number) => number; note: string }> = {
  sigmoid: {
    f: sigmoid,
    df: (z) => sigmoid(z) * (1 - sigmoid(z)),
    note: "Su derivada nunca pasa de 0,25: al encadenar capas, el gradiente se multiplica por ≤ 0,25 cada vez y desaparece. Hoy solo se usa en la salida binaria.",
  },
  tanh: {
    f: Math.tanh,
    df: (z) => 1 - Math.tanh(z) ** 2,
    note: "Centrada en 0 (mejor que la sigmoide en capas ocultas), pero también se satura en los extremos. Habitual en RNN/LSTM.",
  },
  relu: {
    f: (z) => Math.max(0, z),
    df: (z) => (z > 0 ? 1 : 0),
    note: "La opción por defecto en capas ocultas: barata y su gradiente es 1 en la parte positiva. Riesgo: neuronas «muertas» si siempre reciben z < 0.",
  },
  leaky: {
    f: (z) => (z > 0 ? z : 0.1 * z),
    df: (z) => (z > 0 ? 1 : 0.1),
    note: "ReLU con una pequeña pendiente negativa para que las neuronas no mueran del todo.",
  },
  gelu: {
    f: (z) => 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z ** 3))),
    df: (z) => {
      const e = 1e-4;
      const g = (v: number): number =>
        0.5 * v * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (v + 0.044715 * v ** 3)));
      return (g(z + e) - g(z - e)) / (2 * e);
    },
    note: "Versión suave de ReLU; es la que usan BERT, GPT y la mayoría de transformers.",
  },
};

export default function ActivationSim(): ReactNode {
  const [fn, setFn] = useState<Fn>("sigmoid");
  const [z, setZ] = useState(2);
  const [layers, setLayers] = useState(5);
  const { f, df, note } = FNS[fn];
  const x = linearScale([-5, 5], [M.left, W - M.right]);
  const y = linearScale([-1.5, 3], [H - M.bottom, M.top]);
  const path = (g: (v: number) => number): string =>
    range(201)
      .map((i) => {
        const v = -5 + i * 0.05;
        return `${i === 0 ? "M" : "L"}${x(v)},${y(Math.max(-1.5, Math.min(3, g(v))))}`;
      })
      .join(" ");
  // Gradient reaching the first layer if every layer had this derivative (weights = 1)
  const chained = df(z) ** layers;

  return (
    <SimFrame
      title="Funciones de activación y gradientes"
      intro="La curva gruesa es la activación; la discontinua, su derivada (lo que se multiplica en backprop). Mueve z y mira cuánto gradiente llega tras varias capas."
      onReset={() => {
        setFn("sigmoid");
        setZ(2);
        setLayers(5);
      }}
      controls={
        <>
          <Choice
            label="Activación"
            value={fn}
            onChange={setFn}
            options={[
              { value: "sigmoid", label: "Sigmoide" },
              { value: "tanh", label: "tanh" },
              { value: "relu", label: "ReLU" },
              { value: "leaky", label: "Leaky" },
              { value: "gelu", label: "GELU" },
            ]}
          />
          <Slider
            label="Pre-activación z"
            value={z}
            min={-5}
            max={5}
            step={0.1}
            onChange={setZ}
            format={(v) => format(v, 1)}
          />
          <Slider label="Capas encadenadas" value={layers} min={1} max={20} onChange={setLayers} />
          <ControlNote>{note}</ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="f(z)" value={format(f(z), 3)} />
          <Stat label="f′(z)" value={format(df(z), 3)} />
          <Stat
            label={`Gradiente tras ${layers} capas`}
            value={chained < 1e-4 ? chained.toExponential(1) : format(chained, 4)}
            tone={chained < 0.01 ? "bad" : "good"}
          />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfica de ${fn} y su derivada`}>
        <Axes
          width={W}
          height={H}
          margin={M}
          xTicks={[-4, -2, 0, 2, 4]}
          yTicks={[-1, 0, 1, 2, 3]}
          x={x}
          y={y}
          xLabel="z"
        />
        <path
          d={path(df)}
          fill="none"
          stroke="var(--plot-2)"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        <path d={path(f)} fill="none" stroke="var(--plot-1)" strokeWidth={3} />
        <circle cx={x(z)} cy={y(Math.min(3, f(z)))} r={6} fill="var(--plot-1)" />
        <circle cx={x(z)} cy={y(df(z))} r={5} fill="var(--plot-2)" />
      </svg>
    </SimFrame>
  );
}
