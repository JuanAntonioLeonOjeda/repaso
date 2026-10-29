import { deepLearning } from "./deep-learning";
import { noSupervisado } from "./no-supervisado";
import { optimizacion } from "./optimizacion";
import { razonamiento } from "./razonamiento";
import { refuerzo } from "./refuerzo";
import { supervisado } from "./supervisado";
import type { Subject } from "./types";

/** The subjects in the order they are shown on the home page. */
export const subjects: readonly Subject[] = [
  supervisado,
  noSupervisado,
  deepLearning,
  refuerzo,
  optimizacion,
  razonamiento,
];
