import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  ButtonRow,
  Choice,
  ControlNote,
  format,
  linearScale,
  range,
  SimButton,
  SimFrame,
  Slider,
  Stat,
  simStyles,
  useAnimation,
} from "@/features/simulations/kit";

import { useTheme } from "@/features/shell";

import {
  accuracy,
  createMlp,
  forward,
  loss,
  makeDataset,
  trainStep,
  type DatasetName,
  type Mlp,
} from "./mlp";

const GRID = 60;
const VIEW = 300;
const NET_W = 300;
const NET_H = 300;
const MAX_HIDDEN = 8;

function readColour(name: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(value)?.[1] ?? "808080";
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function DecisionMap({
  net,
  mask,
  data,
}: {
  net: Mlp;
  mask: boolean[];
  data: ReturnType<typeof makeDataset>;
}): ReactNode {
  const canvas = useRef<HTMLCanvasElement>(null);
  // Colours come from the theme tokens, so the map is redrawn when the theme changes.
  const theme = useTheme();
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const c0 = readColour("--plot-1");
    const c1 = readColour("--plot-2");
    // Blend towards the sim background so "unsure" reads as empty in both themes.
    const bg = readColour("--color-surface-sunken");
    const image = ctx.createImageData(GRID, GRID);
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const p = forward(
          net,
          { x: -2.5 + (5 * (i + 0.5)) / GRID, y: 2.5 - (5 * (j + 0.5)) / GRID },
          mask,
        ).out;
        const k = (j * GRID + i) * 4;
        // Colour by class, opacity by confidence: the white band is "not sure".
        const conf = Math.abs(p - 0.5) * 2;
        const c = p >= 0.5 ? c1 : c0;
        image.data[k] = bg[0] + (c[0] - bg[0]) * conf * 0.55;
        image.data[k + 1] = bg[1] + (c[1] - bg[1]) * conf * 0.55;
        image.data[k + 2] = bg[2] + (c[2] - bg[2]) * conf * 0.55;
        image.data[k + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [net, mask, theme]);
  const s = linearScale([-2.5, 2.5], [0, VIEW]);
  return (
    <div style={{ position: "relative" }} className={simStyles.canvasWrap}>
      <canvas
        ref={canvas}
        width={GRID}
        height={GRID}
        aria-hidden="true"
        style={{ imageRendering: "auto" }}
      />
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        style={{ position: "absolute", inset: 0, background: "transparent" }}
        role="img"
        aria-label="Frontera de decisión de la red y datos"
      >
        {data.map((d, i) => (
          <circle
            key={i}
            cx={s(d.x)}
            cy={VIEW - s(d.y)}
            r={3.5}
            fill={d.label ? "var(--plot-2)" : "var(--plot-1)"}
            stroke="#fff"
            strokeWidth={1}
          />
        ))}
      </svg>
    </div>
  );
}

function NetworkDiagram({
  net,
  mask,
  onToggle,
}: {
  net: Mlp;
  mask: boolean[];
  onToggle: (j: number) => void;
}): ReactNode {
  const H = net.w2.length;
  const hy = (j: number): number => (NET_H * (j + 1)) / (H + 1);
  const inputs = [NET_H / 3, (2 * NET_H) / 3];
  const maxW = Math.max(1, ...net.w1.flat().map(Math.abs), ...net.w2.map(Math.abs));
  const edge = (
    w: number,
    off: boolean,
  ): { stroke: string; strokeWidth: number; strokeOpacity: number } => ({
    stroke: w >= 0 ? "var(--plot-1)" : "var(--plot-2)",
    strokeWidth: 0.6 + (4 * Math.abs(w)) / maxW,
    strokeOpacity: off ? 0.08 : 0.75,
  });
  return (
    <svg
      viewBox={`0 0 ${NET_W} ${NET_H}`}
      aria-label="Diagrama de la red: haz clic en una neurona oculta para apagarla"
    >
      {net.w1.map((w, j) =>
        inputs.map((iy, i) => (
          <line
            key={`a${j}${i}`}
            x1={40}
            y1={iy}
            x2={150}
            y2={hy(j)}
            {...edge(w[i as 0 | 1], mask[j] === false)}
          />
        )),
      )}
      {net.w2.map((w, j) => (
        <line
          key={`b${j}`}
          x1={150}
          y1={hy(j)}
          x2={262}
          y2={NET_H / 2}
          {...edge(w, mask[j] === false)}
        />
      ))}
      {inputs.map((iy, i) => (
        <g key={`i${i}`}>
          <circle
            cx={40}
            cy={iy}
            r={16}
            fill="var(--color-surface)"
            stroke="var(--color-ink)"
            strokeWidth={2}
          />
          <text x={40} y={iy + 4} textAnchor="middle" fontSize={12} fill="var(--color-ink)">
            x{i + 1}
          </text>
        </g>
      ))}
      {range(H).map((j) => {
        const isOn = mask[j] !== false;
        return (
          <g
            key={`h${j}`}
            role="button"
            tabIndex={0}
            aria-pressed={isOn}
            aria-label={`Neurona oculta ${j + 1}: ${isOn ? "encendida" : "apagada"}`}
            onClick={() => {
              onToggle(j);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(j);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={150}
              cy={hy(j)}
              r={15}
              fill={isOn ? "var(--subject-color, var(--plot-7))" : "var(--color-surface)"}
              stroke="var(--color-ink)"
              strokeWidth={2}
              strokeDasharray={isOn ? undefined : "3 3"}
            />
            <text
              x={150}
              y={hy(j) + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={isOn ? "var(--color-surface)" : "var(--color-muted)"}
            >
              {isOn ? `h${j + 1}` : "off"}
            </text>
          </g>
        );
      })}
      <circle
        cx={262}
        cy={NET_H / 2}
        r={18}
        fill="var(--color-surface)"
        stroke="var(--color-ink)"
        strokeWidth={2}
      />
      <text x={262} y={NET_H / 2 + 4} textAnchor="middle" fontSize={12} fill="var(--color-ink)">
        ŷ
      </text>
    </svg>
  );
}

export default function MlpTrainerSim(): ReactNode {
  const [dataset, setDataset] = useState<DatasetName>("circle");
  const [hidden, setHidden] = useState(4);
  const [lr, setLr] = useState(0.5);
  const [seed, setSeed] = useState(1);
  const [isTraining, setIsTraining] = useState(false);
  const data = useMemo(() => makeDataset(dataset), [dataset]);
  const [net, setNet] = useState(() => createMlp(4, 1));
  const [mask, setMask] = useState<boolean[]>(() => new Array<boolean>(MAX_HIDDEN).fill(true));
  const [epoch, setEpoch] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);

  function restart(nextHidden = hidden, nextSeed = seed): void {
    setIsTraining(false);
    setNet(createMlp(nextHidden, nextSeed));
    setMask(new Array<boolean>(MAX_HIDDEN).fill(true));
    setEpoch(0);
    setLossHistory([]);
  }

  useAnimation(isTraining, 30, () => {
    let n = net;
    for (let i = 0; i < 10; i++) n = trainStep(n, data, lr, mask);
    setNet(n);
    setEpoch((e) => e + 10);
    setLossHistory((h) => [...h.slice(-149), loss(n, data, mask)]);
  });

  const currentLoss = loss(net, data, mask);
  const acc = accuracy(net, data, mask);
  const maxLoss = Math.max(0.8, ...lossHistory);

  return (
    <SimFrame
      title="Entrena una red y apaga neuronas"
      intro={
        <>
          Una red con una capa oculta aprende a separar dos clases. Pulsa <strong>Entrenar</strong>{" "}
          y, cuando acierte, <strong>haz clic en las neuronas ocultas para apagarlas</strong>: verás
          qué trozo de la frontera dibujaba cada una. Azul = peso positivo, naranja = negativo.
        </>
      }
      onReset={() => {
        setDataset("circle");
        setHidden(4);
        setLr(0.5);
        restart(4, 1);
      }}
      controls={
        <>
          <Choice
            label="Datos"
            value={dataset}
            onChange={(v) => {
              setDataset(v);
              restart();
            }}
            options={[
              { value: "linear", label: "Lineal" },
              { value: "xor", label: "XOR" },
              { value: "circle", label: "Círculo" },
              { value: "spiral", label: "Espiral" },
            ]}
          />
          <Slider
            label="Neuronas ocultas"
            value={hidden}
            min={1}
            max={MAX_HIDDEN}
            onChange={(v) => {
              setHidden(v);
              restart(v);
            }}
          />
          <Slider
            label="Learning rate"
            value={lr}
            min={0.01}
            max={3}
            step={0.01}
            onChange={setLr}
            format={(v) => format(v)}
          />
          <ButtonRow>
            <SimButton
              isPrimary
              onClick={() => {
                setIsTraining((t) => !t);
              }}
            >
              {isTraining ? "Pausar" : "Entrenar"}
            </SimButton>
            <SimButton
              onClick={() => {
                const s = seed + 1;
                setSeed(s);
                restart(hidden, s);
              }}
            >
              Nuevos pesos
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Prueba: el círculo con 1 o 2 neuronas no se puede (necesitas al menos 3 «rectas»). La
            espiral necesita muchas. Con learning rate muy alto la pérdida oscila.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Épocas" value={epoch} />
          <Stat label="Pérdida (log-loss)" value={format(currentLoss, 3)} />
          <Stat
            label="Accuracy"
            value={`${format(acc * 100, 0)}%`}
            tone={acc > 0.95 ? "good" : "default"}
          />
          <svg
            viewBox="0 0 150 40"
            width={150}
            height={40}
            aria-label="Evolución de la pérdida"
            role="img"
            style={{ background: "transparent" }}
          >
            <polyline
              points={lossHistory.map((l, i) => `${i},${40 - (l / maxLoss) * 38}`).join(" ")}
              fill="none"
              stroke="var(--subject-color, var(--plot-1))"
              strokeWidth={1.5}
            />
          </svg>
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <NetworkDiagram
          net={net}
          mask={mask}
          onToggle={(j) => {
            setMask((m) => m.map((v, i) => (i === j ? !v : v)));
          }}
        />
        <DecisionMap net={net} mask={mask} data={data} />
      </div>
    </SimFrame>
  );
}
