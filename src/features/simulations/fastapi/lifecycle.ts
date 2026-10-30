/**
 * The path of one request through a FastAPI app, step by step, and the status code it ends
 * with. A miniature of the tutorial's API: the order of the checks is FastAPI's, so the step
 * that fails decides the answer. Routing first; then the dependencies run; only then are the
 * endpoint's own path, query and body parameters validated (checked against FastAPI 0.136.1:
 * no token plus an invalid body is a 401, not a 422). Not modelled: malformed
 * JSON, which FastAPI rejects with a 422 before the dependencies run.
 */
export type Stage =
  "middleware" | "routing" | "dependencies" | "validation" | "endpoint" | "response";

export const STAGES: readonly Stage[] = [
  "middleware",
  "routing",
  "dependencies",
  "validation",
  "endpoint",
  "response",
];

export interface ApiRequest {
  method: "GET" | "POST" | "DELETE";
  path: string;
  hasToken: boolean;
  /** JSON body of POST /predictions. */
  body?: { alcohol?: number };
  /** The endpoint has a bug (a KeyError) — the 500 nobody plans. */
  hasBug?: boolean;
  /** The endpoint returns a dict missing a field the response model requires. */
  isResponseIncomplete?: boolean;
}

export type StepResult = "pass" | "fail" | "skip";

export interface Step {
  stage: Stage;
  result: StepResult;
  note: string;
}

export interface Trace {
  steps: Step[];
  status: number;
  body: string;
}

interface Route {
  method: ApiRequest["method"];
  pattern: string;
  needsToken: boolean;
}

const ROUTES: readonly Route[] = [
  { method: "GET", pattern: "/models/{model_id}", needsToken: false },
  { method: "POST", pattern: "/predictions", needsToken: true },
  { method: "GET", pattern: "/health", needsToken: false },
];

const MODELS = new Set([1, 2]);

/** Path parameters if `path` matches `pattern` (`{name}` matches one segment), else null. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const want = pattern.split("/");
  const got = path.split("/");
  if (want.length !== got.length) return null;
  const params: Record<string, string> = {};
  for (const [i, segment] of want.entries()) {
    const value = got[i] ?? "";
    const name = /^\{(\w+)\}$/.exec(segment)?.[1];
    if (name !== undefined) params[name] = value;
    else if (segment !== value) return null;
  }
  return params;
}

/** Completes a trace that stopped early: the stages after the failing one are skipped. */
function finish(steps: Step[], status: number, body: string): Trace {
  const done = new Set(steps.map((s) => s.stage));
  const rest = STAGES.filter((s) => !done.has(s)).map((stage): Step => ({
    stage,
    result: "skip",
    note: "no llega a ejecutarse",
  }));
  return { steps: [...steps, ...rest], status, body };
}

function validationError(
  request: ApiRequest,
  params: Partial<Record<string, string>>,
): string | null {
  const modelId = params.model_id;
  if (modelId !== undefined && !/^-?\d+$/.test(modelId)) {
    return `model_id: "${modelId}" no es un entero (int_parsing)`;
  }
  if (request.method === "POST") {
    const alcohol = request.body?.alcohol;
    if (alcohol === undefined) return "alcohol: falta (missing)";
    if (!(alcohol > 0)) return "alcohol: debe ser mayor que 0 (greater_than)";
  }
  return null;
}

/** Runs `request` through the miniature app and records what each stage did. */
export function handle(request: ApiRequest): Trace {
  const steps: Step[] = [{ stage: "middleware", result: "pass", note: "anota la hora de entrada" }];

  const byPath = ROUTES.filter((r) => matchPath(r.pattern, request.path) !== null);
  const route = byPath.find((r) => r.method === request.method);
  if (byPath.length === 0) {
    steps.push({ stage: "routing", result: "fail", note: "ninguna ruta coincide con la URL" });
    return finish(steps, 404, '{"detail": "Not Found"}');
  }
  if (route === undefined) {
    steps.push({ stage: "routing", result: "fail", note: "la URL existe, pero no con ese método" });
    return finish(steps, 405, '{"detail": "Method Not Allowed"}');
  }
  steps.push({ stage: "routing", result: "pass", note: `${route.method} ${route.pattern}` });

  if (route.needsToken && !request.hasToken) {
    steps.push({ stage: "dependencies", result: "fail", note: "get_current_user: no hay token" });
    return finish(steps, 401, '{"detail": "Not authenticated"}');
  }
  steps.push({
    stage: "dependencies",
    result: "pass",
    note: route.needsToken ? "usuario autenticado y sesión de BD abierta" : "sesión de BD abierta",
  });

  const params = matchPath(route.pattern, request.path) ?? {};
  const invalid = validationError(request, params);
  if (invalid !== null) {
    steps.push({ stage: "validation", result: "fail", note: invalid });
    return finish(steps, 422, JSON.stringify({ detail: [{ msg: invalid }] }));
  }
  steps.push({ stage: "validation", result: "pass", note: "tipos y restricciones correctos" });

  if (request.hasBug === true) {
    steps.push({ stage: "endpoint", result: "fail", note: "KeyError sin capturar" });
    // Unlike an HTTPException, the exception crosses the middleware without running the code
    // after `call_next`; Starlette's outermost error handler turns it into a bare 500.
    return finish(steps, 500, "Internal Server Error");
  }
  const modelId = Number(params.model_id);
  if ("model_id" in params && !MODELS.has(modelId)) {
    steps.push({ stage: "endpoint", result: "fail", note: "raise HTTPException(404)" });
    return finish(steps, 404, '{"detail": "Modelo no encontrado"}');
  }
  steps.push({ stage: "endpoint", result: "pass", note: "devuelve un dict" });

  if (request.isResponseIncomplete === true) {
    steps.push({ stage: "response", result: "fail", note: "falta un campo del response_model" });
    return finish(steps, 500, "Internal Server Error");
  }
  steps.push({ stage: "response", result: "pass", note: "filtra campos y serializa a JSON" });
  const status = request.method === "POST" ? 201 : 200;
  const body = status === 201 ? { id: 7, quality: 6 } : { id: 1, name: "ridge" };
  return { steps, status, body: JSON.stringify(body) };
}
