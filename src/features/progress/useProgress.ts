import { useSyncExternalStore } from "react";

import { progressStore, type Progress } from "./progress-store";

export function useProgress(): Progress {
  return useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot);
}
