import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

export const razonamiento: Subject = {
  slug: "razonamiento",
  title: "Razonamiento aproximado",
  code: "MIAR",
  tagline:
    "Razonar con incertidumbre e imprecisión: Bayes, factores de certeza, Dempster-Shafer, conjuntos borrosos y un controlador borroso completo.",
  lessons: [
    defineLesson({
      slug: "incertidumbre-y-bayes",
      title: "Incertidumbre y teorema de Bayes",
      summary:
        "Por qué hace falta razonar con incertidumbre y cómo actualizar creencias con evidencias (sin olvidar la tasa base).",
      minutes: 20,
      sources: ["Temas/Mod_Incertidumbre_OLIVAS_VIU(1).pdf"],
      exercises: ["meningitis", "inversor", "tasa-base"],
      load: () => import("./01-incertidumbre-y-bayes.mdx"),
    }),
    defineLesson({
      slug: "certeza-y-evidencia",
      title: "Factores de certeza y Dempster-Shafer",
      summary:
        "Las reglas con confianza de MYCIN y la teoría de la evidencia: creencia, plausibilidad y combinación.",
      minutes: 25,
      sources: ["Temas/Mod_Incertidumbre_OLIVAS_VIU(1).pdf"],
      exercises: ["cf-mycin", "bel-pl", "ignorancia"],
      load: () => import("./02-certeza-y-evidencia.mdx"),
    }),
    defineLesson({
      slug: "conjuntos-borrosos",
      title: "Conjuntos borrosos",
      summary:
        "Pertenencia gradual, α-cortes, t-normas y t-conormas, y modificadores lingüísticos.",
      minutes: 25,
      sources: ["Temas/Logica_Borrosa_OLIVAS_VIU(1).pdf"],
      exercises: ["alfa-corte", "muy-joven", "t-norma"],
      load: () => import("./03-conjuntos-borrosos.mdx"),
    }),
    defineLesson({
      slug: "relaciones-e-inferencia",
      title: "Relaciones e inferencia borrosa",
      summary:
        "Relaciones borrosas, composición max-min, principio de extensión, implicaciones y modus ponens generalizado.",
      minutes: 25,
      sources: ["Temas/Logica_Borrosa_OLIVAS_VIU(1).pdf"],
      exercises: ["max-min", "extension", "modus-ponens", "eslabon-debil"],
      load: () => import("./04-relaciones-e-inferencia.mdx"),
    }),
    defineLesson({
      slug: "control-borroso",
      title: "Control borroso: Mamdani y Sugeno",
      summary:
        "Un controlador completo de principio a fin: borrosificación, reglas, agregación y desborrosificación.",
      minutes: 25,
      sources: ["Temas/Logica_Borrosa_OLIVAS_VIU(1).pdf"],
      exercises: ["centroide", "sugeno", "mamdani-vs-sugeno"],
      load: () => import("./05-control-borroso.mdx"),
    }),
  ],
};
