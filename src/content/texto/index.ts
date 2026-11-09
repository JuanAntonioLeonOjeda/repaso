import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

const HF = "https://huggingface.co/docs/transformers";
const SKL = "https://scikit-learn.org/stable/modules";
const TORCH = "https://docs.pytorch.org/docs/stable";
const MARC = "https://huggingface.co/datasets/mteb/amazon_reviews_multi";
const SCRIPT = "scripts/tutorials/texto.py";

/**
 * Step-by-step text classification with PyTorch: predict the stars of Spanish Amazon reviews,
 * from a TF-IDF baseline to fine-tuning BETO. Framework code is verified by
 * `scripts/tutorials/texto.py` and the runnable exercises practise each piece in NumPy and
 * scikit-learn (ADR-0006).
 */
export const texto: Subject = {
  slug: "texto",
  title: "Texto: clasificar reseñas",
  code: "Tutorial",
  tagline:
    "Adivinar las estrellas de una reseña en español, paso a paso: TF-IDF, tokenizar, embeddings, una LSTM, ajustar BETO, evaluar y servirlo.",
  lessons: [
    defineLesson({
      slug: "los-datos",
      title: "El problema y los datos",
      summary:
        "200.000 reseñas de Amazon en español, una etiqueta ordinal, cuánto acierta no saber nada y el fichero que viene ordenado.",
      minutes: 20,
      sources: [MARC, SCRIPT],
      exercises: ["mae-constante", "ordinal", "ordenado"],
      load: () => import("./01-los-datos.mdx"),
    }),
    defineLesson({
      slug: "un-baseline-con-tf-idf",
      title: "Un baseline con TF-IDF",
      summary:
        "Bolsa de palabras ponderada, bigramas para el «no me gusta», regresión logística y las palabras que más pesan.",
      minutes: 25,
      sources: [`${SKL}/feature_extraction.html#tfidf-term-weighting`, SCRIPT],
      exercises: ["idf", "bigramas", "elegir-c"],
      load: () => import("./02-un-baseline-con-tf-idf.mdx"),
    }),
    defineLesson({
      slug: "tokenizar",
      title: "Tokenizar",
      summary:
        "De texto a números para una red: vocabulario, palabras desconocidas, relleno, máscara y por qué se usan subpalabras.",
      minutes: 25,
      sources: [`${HF}/tokenizer_summary`, SCRIPT],
      exercises: ["codificar", "subpalabras", "truncar"],
      load: () => import("./03-tokenizar.mdx"),
    }),
    defineLesson({
      slug: "embeddings",
      title: "Embeddings: una bolsa que aprende",
      summary:
        "nn.Embedding, la media que ignora el relleno y un modelo de una capa que ya compite con TF-IDF.",
      minutes: 20,
      sources: [`${TORCH}/generated/torch.nn.Embedding.html`, SCRIPT],
      exercises: ["media-con-mascara", "padding-idx", "sin-orden"],
      load: () => import("./04-embeddings.mdx"),
    }),
    defineLesson({
      slug: "una-red-recurrente",
      title: "Una red recurrente",
      summary:
        "Una LSTM bidireccional que lee en orden, empaquetar secuencias de distinta longitud y lo que gana (y cuesta).",
      minutes: 25,
      sources: [`${TORCH}/generated/torch.nn.LSTM.html`, SCRIPT],
      exercises: ["params-lstm", "empaquetar", "bidireccional"],
      load: () => import("./05-una-red-recurrente.mdx"),
    }),
    defineLesson({
      slug: "ajustar-beto",
      title: "Ajustar un transformer: BETO",
      summary:
        "Un BERT preentrenado en español, su tokenizador, una cabeza de clasificación y el fine-tuning con warmup.",
      minutes: 30,
      sources: [
        "https://huggingface.co/dccuchile/bert-base-spanish-wwm-cased",
        `${HF}/training`,
        SCRIPT,
      ],
      exercises: ["cls", "warmup", "lr-pequeno"],
      load: () => import("./06-ajustar-beto.mdx"),
    }),
    defineLesson({
      slug: "evaluar",
      title: "Evaluar una etiqueta ordinal",
      summary:
        "Accuracy, MAE y acierto a una estrella, la matriz de confusión de las estrellas y los errores que sí importan.",
      minutes: 25,
      sources: [SCRIPT],
      exercises: ["mae-y-cercania", "estrellas-vecinas", "errores-lejanos"],
      load: () => import("./07-evaluar.mdx"),
    }),
    defineLesson({
      slug: "servir-el-modelo",
      title: "Guardar y servir el modelo",
      summary:
        "save_pretrained y pipeline, lotes ordenados por longitud, truncar en producción y cuándo un LLM es mejor opción.",
      minutes: 20,
      sources: [`${HF}/main_classes/pipelines`, SCRIPT],
      exercises: ["relleno-por-lotes", "max-length", "llm-o-modelo"],
      load: () => import("./08-servir-el-modelo.mdx"),
    }),
  ],
};
