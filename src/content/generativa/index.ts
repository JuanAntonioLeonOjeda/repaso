import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

const SCRIPT = "scripts/tutorials/generativa.py";
const DDPM = "https://arxiv.org/abs/2006.11239";

/**
 * Generative models of images with PyTorch, step by step on MNIST (autoencoder, VAE, GAN,
 * diffusion with guidance) and then Stable Diffusion with diffusers. Framework code is verified
 * by `scripts/tutorials/generativa.py`; the runnable exercises practise each piece in NumPy
 * (ADR-0006).
 */
export const generativa: Subject = {
  slug: "generativa",
  title: "IA generativa de imágenes",
  code: "Tutorial",
  tagline:
    "De un autoencoder a Stable Diffusion, paso a paso: VAE, GAN, difusión, guiar con una etiqueta, evaluar lo generado y generar a partir de texto.",
  lessons: [
    defineLesson({
      slug: "que-es-generar",
      title: "Qué es generar",
      summary:
        "Aprender una distribución y muestrear de ella, por qué los píxeles no son independientes y por qué evaluar es lo difícil.",
      minutes: 20,
      sources: [SCRIPT],
      exercises: ["pixeles-independientes", "por-que-ruido", "discriminativo"],
      load: () => import("./01-que-es-generar.mdx"),
    }),
    defineLesson({
      slug: "autoencoder",
      title: "Un autoencoder",
      summary:
        "Comprimir a dos números y reconstruir, el espacio latente dibujado y por qué un autoencoder no sabe generar.",
      minutes: 20,
      sources: [SCRIPT],
      exercises: ["parametros-ae", "pca-como-autoencoder", "huecos"],
      load: () => import("./02-autoencoder.mdx"),
    }),
    defineLesson({
      slug: "vae",
      title: "El autoencoder variacional",
      summary:
        "Codificar distribuciones, el truco de la reparametrización, la KL que ordena el espacio latente y el mapa de dígitos.",
      minutes: 25,
      sources: ["https://arxiv.org/abs/1312.6114", SCRIPT],
      exercises: ["reparametrizacion", "kl", "borrosas"],
      load: () => import("./03-vae.mdx"),
    }),
    defineLesson({
      slug: "gan",
      title: "Una GAN convolucional",
      summary:
        "DCGAN en PyTorch: dos optimizadores, detach, las pérdidas que no dicen nada y cómo se ve un generador aprendiendo.",
      minutes: 25,
      sources: ["https://arxiv.org/abs/1511.06434", SCRIPT],
      exercises: ["params-generador", "detach", "leer-las-perdidas"],
      load: () => import("./04-gan.mdx"),
    }),
    defineLesson({
      slug: "difusion",
      title: "Difusión",
      summary:
        "Destruir una imagen con ruido y aprender a deshacerlo: el salto directo a x_t, predecir el ruido, la U-Net y el muestreo.",
      minutes: 30,
      sources: [DDPM, SCRIPT],
      exercises: ["salto-directo", "alpha-bar", "predecir-ruido"],
      load: () => import("./05-difusion.mdx"),
    }),
    defineLesson({
      slug: "generacion-condicionada",
      title: "Generación condicionada",
      summary:
        "«Dibuja un 7»: condicionar con una etiqueta, classifier-free guidance y el precio de subir la guía.",
      minutes: 25,
      sources: ["https://arxiv.org/abs/2207.12598", SCRIPT],
      exercises: ["etiqueta-vacia", "guidance", "mas-guia"],
      load: () => import("./06-generacion-condicionada.mdx"),
    }),
    defineLesson({
      slug: "evaluar",
      title: "Evaluar lo generado",
      summary:
        "Mirar no basta: FID con las características de un clasificador, si genera lo que se le pide y si copia el entrenamiento.",
      minutes: 25,
      sources: ["https://arxiv.org/abs/1706.08500", SCRIPT],
      exercises: ["frechet", "fid-de-referencia", "memorizar"],
      load: () => import("./07-evaluar.mdx"),
    }),
    defineLesson({
      slug: "de-mnist-a-stable-diffusion",
      title: "De MNIST a Stable Diffusion",
      summary:
        "Difusión en el espacio latente de un autoencoder, texto con CLIP, SD-Turbo en un portátil y cómo usarlo con cabeza.",
      minutes: 25,
      sources: [
        "https://arxiv.org/abs/2112.10752",
        "https://huggingface.co/stabilityai/sd-turbo",
        "https://arxiv.org/abs/2311.17042",
        "https://huggingface.co/docs/diffusers",
        SCRIPT,
      ],
      exercises: ["espacio-latente", "pocos-pasos", "uso-responsable"],
      load: () => import("./08-de-mnist-a-stable-diffusion.mdx"),
    }),
  ],
};
