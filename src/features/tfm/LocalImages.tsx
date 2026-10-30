import { Lock } from "lucide-react";
import { useState, type ReactNode } from "react";

import { localUrl, useTfmManifest, type Manifest } from "./manifest";
import styles from "./Tfm.module.css";

/** Shown wherever patient-derived images would go when they have not been generated. */
export function LocalNotice(): ReactNode {
  return (
    <div className={styles.notice} role="note">
      <Lock size={16} aria-hidden="true" />
      <div>
        <strong>Imágenes solo en local.</strong> Salen de radiografías de pacientes de LUMOS, así
        que no están en el repositorio. Genéralas con tu entorno del TFM:
        <pre>
          <code>../tfm/.venv/bin/python scripts/tfm/export_assets.py --tfm ../tfm</code>
        </pre>
      </div>
    </div>
  );
}

/** Renders `children(manifest)` when the local assets exist, a notice otherwise. */
export function WithLocalAssets({
  children,
}: {
  children: (manifest: Manifest) => ReactNode;
}): ReactNode {
  const state = useTfmManifest();
  if (state.status === "loading") return <p className={styles.muted}>Cargando imágenes locales…</p>;
  if (state.status === "missing") return <LocalNotice />;
  return children(state.manifest);
}

interface PlotsProps {
  /** Experiment key in the manifest (e.g. "v2-phased"). */
  experiment: string;
  caption?: string;
}

const PLOT_LABELS = {
  history: "Curvas de entrenamiento",
  confusion: "Matriz de confusión",
  scatter: "BMD real frente a predicha",
} as const;
type PlotKind = keyof typeof PLOT_LABELS;

/** The plots the TFM saved for one experiment, as tabs. */
export function ExperimentPlots({ experiment, caption }: PlotsProps): ReactNode {
  const [kind, setKind] = useState<PlotKind>("history");
  return (
    <WithLocalAssets>
      {(manifest) => {
        const plots = manifest.experiments[experiment] ?? {};
        const available = (Object.keys(PLOT_LABELS) as PlotKind[]).filter((k) => plots[k]);
        const current = available.includes(kind) ? kind : available[0];
        const src = current === undefined ? undefined : plots[current];
        if (src === undefined)
          return <p className={styles.muted}>No hay gráficas guardadas para este experimento.</p>;
        return (
          <figure className={styles.plots}>
            <div className={styles.tabs} role="tablist" aria-label="Gráficas del experimento">
              {available.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={k === current}
                  onClick={() => {
                    setKind(k);
                  }}
                >
                  {PLOT_LABELS[k]}
                </button>
              ))}
            </div>
            <img
              src={localUrl(src)}
              alt={`${PLOT_LABELS[current ?? "history"]} del experimento ${experiment}`}
            />
            {caption !== undefined && <figcaption>{caption}</figcaption>}
          </figure>
        );
      }}
    </WithLocalAssets>
  );
}

/** A single exported image (Grad-CAM grids, ROI previews, YOLO results…). */
export function LocalImage({
  asset,
  alt,
  caption,
}: {
  asset: string;
  alt: string;
  caption?: string;
}): ReactNode {
  return (
    <WithLocalAssets>
      {(manifest) => {
        const src = manifest.experiments[asset]?.image;
        if (src === undefined)
          return <p className={styles.muted}>Esta imagen no se generó en tu exportación.</p>;
        return (
          <figure className={styles.plots}>
            <img src={localUrl(src)} alt={alt} />
            {caption !== undefined && <figcaption>{caption}</figcaption>}
          </figure>
        );
      }}
    </WithLocalAssets>
  );
}
