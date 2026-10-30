import { describe, expect, it } from "vitest";

import { schedule } from "./event-loop";
import { handle, matchPath, STAGES } from "./lifecycle";

describe("matchPath", () => {
  it("captures path parameters and rejects other shapes", () => {
    expect(matchPath("/models/{model_id}", "/models/7")).toEqual({ model_id: "7" });
    expect(matchPath("/models/{model_id}", "/models")).toBeNull();
    expect(matchPath("/models/{model_id}", "/modles/7")).toBeNull();
  });
});

describe("handle", () => {
  const failedAt = (trace: ReturnType<typeof handle>): string | undefined =>
    trace.steps.find((s) => s.result === "fail")?.stage;

  it("lists the stages in FastAPI's order: dependencies before validation", () => {
    expect(STAGES.indexOf("dependencies")).toBeLessThan(STAGES.indexOf("validation"));
  });

  it("answers 200 when every step passes", () => {
    const trace = handle({ method: "GET", path: "/models/1", hasToken: false });
    expect(trace.status).toBe(200);
    expect(trace.steps.every((s) => s.result === "pass")).toBe(true);
  });

  it("answers 404 for an unknown URL and 405 for a known URL with another method", () => {
    expect(handle({ method: "GET", path: "/modles/1", hasToken: false }).status).toBe(404);
    const trace = handle({ method: "DELETE", path: "/health", hasToken: false });
    expect(trace.status).toBe(405);
    expect(failedAt(trace)).toBe("routing");
  });

  it("answers 422 when a parameter or the body does not validate", () => {
    expect(handle({ method: "GET", path: "/models/abc", hasToken: false }).status).toBe(422);
    const body = handle({
      method: "POST",
      path: "/predictions",
      hasToken: true,
      body: { alcohol: -3 },
    });
    expect(body.status).toBe(422);
    expect(failedAt(body)).toBe("validation");
  });

  it("answers 422 when the body has no alcohol, with a JSON body", () => {
    const trace = handle({ method: "POST", path: "/predictions", hasToken: true, body: {} });
    expect(trace.status).toBe(422);
    expect(() => JSON.parse(trace.body) as unknown).not.toThrow();
  });

  it("runs dependencies before validating the body: no token and a bad body is a 401", () => {
    const trace = handle({
      method: "POST",
      path: "/predictions",
      hasToken: false,
      body: { alcohol: -3 },
    });
    expect(trace.status).toBe(401);
    expect(failedAt(trace)).toBe("dependencies");
    expect(trace.steps.find((s) => s.stage === "validation")?.result).toBe("skip");
  });

  it("answers 404 from the endpoint, 500 for a bug or an incomplete response", () => {
    expect(handle({ method: "GET", path: "/models/99", hasToken: false }).status).toBe(404);
    const bug = handle({ method: "GET", path: "/models/1", hasToken: false, hasBug: true });
    expect(bug.status).toBe(500);
    expect(failedAt(bug)).toBe("endpoint");
    const incomplete = handle({
      method: "GET",
      path: "/models/1",
      hasToken: false,
      isResponseIncomplete: true,
    });
    expect(incomplete.status).toBe(500);
    expect(failedAt(incomplete)).toBe("response");
  });

  it("answers 201 to a valid prediction", () => {
    const trace = handle({
      method: "POST",
      path: "/predictions",
      hasToken: true,
      body: { alcohol: 11 },
    });
    expect(trace.status).toBe(201);
    expect(trace.steps).toHaveLength(6);
  });
});

describe("schedule", () => {
  const base = { n: 10, cpuMs: 10, ioMs: 100 };

  it("await: the Python work takes turns, the waits overlap", () => {
    const s = schedule({ ...base, mode: "await" });
    expect(s.total).toBe(200);
    expect(s.meanLatency).toBe(155);
  });

  it("blocking: one request after another", () => {
    const s = schedule({ ...base, mode: "blocking" });
    expect(s.total).toBe(1100);
    expect(s.meanLatency).toBe(605);
  });

  it("threads: as good as await while there are threads, queues when they run out", () => {
    expect(schedule({ ...base, mode: "threads", threads: 40 }).total).toBe(200);
    const two = schedule({ ...base, mode: "threads", threads: 2 });
    expect(two.total).toBe(560);
    expect(two.requests[2]?.segments[0]).toEqual({ kind: "queued", start: 0, end: 110 });
  });

  it("handles one request and clamps an empty pool to one thread", () => {
    expect(schedule({ mode: "await", n: 1, cpuMs: 10, ioMs: 100 }).total).toBe(110);
    expect(schedule({ ...base, mode: "threads", threads: 0 }).total).toBe(1100);
  });

  it("CPU-bound work is not sped up by async or threads", () => {
    const cpu = { n: 10, cpuMs: 100, ioMs: 10 };
    expect(schedule({ ...cpu, mode: "await" }).total).toBe(1010);
    expect(schedule({ ...cpu, mode: "threads" }).total).toBe(1010);
    expect(schedule({ ...cpu, mode: "blocking" }).total).toBe(1100);
  });
});
