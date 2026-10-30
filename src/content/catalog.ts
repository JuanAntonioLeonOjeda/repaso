import { deepLearning } from "./deep-learning";
import { fastapi } from "./fastapi";
import { noSupervisado } from "./no-supervisado";
import { optimizacion } from "./optimizacion";
import { python } from "./python";
import { razonamiento } from "./razonamiento";
import { refuerzo } from "./refuerzo";
import { supervisado } from "./supervisado";
import { tfm } from "./tfm";
import type { Subject } from "./types";

/** The subjects in the order they are shown on the home page. */
export const subjects: readonly Subject[] = [
  python,
  supervisado,
  noSupervisado,
  deepLearning,
  refuerzo,
  optimizacion,
  razonamiento,
];

/** The master's thesis: shown apart from the subjects, but browsed like one. */
export { tfm };

/** "Expandir conocimientos": tutorials beyond the master's syllabus, browsed like a subject. */
export const extras: readonly Subject[] = [fastapi];

/** Every browsable section (subjects, the TFM and the extras), for routing and progress. */
export const sections: readonly Subject[] = [...subjects, tfm, ...extras];
