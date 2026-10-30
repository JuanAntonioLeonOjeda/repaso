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

import {
  addSaturate,
  addWrap,
  blend,
  edges,
  makeScene,
  makeStripes,
  type EdgeMode,
  type GrayImage,
} from "./image";

const SIZE = 96;
type Operation = "brightness" | "blend" | "edges";
type Arithmetic = "numpy" | "opencv";

function GrayCanvas({ image, label }: { image: GrayImage; label: string }): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const data = ctx.createImageData(image.width, image.height);
    image.pixels.forEach((v, i) => {
      data.data[i * 4] = data.data[i * 4 + 1] = data.data[i * 4 + 2] = v;
      data.data[i * 4 + 3] = 255;
    });
    ctx.putImageData(data, 0, 0);
  }, [image]);
  return (
    <figure style={{ margin: 0, flex: 1 }}>
      <div className={simStyles.canvasWrap} role="img" aria-label={label}>
        <canvas ref={ref} width={image.width} height={image.height} />
      </div>
      <figcaption style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: 4 }}>
        {label}
      </figcaption>
    </figure>
  );
}

export default function ImageOpsSim(): ReactNode {
  const [operation, setOperation] = useState<Operation>("brightness");
  const [delta, setDelta] = useState(80);
  const [arithmetic, setArithmetic] = useState<Arithmetic>("numpy");
  const [alpha, setAlpha] = useState(0.7);
  const [edgeMode, setEdgeMode] = useState<EdgeMode>("uint8");
  const scene = useMemo(() => makeScene(SIZE), []);
  const stripes = useMemo(() => makeStripes(SIZE), []);
  const result = useMemo(() => {
    if (operation === "brightness")
      return arithmetic === "numpy" ? addWrap(scene, delta) : addSaturate(scene, delta);
    if (operation === "blend") return blend(scene, stripes, alpha);
    return edges(scene, edgeMode);
  }, [operation, arithmetic, delta, alpha, edgeMode, scene, stripes]);
  const code =
    operation === "brightness"
      ? arithmetic === "numpy"
        ? `img + np.uint8(${String(delta)})`
        : `cv2.add(img, ${String(delta)})`
      : operation === "blend"
        ? `cv2.addWeighted(img, ${format(alpha, 2)}, rayas, ${format(1 - alpha, 2)}, 0)`
        : edgeMode === "uint8"
          ? "cv2.Sobel(img, cv2.CV_8U, 1, 0)"
          : edgeMode === "float-abs"
            ? "np.abs(cv2.Sobel(img, cv2.CV_64F, 1, 0))"
            : "np.hypot(sobel_x, sobel_y)";
  // pixels whose true sum leaves [0, 255]: NumPy wraps them around, OpenCV clips them
  const overflow = scene.pixels.filter((v) => v + delta > 255 || v + delta < 0).length;
  const edgePixels = result.pixels.filter((v) => v > 60).length;

  return (
    <SimFrame
      title="Una imagen es un array"
      intro="Una imagen en escala de grises es una matriz de enteros uint8 entre 0 y 255. Operar con ella es operar con NumPy… con sus trampas: sumar brillo con NumPy desborda (255 + 1 = 0) y OpenCV satura; y un borde de claro a oscuro tiene gradiente negativo, que se pierde si lo guardas en uint8."
      onReset={() => {
        setOperation("brightness");
        setDelta(80);
        setArithmetic("numpy");
        setAlpha(0.7);
        setEdgeMode("uint8");
      }}
      controls={
        <>
          <Choice
            label="Operación"
            value={operation}
            onChange={setOperation}
            options={[
              { value: "brightness", label: "brillo" },
              { value: "blend", label: "mezcla" },
              { value: "edges", label: "bordes" },
            ]}
          />
          {operation === "brightness" && (
            <>
              <Slider
                label="Sumar"
                value={delta}
                min={-150}
                max={150}
                step={5}
                onChange={setDelta}
              />
              <Choice
                label="Aritmética"
                value={arithmetic}
                onChange={setArithmetic}
                options={[
                  { value: "numpy", label: "NumPy (módulo 256)" },
                  { value: "opencv", label: "cv2.add (satura)" },
                ]}
              />
            </>
          )}
          {operation === "blend" && (
            <Slider
              label="alpha (peso de la imagen)"
              value={alpha}
              min={0}
              max={1}
              step={0.05}
              onChange={setAlpha}
              format={(v) => format(v, 2)}
            />
          )}
          {operation === "edges" && (
            <Choice
              label="Sobel"
              value={edgeMode}
              onChange={setEdgeMode}
              options={[
                { value: "uint8", label: "x en uint8" },
                { value: "float-abs", label: "x en float, |·|" },
                { value: "magnitude", label: "magnitud x e y" },
              ]}
            />
          )}
          <ControlNote>
            OpenCV carga en <strong>BGR</strong>, no RGB: para mostrar con matplotlib,{" "}
            <code>cv2.cvtColor(img, cv2.COLOR_BGR2RGB)</code>.
          </ControlNote>
        </>
      }
      readout={
        <>
          <Stat label="Código" value={<code>{code}</code>} />
          {operation === "brightness" && (
            <Stat
              label={arithmetic === "numpy" ? "Píxeles que dan la vuelta" : "Píxeles saturados"}
              value={overflow}
              tone={arithmetic === "numpy" && overflow > 0 ? "bad" : "default"}
            />
          )}
          {operation === "edges" && <Stat label="Píxeles de borde" value={edgePixels} />}
        </>
      }
    >
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <GrayCanvas image={scene} label="Original" />
        {operation === "blend" && <GrayCanvas image={stripes} label="Rayas" />}
        <GrayCanvas image={result} label={`Resultado: ${code}`} />
      </div>
    </SimFrame>
  );
}
