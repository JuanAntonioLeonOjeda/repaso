/** First-order optimisers on a 2D loss surface, written as in the papers. */
export interface Vec {
  x: number;
  y: number;
}

export type OptimizerName = "sgd" | "momentum" | "rmsprop" | "adam";

export interface OptState {
  p: Vec;
  v: Vec; // momentum / first moment
  s: Vec; // squared-gradient average / second moment
  t: number;
}

export function initState(p: Vec): OptState {
  return { p, v: { x: 0, y: 0 }, s: { x: 0, y: 0 }, t: 0 };
}

export function optimizerStep(name: OptimizerName, st: OptState, g: Vec, lr: number): OptState {
  const t = st.t + 1;
  switch (name) {
    case "sgd":
      return { ...st, t, p: { x: st.p.x - lr * g.x, y: st.p.y - lr * g.y } };
    case "momentum": {
      const beta = 0.9;
      const v = { x: beta * st.v.x + g.x, y: beta * st.v.y + g.y };
      return { ...st, t, v, p: { x: st.p.x - lr * v.x, y: st.p.y - lr * v.y } };
    }
    case "rmsprop": {
      const rho = 0.9;
      const s = { x: rho * st.s.x + (1 - rho) * g.x ** 2, y: rho * st.s.y + (1 - rho) * g.y ** 2 };
      return {
        ...st,
        t,
        s,
        p: {
          x: st.p.x - (lr * g.x) / (Math.sqrt(s.x) + 1e-8),
          y: st.p.y - (lr * g.y) / (Math.sqrt(s.y) + 1e-8),
        },
      };
    }
    case "adam": {
      const b1 = 0.9;
      const b2 = 0.999;
      const v = { x: b1 * st.v.x + (1 - b1) * g.x, y: b1 * st.v.y + (1 - b1) * g.y };
      const s = { x: b2 * st.s.x + (1 - b2) * g.x ** 2, y: b2 * st.s.y + (1 - b2) * g.y ** 2 };
      // Bias correction: the moments start at 0 and would be too small early on.
      const vh = { x: v.x / (1 - b1 ** t), y: v.y / (1 - b1 ** t) };
      const sh = { x: s.x / (1 - b2 ** t), y: s.y / (1 - b2 ** t) };
      return {
        t,
        v,
        s,
        p: {
          x: st.p.x - (lr * vh.x) / (Math.sqrt(sh.x) + 1e-8),
          y: st.p.y - (lr * vh.y) / (Math.sqrt(sh.y) + 1e-8),
        },
      };
    }
    default: {
      const unreachable: never = name;
      return unreachable;
    }
  }
}
