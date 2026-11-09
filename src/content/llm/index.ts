import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

const SCRIPT = "scripts/tutorials/llm.py";
const QUIJOTE = "https://www.gutenberg.org/ebooks/2000";

/**
 * Build a small GPT from scratch with PyTorch: a BPE tokenizer and a transformer trained on Don
 * Quijote, sampling, LoRA by hand and a base vs instruct comparison with a real small LLM.
 * Framework code is verified by `scripts/tutorials/llm.py`; the runnable exercises practise
 * each piece in NumPy (ADR-0006).
 */
export const llm: Subject = {
  slug: "llm",
  title: "Crea tu LLM",
  code: "Tutorial",
  tagline:
    "Un GPT desde cero que escribe como Cervantes: tokenizar con BPE, bigramas, atención, el bloque transformer, preentrenar, generar y ajustarlo con LoRA.",
  lessons: [
    defineLesson({
      slug: "que-es-un-llm",
      title: "Qué es un LLM",
      summary:
        "Predecir el siguiente token, generar de uno en uno y el corpus de este tutorial: el Quijote entero.",
      minutes: 20,
      sources: [QUIJOTE, SCRIPT],
      exercises: ["predicciones-por-ventana", "autorregresivo", "dividir-el-libro"],
      load: () => import("./01-que-es-un-llm.mdx"),
    }),
    defineLesson({
      slug: "tokenizar-con-bpe",
      title: "Tokenizar con BPE",
      summary:
        "Byte Pair Encoding a mano: empezar por letras, fusionar las parejas más frecuentes y entrenar un vocabulario de 2.048 piezas.",
      minutes: 25,
      sources: ["https://huggingface.co/learn/llm-course/chapter6/5", SCRIPT],
      exercises: ["bpe-a-mano", "tamano-del-vocabulario", "palabras-raras"],
      load: () => import("./02-tokenizar-con-bpe.mdx"),
    }),
    defineLesson({
      slug: "un-modelo-de-bigramas",
      title: "Un modelo de bigramas",
      summary:
        "El LLM más sencillo: contar qué token sigue a cada uno. Entropía cruzada, perplejidad y el listón que hay que batir.",
      minutes: 20,
      sources: [SCRIPT],
      exercises: ["perdida-uniforme", "bigramas", "perplejidad"],
      load: () => import("./03-un-modelo-de-bigramas.mdx"),
    }),
    defineLesson({
      slug: "atencion",
      title: "Atención causal",
      summary:
        "Consultas, claves y valores, por qué se divide entre √d, la máscara que impide mirar al futuro y las cabezas múltiples.",
      minutes: 30,
      sources: ["https://arxiv.org/abs/1706.03762", SCRIPT],
      exercises: ["atencion-causal", "escalar", "por-que-mascara"],
      load: () => import("./04-atencion.mdx"),
    }),
    defineLesson({
      slug: "el-bloque-transformer",
      title: "El bloque transformer",
      summary:
        "Atención, MLP, conexiones residuales y LayerNorm; posiciones aprendidas, pesos compartidos y contar los 11,5 millones de parámetros.",
      minutes: 25,
      sources: [
        "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
        SCRIPT,
      ],
      exercises: ["params-bloque", "residual", "pesos-compartidos"],
      load: () => import("./05-el-bloque-transformer.mdx"),
    }),
    defineLesson({
      slug: "preentrenar",
      title: "Preentrenar",
      summary:
        "Ventanas aleatorias del libro, AdamW con warmup y coseno, la curva de validación que se da la vuelta y lo que cambia con el tamaño.",
      minutes: 25,
      sources: [SCRIPT],
      exercises: ["ventanas", "sobreajuste", "escala"],
      load: () => import("./06-preentrenar.mdx"),
    }),
    defineLesson({
      slug: "generar-texto",
      title: "Generar texto",
      summary:
        "Greedy, temperatura, top-k y top-p sobre la distribución real del modelo, y por qué el más probable no es el mejor.",
      minutes: 25,
      sources: ["https://arxiv.org/abs/1904.09751", SCRIPT],
      exercises: ["temperatura", "top-p", "greedy"],
      load: () => import("./07-generar-texto.mdx"),
    }),
    defineLesson({
      slug: "ajustar-un-llm",
      title: "Ajustar un LLM",
      summary:
        "LoRA escrito a mano para que el Quijote aprenda a hablar como el Lazarillo, e instrucciones, chat y RLHF con un modelo real.",
      minutes: 30,
      sources: [
        "https://arxiv.org/abs/2106.09685",
        "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct",
        "https://www.gutenberg.org/ebooks/320",
        SCRIPT,
      ],
      exercises: ["lora-a-mano", "params-lora", "base-o-instruido", "alucinar"],
      load: () => import("./08-ajustar-un-llm.mdx"),
    }),
  ],
};
