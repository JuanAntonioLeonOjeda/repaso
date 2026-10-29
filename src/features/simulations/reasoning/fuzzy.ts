/** Fuzzy sets and a Mamdani / Sugeno inference engine, small enough to read in one go. */

export type Membership = (x: number) => number;

export const triangle =
  (a: number, b: number, c: number): Membership =>
  (x) =>
    x <= a || x >= c ? (x === b ? 1 : 0) : x <= b ? (x - a) / (b - a) : (c - x) / (c - b);

export const trapezoid =
  (a: number, b: number, c: number, d: number): Membership =>
  (x) => {
    if (x < a || x > d) return 0;
    if (x >= b && x <= c) return 1;
    return x < b ? (x - a) / (b - a || 1) : (d - x) / (d - c || 1);
  };

export type TNorm = "min" | "product" | "lukasiewicz";

export const T_NORMS: Record<TNorm, (a: number, b: number) => number> = {
  min: Math.min,
  product: (a, b) => a * b,
  lukasiewicz: (a, b) => Math.max(0, a + b - 1),
};

export const T_CONORMS: Record<TNorm, (a: number, b: number) => number> = {
  min: Math.max,
  product: (a, b) => a + b - a * b,
  lukasiewicz: (a, b) => Math.min(1, a + b),
};

// ---------- The tipping controller (the classic fuzzy-control example) ----------

export const SERVICE = {
  malo: trapezoid(0, 0, 1, 4),
  bueno: triangle(2, 5, 8),
  excelente: trapezoid(6, 9, 10, 10),
};
export const FOOD = {
  rancia: trapezoid(0, 0, 2, 5),
  deliciosa: trapezoid(5, 8, 10, 10),
};
export const TIP = {
  baja: triangle(0, 5, 10),
  media: triangle(8, 13, 18),
  alta: triangle(16, 21, 25),
};
/** Sugeno consequents: a crisp tip per rule instead of a fuzzy set. */
export const TIP_SUGENO = { baja: 5, media: 13, alta: 21 } as const;

export type TipLabel = keyof typeof TIP;

export interface Rule {
  text: string;
  /** Degree to which the antecedent holds for the inputs. */
  strength: (service: number, food: number, or: (a: number, b: number) => number) => number;
  output: TipLabel;
}

export const RULES: Rule[] = [
  {
    text: "SI servicio es malo O comida es rancia → propina baja",
    strength: (s, f, or) => or(SERVICE.malo(s), FOOD.rancia(f)),
    output: "baja",
  },
  {
    text: "SI servicio es bueno → propina media",
    strength: (s) => SERVICE.bueno(s),
    output: "media",
  },
  {
    text: "SI servicio es excelente O comida es deliciosa → propina alta",
    strength: (s, f, or) => or(SERVICE.excelente(s), FOOD.deliciosa(f)),
    output: "alta",
  },
];

export const TIP_MAX = 25;

export interface InferenceResult {
  strengths: number[];
  /** Aggregated output membership sampled on [0, TIP_MAX]. */
  aggregated: { x: number; mu: number }[];
  centroid: number;
  meanOfMax: number;
  sugeno: number;
}

export function infer(service: number, food: number, norm: TNorm = "min"): InferenceResult {
  const or = T_CONORMS[norm];
  const strengths = RULES.map((r) => r.strength(service, food, or));
  const aggregated: { x: number; mu: number }[] = [];
  for (let x = 0; x <= TIP_MAX + 1e-9; x += 0.1) {
    // Mamdani: each rule clips its output set at its strength (min), then all are joined (max).
    const mu = Math.max(...RULES.map((r, i) => Math.min(strengths[i] ?? 0, TIP[r.output](x))));
    aggregated.push({ x, mu });
  }
  const area = aggregated.reduce((s, p) => s + p.mu, 0);
  const centroid = area === 0 ? NaN : aggregated.reduce((s, p) => s + p.x * p.mu, 0) / area;
  const peak = Math.max(...aggregated.map((p) => p.mu));
  const atPeak = aggregated.filter((p) => p.mu >= peak - 1e-9);
  const meanOfMax = atPeak.reduce((s, p) => s + p.x, 0) / (atPeak.length || 1);
  const totalStrength = strengths.reduce((s, w) => s + w, 0);
  const sugeno =
    totalStrength === 0
      ? NaN
      : RULES.reduce((s, r, i) => s + (strengths[i] ?? 0) * TIP_SUGENO[r.output], 0) /
        totalStrength;
  return { strengths, aggregated, centroid, meanOfMax, sugeno };
}
