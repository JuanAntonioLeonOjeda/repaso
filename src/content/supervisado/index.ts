import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

export const supervisado: Subject = {
  slug: "supervisado",
  title: "Aprendizaje supervisado",
  code: "05MIAR",
  tagline:
    "Predecir números y categorías a partir de ejemplos: limpiar datos, validar sin engañarte, elegir la métrica y los modelos que se usan de verdad.",
  lessons: [
    defineLesson({
      slug: "flujo-de-un-proyecto",
      title: "El flujo de un proyecto de ML",
      summary:
        "Qué es aprender con supervisión, cómo es una tabla de datos y cómo se organiza un proyecto real (CRISP-DM y MLOps).",
      minutes: 15,
      sources: ["Temas/Tema 1.pdf", "Scripts/1_Comprensión_del_problema.ipynb"],
      exercises: ["tipo-problema", "forma-iris", "carne-vino", "fase-crisp"],
      load: () => import("./01-flujo-de-un-proyecto.mdx"),
    }),
    defineLesson({
      slug: "limpieza-de-datos",
      title: "Limpieza de datos",
      summary:
        "Escalar, tratar atípicos, rellenar ausentes y seleccionar atributos sin caer en el data leakage.",
      minutes: 25,
      sources: [
        "Temas/Tema 1.pdf",
        "Prácticas/Programa1.Normalizacion.ipynb",
        "Prácticas/Programa2.Estandarizacion.ipynb",
        "Prácticas/Programa3.Outliers.ipynb",
        "Prácticas/Programa4.Ausentes.ipynb",
        "Prácticas/Programa5-6.SeleccionAtributos.ipynb",
        "Scripts/4_Selección_de_características.ipynb",
      ],
      exercises: ["minmax-a-mano", "fit-transform", "iqr", "imputar", "leakage"],
      load: () => import("./02-limpieza-de-datos.mdx"),
    }),
    defineLesson({
      slug: "validacion",
      title: "Validar sin engañarte",
      summary:
        "Sobreajuste, hold-out, validación cruzada, ajuste de hiperparámetros y por qué el test es sagrado.",
      minutes: 25,
      sources: [
        "Temas/Tema 2.pdf",
        "Prácticas/Programa7.HoldOut.ipynb",
        "Prácticas/Programa8-9.ValidacionCruzada.ipynb",
        "Scripts/2_Partición_datos_externa.ipynb",
      ],
      exercises: ["cross-val", "time-series", "cuantos-modelos"],
      load: () => import("./03-validacion.mdx"),
    }),
    defineLesson({
      slug: "metricas",
      title: "Métricas: qué número mirar",
      summary:
        "MAE, RMSE y R² en regresión; matriz de confusión, precisión, recall, F1 y ROC en clasificación.",
      minutes: 25,
      sources: [
        "Temas/Tema 2.pdf",
        "Prácticas/Programa10.EvaluacionRegresion.ipynb",
        "Prácticas/Programa11.EvaluacionClasificacion.ipynb",
        "Scripts/6_Evaluación_resultados.ipynb",
      ],
      exercises: ["metricas-regresion", "precision-recall", "matriz-confusion", "metrica-cancer"],
      load: () => import("./04-metricas.mdx"),
    }),
    defineLesson({
      slug: "regresion",
      title: "Regresión lineal y kNN",
      summary: "Mínimos cuadrados, R², Ridge y Lasso, y el algoritmo de los vecinos más cercanos.",
      minutes: 25,
      sources: ["Temas/Tema 4.pdf"],
      exercises: ["lasso", "knn-escalado", "ridge-lasso"],
      load: () => import("./05-regresion.mdx"),
    }),
    defineLesson({
      slug: "clasificacion",
      title: "Clasificadores",
      summary:
        "Regresión logística, árboles, Random Forest, AdaBoost, gradient boosting y SVM: cómo deciden y cuándo usar cada uno.",
      minutes: 30,
      sources: ["Temas/Tema 5.pdf", "Scripts/5_Modelado.ipynb"],
      exercises: ["gini", "adaboost", "comparar-clasificadores", "cuando-que-modelo"],
      load: () => import("./06-clasificacion.mdx"),
    }),
    defineLesson({
      slug: "extraccion-de-caracteristicas",
      title: "Extracción de características",
      summary:
        "De señales e imágenes a columnas: estadísticos, segmentación, bordes y descriptores de textura (LBP, HOG).",
      minutes: 25,
      sources: ["Temas/Tema 3(2).pdf", "Scripts/3_Extracción_de_características.ipynb"],
      exercises: ["estadisticos", "lbp", "lbp-codigo", "hsv"],
      load: () => import("./07-extraccion-de-caracteristicas.mdx"),
    }),
  ],
};
