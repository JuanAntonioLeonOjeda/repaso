import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

export const deepLearning: Subject = {
  slug: "deep-learning",
  title: "Redes neuronales y Deep Learning",
  code: "07MIAR",
  tagline:
    "De la neurona a los transformers: entrenar redes, CNN, transfer learning, visión avanzada, texto y GANs. Con una red que puedes entrenar y desmontar.",
  lessons: [
    defineLesson({
      slug: "perceptron-y-mlp",
      title: "Del perceptrón al MLP",
      summary:
        "Qué hace una neurona, por qué XOR necesita una capa oculta y cómo contar parámetros.",
      minutes: 20,
      sources: ["Temas/07MIAR_clase01b_Intro Redes Neuronales.ipynb"],
      exercises: ["xor-numpy", "parametros-densa", "parametros-salida", "sin-activacion"],
      load: () => import("./01-perceptron-y-mlp.mdx"),
    }),
    defineLesson({
      slug: "entrenar-una-red",
      title: "Cómo aprende una red",
      summary:
        "Bucle de entrenamiento, activaciones, funciones de pérdida y backpropagation. Con una red que puedes entrenar y desmontar.",
      minutes: 30,
      sources: [
        "Temas/Sesiones 23/ForwardBackprop.pdf",
        "Prácticas/07MAIR_VC02_VC03_Introducción_a_Deep_Learning_Practica_Colab_Clase.ipynb",
      ],
      exercises: ["cross-entropy", "softmax-ce", "backprop-neurona"],
      load: () => import("./02-entrenar-una-red.mdx"),
    }),
    defineLesson({
      slug: "optimizadores-y-regularizacion",
      title: "Optimizadores y regularización",
      summary:
        "SGD, momentum, RMSProp y Adam; curvas de aprendizaje; dropout, early stopping y compañía.",
      minutes: 25,
      sources: ["Temas/Sesiones 23/optimizers(1).pdf"],
      exercises: ["adam", "curvas", "dropout-activas"],
      load: () => import("./03-optimizadores-y-regularizacion.mdx"),
    }),
    defineLesson({
      slug: "tu-primera-red-en-keras",
      title: "Tu primera red, de principio a fin",
      summary:
        "El flujo completo de la práctica de MNIST explicado línea a línea, y reproducido aquí con scikit-learn.",
      minutes: 25,
      sources: [
        "Prácticas/07MAIR_VC02_VC03_Introducción_a_Deep_Learning_Practica_Colab_Clase.ipynb",
      ],
      exercises: ["pasos-por-epoca", "mlp-digitos", "loss-sparse"],
      load: () => import("./04-tu-primera-red-en-keras.mdx"),
    }),
    defineLesson({
      slug: "redes-convolucionales",
      title: "Redes convolucionales",
      summary: "Convoluciones, padding, stride, pooling y la arquitectura típica de una CNN.",
      minutes: 30,
      sources: [
        "Temas/Sesiones 4567/Convolutions.pdf",
        "Temas/Sesiones 4567/CNNs Backprop 1-2.pdf",
        "Prácticas/07MIAR_VC04_VC05_Deep_Vision_Colab.ipynb",
      ],
      exercises: ["tamano-salida", "params-conv", "conv2d"],
      load: () => import("./05-redes-convolucionales.mdx"),
    }),
    defineLesson({
      slug: "augmentation-y-transfer-learning",
      title: "Data augmentation y transfer learning",
      summary:
        "Multiplicar datos con variaciones creíbles y reutilizar redes preentrenadas (extracción de características y fine-tuning).",
      minutes: 25,
      sources: [
        "Temas/Sesiones 4567/Keras Image DataGen.pdf",
        "Temas/Sesiones 4567/Flow From Dataframe Keras.pdf",
        "Prácticas/07MIAR_VC04_VC05_Deep_Vision_Colab.ipynb",
      ],
      exercises: ["augment", "estrategia-transfer", "congelada"],
      load: () => import("./06-augmentation-y-transfer-learning.mdx"),
    }),
    defineLesson({
      slug: "vision-avanzada",
      title: "Detección, segmentación y tracking",
      summary: "IoU, NMS, de R-CNN a YOLO, U-Net y Mask R-CNN.",
      minutes: 25,
      sources: ["Temas/Sesiones 910 07MIAR_Tareas_adicionales_CV_DL_FMM.pdf"],
      exercises: ["iou", "tarea-vision"],
      load: () => import("./07-vision-avanzada.mdx"),
    }),
    defineLesson({
      slug: "texto-y-secuencias",
      title: "Texto y secuencias",
      summary: "Embeddings y Word2Vec, RNN y LSTM, y la atención de los transformers.",
      minutes: 30,
      sources: ["Temas/Sesiones 1011DeepLearning_Texto_Secuencias.pdf"],
      exercises: ["analogias", "params-embedding", "atencion", "por-que-transformer"],
      load: () => import("./08-texto-y-secuencias.mdx"),
    }),
    defineLesson({
      slug: "gans",
      title: "Redes generativas adversarias",
      summary:
        "Generador contra discriminador, cómo se entrenan, mode collapse, cGAN, CycleGAN y StyleGAN.",
      minutes: 25,
      sources: ["Temas/Sesion12_Generative_Adversarial_Networks_FMM.pdf"],
      exercises: ["perdidas-gan", "cyclegan", "d-optimo"],
      load: () => import("./09-gans.mdx"),
    }),
  ],
};
