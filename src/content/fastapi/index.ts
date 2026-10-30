import { defineLesson } from "@/content/define-lesson";
import type { Subject } from "@/content/types";

const DOCS = "https://fastapi.tiangolo.com";

/**
 * A FastAPI tutorial beyond the master's syllabus: one project, an API that serves a wine
 * quality model, built lesson by lesson. Exercises run FastAPI in Pyodide (ADR-0005).
 */
export const fastapi: Subject = {
  slug: "fastapi",
  title: "FastAPI",
  code: "Tutorial",
  tagline:
    "De cero a una API en producción: rutas, Pydantic, errores, dependencias, base de datos, autenticación, tests, async y servir un modelo de ML.",
  lessons: [
    defineLesson({
      slug: "tu-primera-api",
      title: "Tu primera API",
      summary: "HTTP sin rodeos, el primer endpoint, /docs y cómo llamar a la API sin red.",
      minutes: 15,
      sources: [`${DOCS}/tutorial/first-steps/`, `${DOCS}/advanced/async-tests/`],
      exercises: ["metodos", "health", "errata", "openapi"],
      load: () => import("./01-tu-primera-api.mdx"),
    }),
    defineLesson({
      slug: "parametros",
      title: "Parámetros: ruta, query y cabeceras",
      summary:
        "Leer la entrada de la URL y las cabeceras con tipos y restricciones, y el orden de rutas que provoca un 422.",
      minutes: 20,
      sources: [
        `${DOCS}/tutorial/path-params/`,
        `${DOCS}/tutorial/query-params-str-validations/`,
        `${DOCS}/tutorial/header-params/`,
      ],
      exercises: ["tipo-ruta", "listar-modelos", "orden-rutas", "cabeceras"],
      load: () => import("./02-parametros.mdx"),
    }),
    defineLesson({
      slug: "pydantic",
      title: "Modelos con Pydantic",
      summary:
        "Validar el cuerpo de la petición, leer un 422, separar los modelos de entrada y salida, y PATCH sin pisar datos.",
      minutes: 25,
      sources: [
        `${DOCS}/tutorial/body/`,
        `${DOCS}/tutorial/response-model/`,
        `${DOCS}/tutorial/body-updates/`,
      ],
      exercises: ["muestra-vino", "coercion", "response-model", "patch"],
      load: () => import("./03-pydantic.mdx"),
    }),
    defineLesson({
      slug: "errores",
      title: "Errores y códigos de estado",
      summary:
        "El código correcto para cada caso, HTTPException, el orden en que se comprueba una petición y un formato de error propio.",
      minutes: 25,
      sources: [`${DOCS}/tutorial/handling-errors/`, "https://www.rfc-editor.org/rfc/rfc9457"],
      exercises: ["codigos", "not-found", "orden-401", "handler", "bug-500"],
      load: () => import("./04-errores.mdx"),
    }),
    defineLesson({
      slug: "dependencias",
      title: "Dependencias",
      summary:
        "Depends para compartir paginación, proteger endpoints y abrir y cerrar recursos, y cómo sustituirlas en los tests.",
      minutes: 25,
      sources: [`${DOCS}/tutorial/dependencies/`, `${DOCS}/advanced/testing-dependencies/`],
      exercises: ["paginacion", "api-key", "una-vez", "override"],
      load: () => import("./05-dependencias.mdx"),
    }),
    defineLesson({
      slug: "base-de-datos",
      title: "Base de datos con SQLAlchemy",
      summary:
        "Tablas como clases, una sesión por petición, crear, leer y consultar con select, y de IntegrityError a 409.",
      minutes: 30,
      sources: [
        `${DOCS}/tutorial/sql-databases/`,
        "https://docs.sqlalchemy.org/en/20/orm/quickstart.html",
      ],
      exercises: ["sesion-por-peticion", "crear-y-leer", "listar", "unico"],
      load: () => import("./06-base-de-datos.mdx"),
    }),
    defineLesson({
      slug: "organizar-el-proyecto",
      title: "Organizar el proyecto",
      summary:
        "Una estructura que escala, routers con prefijo y dependencias, configuración desde el entorno y lifespan para cargar el modelo una vez.",
      minutes: 25,
      sources: [
        `${DOCS}/tutorial/bigger-applications/`,
        `${DOCS}/advanced/settings/`,
        `${DOCS}/advanced/events/`,
      ],
      exercises: ["routers", "settings", "lifespan"],
      load: () => import("./07-organizar-el-proyecto.mdx"),
    }),
    defineLesson({
      slug: "autenticacion",
      title: "Autenticación",
      summary:
        "Contraseñas con bcrypt, un JWT hecho a mano para entenderlo, el usuario actual como dependencia y permisos con 403.",
      minutes: 35,
      sources: [
        `${DOCS}/tutorial/security/`,
        "https://www.rfc-editor.org/rfc/rfc7519",
        "https://jwt.io/",
      ],
      exercises: ["hash", "jwt", "usuario-actual"],
      load: () => import("./08-autenticacion.mdx"),
    }),
    defineLesson({
      slug: "tests",
      title: "Tests",
      summary:
        "pytest y TestClient en tu máquina, tests que de verdad detectan bugs y una base de datos limpia por test.",
      minutes: 30,
      sources: [`${DOCS}/tutorial/testing/`, `${DOCS}/advanced/testing-dependencies/`],
      exercises: ["primer-test", "bd-de-test", "tests-que-fallan"],
      load: () => import("./09-tests.mdx"),
    }),
    defineLesson({
      slug: "async-de-verdad",
      title: "async de verdad",
      summary:
        "Qué hace el event loop mientras espera, cuándo def y cuándo async def, gather, run_in_threadpool y tareas en segundo plano.",
      minutes: 30,
      sources: [`${DOCS}/async/`, `${DOCS}/tutorial/background-tasks/`],
      exercises: ["bloqueo", "elegir-def", "gather", "threadpool", "background"],
      load: () => import("./10-async-de-verdad.mdx"),
    }),
    defineLesson({
      slug: "servir-un-modelo",
      title: "Servir un modelo de ML",
      summary:
        "El modelo de calidad de vinos detrás de la API: cargarlo una vez, validar con los rangos de entrenamiento, predecir en lote y versionar.",
      minutes: 30,
      sources: [
        "Supervisado: winequality-red.csv",
        "../tfm/api/main.py",
        `${DOCS}/advanced/events/`,
      ],
      exercises: ["predict", "lote", "monitorizar"],
      load: () => import("./11-servir-un-modelo.mdx"),
    }),
    defineLesson({
      slug: "a-produccion",
      title: "A producción",
      summary:
        "Workers y Docker, CORS (y lo que no protege), un id por petición en los logs y versiones de la API sin romper clientes.",
      minutes: 30,
      sources: [`${DOCS}/deployment/`, `${DOCS}/tutorial/cors/`, `${DOCS}/tutorial/middleware/`],
      exercises: ["workers", "cors", "cors-no-protege", "request-id", "versiones"],
      load: () => import("./12-a-produccion.mdx"),
    }),
  ],
};
