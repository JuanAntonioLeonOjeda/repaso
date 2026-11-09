import { deepLearning } from "./deep-learning";
import { fastapi } from "./fastapi";
import { generativa } from "./generativa";
import { llm } from "./llm";
import { noSupervisado } from "./no-supervisado";
import { optimizacion } from "./optimizacion";
import { python } from "./python";
import { razonamiento } from "./razonamiento";
import { refuerzo } from "./refuerzo";
import { supervisado } from "./supervisado";
import { texto } from "./texto";
import { tfm } from "./tfm";
import { vision } from "./vision";
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

/**
 * "Tutoriales": end-to-end projects browsed like a subject. The deep learning ones put the
 * syllabus together step by step; FastAPI covers a tool the master did not.
 */
export const tutorials: readonly Subject[] = [vision, texto, generativa, llm, fastapi];

/** Every browsable section (subjects, the TFM and the tutorials), for routing and progress. */
export const sections: readonly Subject[] = [...subjects, tfm, ...tutorials];
