import { useState, type ReactNode } from "react";

import { ButtonRow, Choice, SimButton, SimFrame, Stat } from "@/features/simulations/kit";

import { SCENARIOS, type HeapObject } from "./references";

const W = 600;
const ROW_H = 46;
const NAME_END = 146;
const COLUMNS = { 1: { x: 262, width: 200 }, 2: { x: 500, width: 150 } } as const;
const BOX_H = 32;

function objectCentre(o: HeapObject): { x: number; y: number } {
  return { x: COLUMNS[o.col].x, y: 20 + o.row * ROW_H + BOX_H / 2 };
}

function halfWidth(o: HeapObject): number {
  return COLUMNS[o.col].width / 2;
}

export default function ReferencesSim(): ReactNode {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0]?.id ?? "alias");
  const [step, setStep] = useState(0);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  if (!scenario) return null;
  const frame = scenario.frames[step] ?? scenario.frames[0];
  if (!frame) return null;
  const names = Object.entries(frame.names);
  const byId = new Map(frame.objects.map((o) => [o.id, o]));
  const rows = Math.max(names.length, ...frame.objects.map((o) => o.row + 1));
  const H = 30 + rows * ROW_H;

  return (
    <SimFrame
      title="Nombres y objetos"
      intro="En Python una variable no es una caja con un valor: es una etiqueta pegada a un objeto. Avanza línea a línea y mira a qué apunta cada nombre. Las sorpresas de las listas (y del examen de «buscar el bug») salen de aquí."
      onReset={() => {
        setStep(0);
      }}
      controls={
        <>
          <Choice
            label="Programa"
            value={scenarioId}
            onChange={(id) => {
              setScenarioId(id);
              setStep(0);
            }}
            options={SCENARIOS.map((s) => ({ value: s.id, label: s.title }))}
          />
          <ButtonRow>
            <SimButton
              onClick={() => {
                setStep((s) => Math.max(0, s - 1));
              }}
              isDisabled={step === 0}
            >
              Anterior
            </SimButton>
            <SimButton
              isPrimary
              onClick={() => {
                setStep((s) => Math.min(scenario.frames.length - 1, s + 1));
              }}
              isDisabled={step === scenario.frames.length - 1}
            >
              Siguiente línea
            </SimButton>
          </ButtonRow>
          <pre
            aria-label="Código"
            style={{
              margin: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              lineHeight: 1.6,
            }}
          >
            {scenario.code.map((line, i) => (
              <div
                key={i}
                style={{
                  background: i === frame.line ? "var(--subject-soft)" : undefined,
                  boxShadow: i === frame.line ? "inset 3px 0 var(--subject-color)" : undefined,
                  borderRadius: 4,
                  paddingInline: 4,
                }}
              >
                {line || " "}
              </div>
            ))}
          </pre>
        </>
      }
      readout={
        <>
          <Stat label="Paso" value={`${String(step + 1)} / ${String(scenario.frames.length)}`} />
          {frame.output !== undefined && (
            <Stat label="Salida" value={<code>{frame.output}</code>} />
          )}
        </>
      }
    >
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        role="img"
        aria-label={`${names.map(([n, id]) => `${n} → ${byId.get(id)?.repr ?? ""}`).join("; ")}. ${frame.note}`}
      >
        <defs>
          <marker
            id="ref-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-muted)" />
          </marker>
        </defs>
        <text x={NAME_END} y={12} textAnchor="end" fontSize={11} fill="var(--color-muted)">
          nombres
        </text>
        <text
          x={COLUMNS[1].x - COLUMNS[1].width / 2}
          y={12}
          fontSize={11}
          fill="var(--color-muted)"
        >
          objetos
        </text>
        {names.map(([name, target], i) => {
          const o = byId.get(target);
          if (!o) return null;
          const y = 20 + i * ROW_H + BOX_H / 2;
          const c = objectCentre(o);
          return (
            <g key={name}>
              <text
                x={NAME_END}
                y={y + 4}
                textAnchor="end"
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill="var(--color-ink)"
              >
                {name}
              </text>
              <path
                d={`M${String(NAME_END + 6)},${String(y)} L${String(c.x - halfWidth(o) - 2)},${String(c.y)}`}
                stroke="var(--color-muted)"
                strokeWidth={1.5}
                markerEnd="url(#ref-arrow)"
                fill="none"
              />
            </g>
          );
        })}
        {frame.objects.flatMap((o) =>
          (o.refs ?? []).map((r, j) => {
            const target = byId.get(r);
            if (!target) return null;
            const from = objectCentre(o);
            const to = objectCentre(target);
            return (
              <path
                key={`${o.id}-${r}-${String(j)}`}
                d={`M${String(from.x + halfWidth(o))},${String(from.y)} L${String(to.x - halfWidth(target) - 2)},${String(to.y)}`}
                stroke="var(--subject-color)"
                strokeOpacity={0.7}
                strokeWidth={1.5}
                markerEnd="url(#ref-arrow)"
                fill="none"
              />
            );
          }),
        )}
        {frame.objects.map((o) => {
          const c = objectCentre(o);
          return (
            <g key={o.id}>
              <rect
                x={c.x - halfWidth(o)}
                y={c.y - BOX_H / 2}
                width={COLUMNS[o.col].width}
                height={BOX_H}
                rx={6}
                fill="var(--subject-soft)"
                stroke="var(--subject-color)"
              />
              <text
                x={c.x}
                y={c.y + 4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill="var(--color-ink)"
              >
                {o.repr}
              </text>
              <text
                x={c.x + halfWidth(o) - 4}
                y={c.y - BOX_H / 2 - 3}
                textAnchor="end"
                fontSize={10}
                fill="var(--color-muted)"
              >
                {o.type}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ margin: "var(--space-2) 0 0" }}>{frame.note}</p>
    </SimFrame>
  );
}
