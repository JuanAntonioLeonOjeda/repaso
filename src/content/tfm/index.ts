import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

const TFM = "../tfm";

/**
 * The master's thesis, told as a project: what was done, why, and which lessons of the
 * subjects it uses. Patient-derived images are local only (ADR-0004).
 */
export const tfm: Subject = {
  slug: "tfm",
  title: "TFM: osteopenia lumbar con deep learning",
  code: "Trabajo Fin de Máster",
  tagline:
    "LumosNet sobre el dataset LUMOS: del DICOM a la API, con lo que ve cada capa de la red, la bitácora de experimentos y su relación con el temario.",
  lessons: [
    defineLesson({
      slug: "el-problema",
      title: "El problema: osteoporosis y T-score",
      summary:
        "Qué se quiere detectar, cómo se diagnostica (BMD, T-score) y por qué la osteopenia es la clase difícil.",
      minutes: 15,
      sources: [
        `${TFM}-memoria/secciones/introduccion.tex`,
        `${TFM}-memoria/secciones/marco_teorico.tex`,
      ],
      exercises: ["t-score", "clasificar-t"],
      load: () => import("./01-el-problema.mdx"),
    }),
    defineLesson({
      slug: "los-datos",
      title: "Los datos: LUMOS, DICOM y CLAHE",
      summary:
        "Del DICOM crudo a la matriz de entrenamiento, y la partición por paciente que hace creíble todo lo demás.",
      minutes: 20,
      sources: [
        `${TFM}/data/df_import.py`,
        `${TFM}/data/df_preprocess.py`,
        `${TFM}/data/lumos_dataset.py`,
      ],
      exercises: ["imagenes-por-paciente", "split-paciente", "volteo"],
      load: () => import("./02-los-datos.mdx"),
    }),
    defineLesson({
      slug: "el-modelo",
      title: "El modelo: LumosNet",
      summary:
        "ResNet50 preentrenada, covariables clínicas y dos cabezas; y lo que ve cada etapa de la red.",
      minutes: 20,
      sources: [`${TFM}/models/lumosnet.py`],
      exercises: ["params-shared", "params-clasificador", "multitarea"],
      load: () => import("./03-el-modelo.mdx"),
    }),
    defineLesson({
      slug: "entrenamiento",
      title: "Entrenamiento: fine-tuning, pérdida y balanceo",
      summary:
        "Estrategia por fases frente a diferencial, la pérdida CE + 10·MSE, los pesos de clase y la parada temprana.",
      minutes: 25,
      sources: [
        `${TFM}/training/train.py`,
        `${TFM}/training/strategies/`,
        `${TFM}-memoria/secciones/materiales_y_metodos.tex`,
      ],
      exercises: ["peso-inverso", "pesos-efectivos", "early-stopping"],
      load: () => import("./04-entrenamiento.mdx"),
    }),
    defineLesson({
      slug: "experimentos",
      title: "Bitácora de experimentos (v0 → v8)",
      summary:
        "Qué se cambió en cada versión, por qué y qué pasó, con todas las cifras reevaluadas en el mismo test.",
      minutes: 25,
      sources: [`${TFM}/outputs/`, `${TFM}-memoria/secciones/materiales_y_metodos.tex`],
      exercises: ["disenio-roi", "pacientes-por-punto"],
      load: () => import("./05-experimentos.mdx"),
    }),
    defineLesson({
      slug: "evaluacion",
      title: "Evaluación: por paciente y con validación cruzada",
      summary:
        "Agregar las dos vistas de cada paciente, qué métricas importan en un cribado y cuánto varía el resultado.",
      minutes: 20,
      sources: [
        `${TFM}/evaluation/evaluate.py`,
        `${TFM}/evaluation/cross_validation.py`,
        `${TFM}/outputs/cv_summary.txt`,
      ],
      exercises: ["agregar", "cv-lectura", "auc-azar"],
      load: () => import("./06-evaluacion.mdx"),
    }),
    defineLesson({
      slug: "explicabilidad",
      title: "Explicabilidad con Grad-CAM",
      summary:
        "Cómo se calcula Grad-CAM, dónde mira LumosNet en cada capa y qué no demuestra un mapa de calor.",
      minutes: 20,
      sources: [`${TFM}/evaluation/gradcam.py`, `${TFM}/evaluation/heatmap_grid.py`],
      exercises: ["gradcam-numpy", "atajo"],
      load: () => import("./07-explicabilidad.mdx"),
    }),
    defineLesson({
      slug: "roi-con-yolo",
      title: "ROI y detector YOLO",
      summary:
        "Del recorte fijo a un detector de la columna entrenado con cajas de Grad-CAM revisadas, y por qué recortar no ayudó.",
      minutes: 20,
      sources: [`${TFM}/yolo/`, `${TFM}/data/variants/roi_yolo.py`],
      exercises: ["caja-desde-mapa", "pseudo-etiquetado", "iou-columna"],
      load: () => import("./08-roi-con-yolo.mdx"),
    }),
    defineLesson({
      slug: "despliegue",
      title: "Despliegue: API y Docker",
      summary:
        "La API FastAPI que sirve el modelo, el Dockerfile y lo que faltaría para un uso clínico real.",
      minutes: 15,
      sources: [`${TFM}/api/`, `${TFM}/infer.py`, `${TFM}/Dockerfile`],
      exercises: ["covariables-api", "modelo-volumen"],
      load: () => import("./09-despliegue.mdx"),
    }),
  ],
};
