/**
 * Dempster–Shafer over a small frame of discernment. Subsets are bitmasks: with
 * hypotheses [B, J, S], {B,S} is 0b101.
 */
export type Masses = Map<number, number>;

export function belief(m: Masses, set: number): number {
  let sum = 0;
  m.forEach((mass, subset) => {
    if (subset !== 0 && (subset & set) === subset) sum += mass;
  });
  return sum;
}

export function plausibility(m: Masses, set: number): number {
  let sum = 0;
  m.forEach((mass, subset) => {
    if ((subset & set) !== 0) sum += mass;
  });
  return sum;
}

/** Dempster's rule: multiply masses of intersecting sets, renormalise by 1 − conflict. */
export function combine(m1: Masses, m2: Masses): { masses: Masses; conflict: number } {
  const out: Masses = new Map();
  let conflict = 0;
  m1.forEach((a, s1) => {
    m2.forEach((b, s2) => {
      const inter = s1 & s2;
      if (inter === 0) conflict += a * b;
      else out.set(inter, (out.get(inter) ?? 0) + a * b);
    });
  });
  out.forEach((v, k) => out.set(k, v / (1 - conflict)));
  return { masses: out, conflict };
}
