/**
 * The TFM images come from patients of the LUMOS dataset, so they are generated on this
 * machine by `scripts/tfm/export_assets.py` into `public/tfm-local/` and never committed
 * (ADR-0004). This module reads their manifest; when it is missing, the section explains how
 * to generate it instead of failing.
 */
import { useSyncExternalStore } from "react";

export const LOCAL_BASE = `${import.meta.env.BASE_URL}tfm-local`;

export interface LayerInfo {
  size: number;
  channels: number;
  /** Channel indices exported for this stage (the most spatially structured ones). */
  shown: readonly number[];
}

export interface Sample {
  id: string;
  view: string;
  trueClass: string;
  trueBmd: number;
  tScore: number;
  /** Probabilities for [sano, osteopenia, osteoporosis]. */
  probs: readonly number[];
  predictedClass: string;
  predictedBmd: number;
  layers: Record<string, LayerInfo>;
  gradcam: Record<string, readonly string[]>;
}

export interface Manifest {
  experiments: Record<
    string,
    Partial<Record<"history" | "confusion" | "scatter" | "image", string>>
  >;
  samples: readonly Sample[];
}

export type ManifestState =
  { status: "loading" } | { status: "missing" } | { status: "ready"; manifest: Manifest };

function isManifest(value: unknown): value is Manifest {
  return (
    typeof value === "object" &&
    value !== null &&
    "samples" in value &&
    Array.isArray(value.samples) &&
    "experiments" in value
  );
}

let state: ManifestState = { status: "loading" };
let requested = false;
const listeners = new Set<() => void>();

function load(): void {
  if (requested) return;
  requested = true;
  fetch(`${LOCAL_BASE}/manifest.json`)
    .then(async (response) => {
      const data: unknown = response.ok ? await response.json() : null;
      state = isManifest(data) ? { status: "ready", manifest: data } : { status: "missing" };
    })
    .catch(() => {
      // Not generated (404 served as index.html, or no file at all): the section degrades.
      state = { status: "missing" };
    })
    .finally(() => {
      listeners.forEach((listener) => {
        listener();
      });
    });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

export function useTfmManifest(): ManifestState {
  return useSyncExternalStore(subscribe, () => state);
}

export function localUrl(path: string): string {
  return `${LOCAL_BASE}/${path}`;
}
