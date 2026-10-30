import { useState, type ReactNode } from "react";

import {
  ButtonRow,
  Choice,
  ControlNote,
  SimButton,
  SimFrame,
  Stat,
} from "@/features/simulations/kit";

import { handle, STAGES, type ApiRequest, type Stage, type StepResult } from "./lifecycle";

// A vertical pipeline: it shares the frame with the controls, so it is narrow and tall, and
// each stage's note fits inside its box.
const W = 360;
const BOX_H = 44;
const STEP = BOX_H + 12;
const TOP = 30;
const H = TOP + STAGES.length * STEP + 4;

const STAGE_LABEL: Record<Stage, string> = {
  middleware: "Middleware",
  routing: "Rutas",
  dependencies: "Dependencias",
  validation: "Validación",
  endpoint: "Endpoint",
  response: "response_model",
};

const MARK: Record<StepResult, string> = { pass: "✓", fail: "✗", skip: "–" };
// Screen readers announce the glyphs inconsistently, so the label uses words.
const SAID: Record<StepResult, string> = { pass: "pasa", fail: "falla", skip: "no se ejecuta" };

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  401: "Unauthorized",
  404: "Not Found",
  405: "Method Not Allowed",
  422: "Unprocessable Content",
  500: "Internal Server Error",
};

const SCENARIOS: readonly { id: string; label: string; request: ApiRequest }[] = [
  {
    id: "ok",
    label: "GET /models/1",
    request: { method: "GET", path: "/models/1", hasToken: false },
  },
  {
    id: "typo",
    label: "GET /modles/1 (errata)",
    request: { method: "GET", path: "/modles/1", hasToken: false },
  },
  {
    id: "method",
    label: "DELETE /health",
    request: { method: "DELETE", path: "/health", hasToken: false },
  },
  {
    id: "path-type",
    label: "GET /models/abc",
    request: { method: "GET", path: "/models/abc", hasToken: false },
  },
  {
    id: "bad-body",
    label: "POST /predictions, con token, alcohol = −3",
    request: { method: "POST", path: "/predictions", hasToken: true, body: { alcohol: -3 } },
  },
  {
    id: "no-token",
    label: "POST /predictions, sin token, alcohol = −3",
    request: { method: "POST", path: "/predictions", hasToken: false, body: { alcohol: -3 } },
  },
  {
    id: "missing",
    label: "GET /models/99 (no existe)",
    request: { method: "GET", path: "/models/99", hasToken: false },
  },
  {
    id: "bug",
    label: "GET /models/1 con un bug en el endpoint",
    request: { method: "GET", path: "/models/1", hasToken: false, hasBug: true },
  },
  {
    id: "incomplete",
    label: "GET /models/1, la respuesta no cumple el modelo",
    request: { method: "GET", path: "/models/1", hasToken: false, isResponseIncomplete: true },
  },
  {
    id: "created",
    label: "POST /predictions, con token, alcohol = 11",
    request: { method: "POST", path: "/predictions", hasToken: true, body: { alcohol: 11 } },
  },
];

function stroke(result: StepResult | undefined): string {
  if (result === "fail") return "var(--color-bad)";
  if (result === "pass") return "var(--subject-color)";
  return "var(--color-line)";
}

export default function RequestLifecycleSim(): ReactNode {
  const [scenarioId, setScenarioId] = useState("ok");
  const [shown, setShown] = useState(0);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  if (!scenario) return null;
  const trace = handle(scenario.request);
  const visible = trace.steps.slice(0, shown);
  const isDone = shown >= trace.steps.length;

  return (
    <SimFrame
      title="La vida de una petición"
      intro="Elige una petición y avanza paso a paso. Cada etapa puede cortar el viaje, y la que corta decide el código de estado. Fíjate en el orden: las dependencias se ejecutan antes de validar el cuerpo."
      onReset={() => {
        setScenarioId("ok");
        setShown(0);
      }}
      controls={
        <>
          <Choice
            label="Petición"
            value={scenarioId}
            onChange={(id) => {
              setScenarioId(id);
              setShown(0);
            }}
            options={SCENARIOS.map((s) => ({ value: s.id, label: s.label }))}
          />
          <ButtonRow>
            <SimButton
              isPrimary
              onClick={() => {
                setShown((n) => Math.min(trace.steps.length, n + 1));
              }}
              isDisabled={isDone}
            >
              Siguiente paso
            </SimButton>
            <SimButton
              onClick={() => {
                setShown(trace.steps.length);
              }}
              isDisabled={isDone}
            >
              Hasta el final
            </SimButton>
          </ButtonRow>
          <ControlNote>
            Un 4xx es culpa del cliente y el servidor lo controla; un 500 es un error tuyo que nadie
            capturó. En los logs, vigila los 500.
          </ControlNote>
        </>
      }
      readout={
        <Stat
          label="Respuesta"
          value={isDone ? `${String(trace.status)} ${STATUS_TEXT[trace.status] ?? ""}` : "…"}
          tone={!isDone ? "default" : trace.status < 400 ? "good" : "bad"}
        />
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`${scenario.label}: ${visible
          .map((s) => `${STAGE_LABEL[s.stage]}: ${SAID[s.result]}, ${s.note}`)
          .join("; ")}${isDone ? `. Respuesta ${String(trace.status)}` : ""}`}
      >
        <text x={4} y={16} fontFamily="var(--font-mono)" fontSize={12} fill="var(--color-ink)">
          {`→ ${scenario.label}`}
        </text>
        {STAGES.map((stage, i) => {
          const y = TOP + i * STEP;
          const step = visible.find((s) => s.stage === stage);
          const result = step?.result;
          const isCurrent = visible.at(-1)?.stage === stage;
          return (
            <g key={stage}>
              {i > 0 && (
                <path
                  d={`M${String(W / 2)},${String(y - 11)} v10`}
                  stroke="var(--color-muted)"
                  strokeWidth={1.5}
                />
              )}
              <rect
                x={4}
                y={y}
                width={W - 8}
                height={BOX_H}
                rx={8}
                fill={result === "pass" ? "var(--subject-soft)" : "var(--color-surface-sunken)"}
                stroke={stroke(result)}
                strokeWidth={isCurrent ? 2.5 : 1}
                strokeDasharray={result === "skip" ? "4 3" : undefined}
              />
              <text x={16} y={y + 18} fontSize={13} fontWeight={650} fill="var(--color-ink)">
                {`${String(i + 1)}. ${STAGE_LABEL[stage]}`}
              </text>
              <text x={16} y={y + 35} fontSize={11} fill="var(--color-muted)">
                {step?.note ?? ""}
              </text>
              <text
                x={W - 20}
                y={y + 29}
                textAnchor="end"
                fontSize={20}
                fontWeight={700}
                fill={result === "fail" ? "var(--color-bad)" : "var(--color-ink)"}
              >
                {result === undefined ? "" : MARK[result]}
              </text>
            </g>
          );
        })}
      </svg>
      <p role="status" style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)" }}>
        {isDone ? (
          <>
            Respuesta: <code>{`${String(trace.status)} ${trace.body}`}</code>
          </>
        ) : (
          "Avanza para ver qué hace cada etapa."
        )}
      </p>
    </SimFrame>
  );
}
