import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

export const noSupervisado: Subject = {
  slug: "no-supervisado",
  title: "Aprendizaje no supervisado",
  code: "06MIAR",
  tagline:
    "Encontrar estructura sin etiquetas: clustering de todos los sabores, reducción de dimensionalidad, grafos, reglas de asociación y deep clustering.",
  lessons: [
    defineLesson({
      slug: "distancias-y-evaluacion",
      title: "Distancias y cómo evaluar grupos",
      summary:
        "Qué significa «parecido» según el tipo de dato y cómo medir si un clustering es bueno, con o sin etiquetas.",
      minutes: 20,
      sources: ["Temas/Tema 1(1)(1).pdf"],
      exercises: ["coseno", "jaccard", "elegir-k", "metrica-texto"],
      load: () => import("./01-distancias-y-evaluacion.mdx"),
    }),
    defineLesson({
      slug: "k-means",
      title: "K-means",
      summary: "El algoritmo de Lloyd paso a paso, k-means++, cómo elegir k y cuándo falla.",
      minutes: 20,
      sources: [
        "Temas/Tema 2_1(1).pdf",
        "Código/T2_1_Métodos_de_clustering_basados_en_particiones.ipynb",
      ],
      exercises: ["lloyd", "kmeans-falla"],
      load: () => import("./02-k-means.mdx"),
    }),
    defineLesson({
      slug: "jerarquico",
      title: "Clustering jerárquico",
      summary:
        "Aglomerativo y divisivo, criterios de enlace y cómo leer (y cortar) un dendrograma.",
      minutes: 20,
      sources: ["Temas/Tema 2_2.pdf", "Código/T2_2_Métodos_de_clustering_jerárquico.ipynb"],
      exercises: ["single-link", "mall", "uniones"],
      load: () => import("./03-jerarquico.mdx"),
    }),
    defineLesson({
      slug: "densidad",
      title: "Clustering por densidad",
      summary:
        "DBSCAN, HDBSCAN, mean-shift y affinity propagation: grupos de cualquier forma y detección de ruido.",
      minutes: 20,
      sources: [
        "Temas/Tema 2_4.pdf",
        "Código/T2_4_Métodos_de_clustering_basados_en_densidad.ipynb",
      ],
      exercises: ["dbscan-vs-kmeans", "densidad-que-metodo"],
      load: () => import("./04-densidad.mdx"),
    }),
    defineLesson({
      slug: "espectral",
      title: "Clustering espectral",
      summary:
        "Convertir los datos en un grafo y cortarlo con los vectores propios del laplaciano.",
      minutes: 20,
      sources: ["Temas/Tema 2_3.pdf", "Código/T2_3_Métodos_de_clustering_espectral.ipynb"],
      exercises: ["laplaciano", "eigengap"],
      load: () => import("./05-espectral.mdx"),
    }),
    defineLesson({
      slug: "probabilistico-y-semisupervisado",
      title: "Mezclas de gaussianas y semisupervisado",
      summary:
        "GMM y el algoritmo EM, y cómo aprovechar datos sin etiquetar (Naive Bayes + EM, propagación de etiquetas).",
      minutes: 25,
      sources: [
        "Temas/Tema 2_5.pdf",
        "Temas/Tema 3.pdf",
        "Código/T2_5_Métodos_de_clustering_probabilísticos.ipynb",
        "Código/T3_Métodos_de_aprendizaje_semi_supervisado.ipynb",
      ],
      exercises: ["gmm-bic", "label-spreading"],
      load: () => import("./06-probabilistico-y-semisupervisado.mdx"),
    }),
    defineLesson({
      slug: "pca-e-ica",
      title: "PCA e ICA",
      summary:
        "Reducir dimensiones buscando varianza (PCA) o separar fuentes independientes (ICA, el problema del cóctel).",
      minutes: 25,
      sources: [
        "Temas/Tema 4.pdf",
        "Código/T4_1_Métodos_de_análisis_de_componentes.ipynb",
        "Código/T4_2 - Métodos de análisis de componentes-ICA.ipynb",
      ],
      exercises: ["pca-a-mano", "pca-componentes", "pca-escala"],
      load: () => import("./07-pca-e-ica.mdx"),
    }),
    defineLesson({
      slug: "grafos-y-reglas-de-asociacion",
      title: "PageRank y reglas de asociación",
      summary:
        "La importancia de los nodos de un grafo y qué productos se compran juntos (soporte, confianza, lift, Apriori).",
      minutes: 25,
      sources: ["Temas/Tema 5.pdf", "Código/T5_Otros_usos_de_aprendizaje_no_supervisado.ipynb"],
      exercises: ["pagerank", "lift", "soporte-confianza"],
      load: () => import("./08-grafos-y-reglas-de-asociacion.mdx"),
    }),
    defineLesson({
      slug: "deep-clustering",
      title: "Deep clustering",
      summary: "Autoencoders, DEC, VaDE e InfoGAN: agrupar en un espacio aprendido por una red.",
      minutes: 20,
      sources: [
        "Temas/Tema 6.pdf",
        "Código/T6_Deep_clustering_Mi_primer_algoritmo_de_deep_clustering_con_Keras.ipynb",
      ],
      exercises: ["dec-q", "por-que-latente"],
      load: () => import("./09-deep-clustering.mdx"),
    }),
  ],
};
