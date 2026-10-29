import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

export const refuerzo: Subject = {
  slug: "refuerzo",
  title: "Aprendizaje por refuerzo",
  code: "08MIAR",
  tagline:
    "Aprender actuando: Q-learning, DQN, Policy Gradient, actor-crítico, PPO y modelos del mundo. Con un agente que aprende delante de ti.",
  lessons: [
    defineLesson({
      slug: "que-es-el-refuerzo",
      title: "Qué es el aprendizaje por refuerzo",
      summary:
        "Agente, entorno, recompensa y política; explorar frente a explotar; y el mapa de los algoritmos.",
      minutes: 20,
      sources: [
        "Temas/08MIAR_sesion1.pdf",
        "Temas/08MIAR_sesion2.pdf",
        "Código/sesion_practica_0/08MIAR_intro_gym.ipynb",
      ],
      exercises: ["bucle-gym", "epsilon-greedy", "es-refuerzo"],
      load: () => import("./01-que-es-el-refuerzo.mdx"),
    }),
    defineLesson({
      slug: "q-learning",
      title: "MDP, valor y Q-learning",
      summary:
        "Retorno descontado, funciones de valor, la ecuación de Bellman y Q-learning tabular.",
      minutes: 25,
      sources: ["Temas/08MIAR_sesion3.pdf"],
      exercises: ["retorno", "actualizacion-q", "q-learning"],
      load: () => import("./02-q-learning.mdx"),
    }),
    defineLesson({
      slug: "dqn",
      title: "Deep Q-Networks",
      summary:
        "Q-learning con una red, memoria de repetición, red objetivo y el preprocesado de Atari.",
      minutes: 25,
      sources: ["Temas/08MIAR_sesion3.pdf", "Código/sesion_practica_1/08MIAR_dqn_tf2_18.ipynb"],
      exercises: ["replay-buffer", "td-targets", "salida-lineal"],
      load: () => import("./03-dqn.mdx"),
    }),
    defineLesson({
      slug: "policy-gradient",
      title: "Policy Gradient",
      summary: "Aprender la política directamente: REINFORCE, retornos descontados y línea base.",
      minutes: 25,
      sources: ["Temas/08MIAR_sesion4.pdf", "Código/sesion_practica_2/08MIAR_pg_ac.ipynb"],
      exercises: ["retornos-descontados", "reinforce", "pg-vs-dqn"],
      load: () => import("./04-policy-gradient.mdx"),
    }),
    defineLesson({
      slug: "actor-critic",
      title: "Actor-crítico: A2C y A3C",
      summary:
        "Un actor que decide y un crítico que juzga: ventaja, GAE y entrenamiento en paralelo.",
      minutes: 25,
      sources: [
        "Temas/08MIAR_sesion6.pdf",
        "Código/sesion_practica_2/08MIAR_a3c.ipynb",
        "Código/sesion_practica_2/a3c_full.py",
      ],
      exercises: ["ventaja", "gae", "entropia"],
      load: () => import("./05-actor-critic.mdx"),
    }),
    defineLesson({
      slug: "acciones-continuas-y-modelos",
      title: "DDPG, PPO y modelos del mundo",
      summary:
        "Control continuo con DDPG, el recorte de PPO y los algoritmos que aprenden un modelo y planifican.",
      minutes: 25,
      sources: ["Temas/08MIAR_sesion7.pdf", "Temas/08MIAR_sesion10.pdf"],
      exercises: ["soft-update", "ppo-clip", "model-based"],
      load: () => import("./06-acciones-continuas-y-modelos.mdx"),
    }),
  ],
};
