import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

export const optimizacion: Subject = {
  slug: "optimizacion",
  title: "Algoritmos de optimización",
  code: "03MIAR",
  tagline:
    "Complejidad, ordenación, técnicas de diseño, problemas tipo, descenso del gradiente y metaheurísticas (recocido, tabú, genéticos) aplicadas al viajante.",
  lessons: [
    defineLesson({
      slug: "algoritmos-y-complejidad",
      title: "Algoritmos y complejidad",
      summary:
        "Qué es un buen algoritmo y por qué la diferencia entre O(n log n) y O(2ⁿ) lo es todo.",
      minutes: 20,
      sources: [
        "Clases/VIU-03MIAR-Sesion 02- VC1 - Introducción a los Algoritmos.pdf",
        "Clases/VIU-03MIAR-Sesion 07- VC4 - Descenso del gradiente y Trabajo Práctico.pdf",
      ],
      exercises: ["complejidad-bucles", "fibonacci", "np-hard"],
      load: () => import("./01-algoritmos-y-complejidad.mdx"),
    }),
    defineLesson({
      slug: "ordenacion",
      title: "Algoritmos de ordenación",
      summary:
        "Burbuja, selección, inserción, mergesort y quicksort, en directo; estabilidad y qué usar en la práctica.",
      minutes: 20,
      sources: ["Clases/VIU-03MIAR-Sesion 02- VC2 - Algoritmos de ordenacion.pdf"],
      exercises: ["burbuja-peor", "mergesort", "que-ordenacion"],
      load: () => import("./02-ordenacion.mdx"),
    }),
    defineLesson({
      slug: "tecnicas-de-diseno",
      title: "Técnicas de diseño de algoritmos",
      summary:
        "Divide y vencerás, voraces, vuelta atrás y programación dinámica, con los ejemplos de las actividades guiadas.",
      minutes: 30,
      sources: [
        "Clases/VIU-03MIAR-Sesion 03- VC3 - Diseño de Algoritmos.pdf",
        "Clases/Actividad Guiada/VIU-03MIAR-Sesion 06- AG1(Divide y Vencerás, Vuelta atrás, Programación Dinámica).pdf",
      ],
      exercises: ["hanoi", "cambio-voraz", "viaje-rio", "que-tecnica"],
      load: () => import("./03-tecnicas-de-diseno.mdx"),
    }),
    defineLesson({
      slug: "problemas-tipo-y-busqueda",
      title: "Problemas tipo y búsqueda",
      summary:
        "Programación lineal y entera, viajante, mochila, búsqueda en grafos y ramificación y poda.",
      minutes: 30,
      sources: [
        "Clases/VIU-03MIAR-Sesion 05- VC3 - Algoritmos de búsqueda y problemas tipo.pdf",
        "Clases/Actividad Guiada/VIU-03MIAR-Sesion 08- AG3(Programación dinámica,Ramificación y Poda,Descenso del gradiente).pdf",
      ],
      exercises: ["linprog", "mochila", "bfs", "poda"],
      load: () => import("./04-problemas-tipo-y-busqueda.mdx"),
    }),
    defineLesson({
      slug: "descenso-del-gradiente",
      title: "Descenso del gradiente",
      summary:
        "Optimizar funciones continuas bajando por la pendiente: tamaño de paso, mínimos locales y variantes.",
      minutes: 20,
      sources: ["Clases/VIU-03MIAR-Sesion 07- VC4 - Descenso del gradiente y Trabajo Práctico.pdf"],
      exercises: ["paso-gd", "gd-2d", "convexa"],
      load: () => import("./05-descenso-del-gradiente.mdx"),
    }),
    defineLesson({
      slug: "metaheuristicas",
      title: "Metaheurísticas",
      summary:
        "Búsqueda aleatoria y local, búsqueda tabú, recocido simulado, GRASP y colonias de hormigas.",
      minutes: 30,
      sources: [
        "Clases/VIU-03MIAR-Sesion 09- VC5 - Algoritmos Heurísticos.pdf",
        "Clases/VIU-03MIAR-Sesion 10- VC6 - Algoritmos Heurísticos II.pdf",
        "Clases/Actividad Guiada/VIU-03MIAR-Sesion 11- AG3.pdf",
      ],
      exercises: ["busqueda-aleatoria", "dos-opt", "metropolis", "temperatura"],
      load: () => import("./06-metaheuristicas.mdx"),
    }),
    defineLesson({
      slug: "algoritmos-geneticos",
      title: "Algoritmos genéticos",
      summary:
        "Población, selección, cruce, mutación y elitismo; aplicados a OneMax y al viajante.",
      minutes: 25,
      sources: [
        "Clases/VIU-03MIAR-Sesion 12- VC6 - Algoritmos Genéticos.pdf",
        "Clases/Actividad Guiada/VIU-03MIAR-Sesion 13- AG4 (2ªparte).pdf",
      ],
      exercises: ["onemax", "order-crossover", "convergencia-prematura"],
      load: () => import("./07-algoritmos-geneticos.mdx"),
    }),
  ],
};
