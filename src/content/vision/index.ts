import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

const TORCH = "https://docs.pytorch.org";
const PRACTICE = "Deep Learning: Prácticas/07MIAR_VC04_VC05_Deep_Vision_Colab.ipynb";
const SCRIPT = "scripts/tutorials/vision.py";

/**
 * Step-by-step image classification with PyTorch on CIFAR-10, the dataset of the course's
 * Deep Vision practice. Framework code is verified by `scripts/tutorials/vision.py` and the
 * runnable exercises practise each piece in NumPy (ADR-0006).
 */
export const vision: Subject = {
  slug: "vision",
  title: "Visión: clasificar imágenes",
  code: "Tutorial",
  tagline:
    "Una red que reconoce imágenes, paso a paso y en PyTorch: datos, MLP, CNN, entrenamiento, regularización, transfer learning, evaluación y servirla.",
  lessons: [
    defineLesson({
      slug: "los-datos",
      title: "El problema y los datos",
      summary:
        "CIFAR-10 por dentro, tensores de imagen, normalizar con las estadísticas de train y un split de validación que no se toca.",
      minutes: 20,
      sources: [PRACTICE, SCRIPT, `${TORCH}/tutorials/beginner/basics/data_tutorial.html`],
      exercises: ["a-tensor", "normalizar", "fuga"],
      load: () => import("./01-los-datos.mdx"),
    }),
    defineLesson({
      slug: "un-mlp-de-referencia",
      title: "Un MLP de referencia",
      summary:
        "nn.Module, el bucle de entrenamiento escrito a mano y un primer modelo que marca el listón a batir.",
      minutes: 25,
      sources: [PRACTICE, SCRIPT, `${TORCH}/tutorials/beginner/basics/optimization_tutorial.html`],
      exercises: ["params-primera-capa", "paso-de-entrenamiento", "zero-grad"],
      load: () => import("./02-un-mlp-de-referencia.mdx"),
    }),
    defineLesson({
      slug: "una-cnn",
      title: "Una CNN",
      summary:
        "Bloques convolucionales con batch norm, seguir la forma del tensor capa a capa y por qué gana con cinco veces menos parámetros.",
      minutes: 25,
      sources: [PRACTICE, SCRIPT],
      exercises: ["entradas-lineal", "params-bloque", "por-que-gana"],
      load: () => import("./03-una-cnn.mdx"),
    }),
    defineLesson({
      slug: "entrenar-bien",
      title: "Entrenar bien",
      summary:
        "Validar cada época, guardar el mejor checkpoint, early stopping, el learning rate que cambia y leer las curvas.",
      minutes: 25,
      sources: [SCRIPT, `${TORCH}/docs/stable/generated/torch.optim.lr_scheduler.OneCycleLR.html`],
      exercises: ["olvidar-eval", "early-stopping", "ultimo-lote"],
      load: () => import("./04-entrenar-bien.mdx"),
    }),
    defineLesson({
      slug: "regularizar-y-aumentar",
      title: "Regularizar y aumentar datos",
      summary:
        "Data augmentation con recortes y volteos, dropout y weight decay, y el error de aumentar también la validación.",
      minutes: 25,
      sources: [PRACTICE, SCRIPT, `${TORCH}/vision/stable/transforms.html`],
      exercises: ["recorte-y-volteo", "que-aumentar", "validacion-aumentada"],
      load: () => import("./05-regularizar-y-aumentar.mdx"),
    }),
    defineLesson({
      slug: "transfer-learning",
      title: "Transfer learning",
      summary:
        "ResNet-18 preentrenada en ImageNet: extraer características, luego fine-tuning con un learning rate pequeño.",
      minutes: 25,
      sources: [PRACTICE, SCRIPT, `${TORCH}/tutorials/beginner/transfer_learning_tutorial.html`],
      exercises: ["entrenables-cabeza", "estadisticas-imagenet", "lr-pequeno"],
      load: () => import("./06-transfer-learning.mdx"),
    }),
    defineLesson({
      slug: "evaluar",
      title: "Evaluar de verdad",
      summary:
        "El test una sola vez, matriz de confusión, precisión y recall por clase, y mirar los errores con confianza alta.",
      minutes: 25,
      sources: [SCRIPT],
      exercises: ["matriz-de-confusion", "precision-gato", "confianza"],
      load: () => import("./07-evaluar.mdx"),
    }),
    defineLesson({
      slug: "guardar-y-servir",
      title: "Guardar y servir el modelo",
      summary:
        "state_dict, el mismo preprocesado en inferencia que en entrenamiento, eval y no_grad, y la API que lo sirve.",
      minutes: 20,
      sources: [SCRIPT, `${TORCH}/tutorials/beginner/saving_loading_models.html`],
      exercises: ["state-dict", "preprocesar", "modo-inferencia"],
      load: () => import("./08-guardar-y-servir.mdx"),
    }),
  ],
};
