import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

export const python: Subject = {
  slug: "python",
  title: "Python para IA",
  code: "01MIAR",
  tagline:
    "La caja de herramientas de todo lo demás: Python, NumPy, pandas y matplotlib a base de preguntas de examen, más generadores, texto, dígitos e imágenes.",
  lessons: [
    defineLesson({
      slug: "python-y-sus-tipos",
      title: "Python, tipos y referencias",
      summary:
        "Cómo se ejecuta Python, los tipos y operadores que confunden, y por qué una variable es una etiqueta y no una caja.",
      minutes: 20,
      sources: [
        "01MIAR.pdf (cap. 1 y 2.1–2.4)",
        "01MIAR_01_Python101.ipynb",
        "01MIAR_02_Python101_DataTypes.ipynb",
      ],
      exercises: ["floor-negativo", "alias", "separador", "f-strings"],
      load: () => import("./01-python-y-sus-tipos.mdx"),
    }),
    defineLesson({
      slug: "colecciones",
      title: "Listas, tuplas, diccionarios y sets",
      summary:
        "Qué colección elegir, slicing, copias superficiales y comprehensions, con dos preguntas de examen.",
      minutes: 25,
      sources: [
        "01MIAR.pdf (cap. 2.5)",
        "01MIAR_02_Python101_DataTypes.ipynb",
        "01MIAR_03_Python101_Control.ipynb",
        "examenes/01MIAR_Exam_01_A.ipynb",
        "examenes/01MIAR_Exam_01_B.ipynb",
      ],
      exercises: ["set-ops", "slice-negativo", "en-una-linea", "contar-palabras", "repetido"],
      load: () => import("./02-colecciones.mdx"),
    }),
    defineLesson({
      slug: "control-y-funciones",
      title: "Control de flujo, excepciones y funciones",
      summary:
        "if, match, bucles con else, excepciones concretas, el valor por defecto mutable, lambdas, LEGB y recursividad.",
      minutes: 30,
      sources: [
        "01MIAR.pdf (cap. 2.4)",
        "01MIAR_03_Python101_Control.ipynb",
        "01MIAR_04_Python101_Functions.ipynb",
        "Examen-Python-2024-2025-1aConvocatoria.pdf",
      ],
      exercises: [
        "for-else",
        "perfecto",
        "a-float",
        "defecto-mutable",
        "ordenar-key",
        "legb",
        "aplanar",
      ],
      load: () => import("./03-control-y-funciones.mdx"),
    }),
    defineLesson({
      slug: "objetos",
      title: "Programación orientada a objetos",
      summary:
        "Clases, self, atributos de clase e instancia, métodos especiales, herencia, clases abstractas y dataclasses.",
      minutes: 25,
      sources: ["01MIAR_06_Python101_OOP.ipynb"],
      exercises: ["atributo-clase", "vector", "figuras"],
      load: () => import("./04-objetos.mdx"),
    }),
    defineLesson({
      slug: "estructuras-de-datos",
      title: "Estructuras de datos",
      summary:
        "Pilas, colas, colas de prioridad, tablas hash y grafos: cuál elegir y por qué una línea puede costar horas.",
      minutes: 25,
      sources: ["01MIAR_07_Python101_Advanced.ipynb"],
      exercises: ["balanceados", "top-k", "sin-duplicados", "bfs"],
      load: () => import("./05-estructuras-de-datos.mdx"),
    }),
    defineLesson({
      slug: "ficheros-modulos-y-tests",
      title: "Ficheros, módulos, entornos y tests",
      summary:
        "Leer y escribir CSV y JSON, módulos y entornos virtuales, código legible y tests que cazan bugs.",
      minutes: 25,
      sources: [
        "01MIAR.pdf (cap. 6.1)",
        "01MIAR_05_Python101_Files.ipynb",
        "01MIAR_07_Python101_Advanced.ipynb",
        "notes/001-Pip a 005-Namespaces",
      ],
      exercises: ["csv-ventas", "name-main", "tests-mediana"],
      load: () => import("./06-ficheros-modulos-y-tests.mdx"),
    }),
    defineLesson({
      slug: "numpy",
      title: "NumPy",
      summary:
        "El ndarray, vistas y máscaras, broadcasting, ejes, álgebra lineal y la matriz 6×6 del examen.",
      minutes: 30,
      sources: [
        "01MIAR.pdf (cap. 3)",
        "01MIAR_08_NumPy.ipynb",
        "numpy-100",
        "examenes/2024_25_1.ipynb",
      ],
      exercises: [
        "vista",
        "estandarizar",
        "nan-entero",
        "matriz-examen",
        "duplicados-numpy",
        "sistemas",
      ],
      load: () => import("./07-numpy.mdx"),
    }),
    defineLesson({
      slug: "pandas-series-y-dataframes",
      title: "pandas: Series y DataFrames",
      summary:
        "Series, loc frente a iloc, filtrar, pandas 3 y valores perdidos, con el Titanic y los sensores del examen.",
      minutes: 30,
      sources: [
        "01MIAR.pdf (cap. 4)",
        "01MIAR_09_Pandas.ipynb",
        "01MIAR_10_+Pandas.ipynb",
        "100-pandas-puzzles-with-solutions.ipynb",
      ],
      exercises: ["loc-incluye", "titanic-primeros-pasos", "nan-por-fila", "sensores"],
      load: () => import("./08-pandas-series-y-dataframes.mdx"),
    }),
    defineLesson({
      slug: "pandas-analisis",
      title: "pandas: agrupar, juntar y transformar",
      summary:
        "groupby, transform, merge sin multiplicar filas, pivot_table, regex y fechas, con los vuelos y los aeropuertos del examen.",
      minutes: 35,
      sources: [
        "01MIAR.pdf (cap. 4.4–4.5 y 6.2–6.3)",
        "01MIAR_10_+Pandas.ipynb",
        "01MIAR_12_Data_Processing.ipynb",
        "examenes/01MIAR_Exam_01_A.ipynb",
      ],
      exercises: [
        "edad-por-grupo",
        "vuelos",
        "aeropuertos",
        "pivot-titanic",
        "extraer-anio",
        "generos",
      ],
      load: () => import("./09-pandas-analisis.mdx"),
    }),
    defineLesson({
      slug: "visualizacion",
      title: "Visualización con matplotlib",
      summary:
        "Figure y Axes, qué gráfico para qué pregunta, el histograma del examen y varias gráficas en una figura.",
      minutes: 25,
      sources: ["01MIAR.pdf (cap. 5)", "01MIAR_11_Visualization.ipynb"],
      exercises: ["histograma-examen", "dos-graficos", "barras-ordenadas"],
      load: () => import("./10-visualizacion.mdx"),
    }),
    defineLesson({
      slug: "limpieza-de-datos",
      title: "Limpieza de datos: el café del examen",
      summary:
        "La pregunta de 5 puntos resuelta paso a paso con los 10.000 tickets reales: marcar, reconstruir, cuadrar y fechas.",
      minutes: 30,
      sources: ["01MIAR.pdf (cap. 6.3)", "examenes/01MIAR_Exam_01_B.ipynb", "dirty_cafe_sales.csv"],
      exercises: [
        "cafe-marcar",
        "cafe-precios",
        "cafe-cuadrar",
        "cafe-item-por-precio",
        "cafe-fechas",
      ],
      load: () => import("./11-limpieza-de-datos.mdx"),
    }),
    defineLesson({
      slug: "generadores",
      title: "Generadores",
      summary:
        "yield, evaluación perezosa, pipelines y generadores de lotes para entrenar, con cuatro preguntas de examen.",
      minutes: 30,
      sources: ["01MIAR.pdf (cap. 7)", "01MIAR_13_Generators.ipynb"],
      exercises: ["factores", "frange", "primos", "sort-by", "lotes"],
      load: () => import("./12-generadores.mdx"),
    }),
    defineLesson({
      slug: "texto",
      title: "Análisis de texto",
      summary:
        "Tokenizar, stopwords, frecuencias y bigramas, stemming, HTML con Beautiful Soup y un clasificador de sentimiento.",
      minutes: 25,
      sources: ["01MIAR.pdf (cap. 8)", "01MIAR_14_Natural_Language.ipynb"],
      exercises: ["frecuencias", "stem-o-lema", "html", "sentimiento"],
      load: () => import("./13-texto.mdx"),
    }),
    defineLesson({
      slug: "digitos-con-scikit-learn",
      title: "Dígitos escritos a mano con scikit-learn",
      summary:
        "El flujo completo de un modelo: aplanar, separar, entrenar, predecir y leer la matriz de confusión.",
      minutes: 20,
      sources: ["01MIAR.pdf (cap. 9)", "01MIAR_15_OCR.ipynb"],
      exercises: ["aplanar-digitos", "svc-digitos", "confusion-digitos", "gamma-alto"],
      load: () => import("./14-digitos-con-scikit-learn.mdx"),
    }),
    defineLesson({
      slug: "imagenes-con-opencv",
      title: "Imágenes con OpenCV",
      summary:
        "Una imagen es un array: BGR, el desbordamiento de uint8, mezclas, bordes con Sobel y detección de caras.",
      minutes: 25,
      sources: ["01MIAR.pdf (cap. 10)", "01MIAR_16_Image_Analysis.ipynb"],
      exercises: ["bgr-rgb", "uint8-vuelta", "aclarar", "blending", "sobel"],
      load: () => import("./15-imagenes-con-opencv.mdx"),
    }),
    defineLesson({
      slug: "simulacro-de-examen",
      title: "Simulacro de examen",
      summary:
        "Cómo afrontar el notebook del examen y cinco preguntas nuevas, con una pregunta larga sobre el Titanic.",
      minutes: 35,
      sources: [
        "examenes/",
        "Exam Demo.ipynb",
        "exam2.ipynb",
        "Examen-Python-2024-2025-2aConvocatoria",
      ],
      exercises: [
        "df-sin-duplicados",
        "menos-frecuente",
        "pila-dos-colas",
        "titanic-largo",
        "lectura-titanic",
      ],
      load: () => import("./16-simulacro-de-examen.mdx"),
    }),
  ],
};
