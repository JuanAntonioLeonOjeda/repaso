import { useSyncExternalStore } from "react";

import type { WorkerStatus } from "./protocol";
import { pythonClient } from "./python-client";

export function usePythonStatus(): WorkerStatus {
  return useSyncExternalStore(pythonClient.subscribe, pythonClient.getStatus);
}
