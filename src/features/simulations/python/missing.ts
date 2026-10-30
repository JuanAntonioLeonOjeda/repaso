export type FillMethod = "dropna" | "fillna-mean" | "ffill" | "bfill" | "interpolate";
export type Cell = number | null;

function forwardFill(values: readonly Cell[]): Cell[] {
  let last: Cell = null;
  return values.map((v) => (v === null ? last : (last = v)));
}

/**
 * pandas' default `interpolate()` (method="linear", limit_direction="forward"): straight lines
 * between known values, the last known value repeated at the end, leading gaps left empty.
 */
function interpolate(values: readonly Cell[]): Cell[] {
  const known = values.flatMap((v, i) => (v === null ? [] : [{ i, v }]));
  return values.map((v, i) => {
    if (v !== null) return v;
    const before = known.filter((k) => k.i < i).at(-1);
    const after = known.find((k) => k.i > i);
    if (before === undefined) return null;
    if (after === undefined) return before.v;
    return before.v + ((after.v - before.v) * (i - before.i)) / (after.i - before.i);
  });
}

/** What each pandas method leaves in a column with gaps (`null` = NaN; dropna removes them). */
export function fillMissing(values: readonly Cell[], method: FillMethod): Cell[] {
  switch (method) {
    case "dropna":
      return values.filter((v) => v !== null);
    case "fillna-mean": {
      const known = values.filter((v): v is number => v !== null);
      const mean = known.reduce((s, v) => s + v, 0) / known.length;
      return values.map((v) => v ?? mean);
    }
    case "ffill":
      return forwardFill(values);
    case "bfill":
      return forwardFill([...values].reverse()).reverse();
    case "interpolate":
      return interpolate(values);
    default: {
      const unreachable: never = method;
      return unreachable;
    }
  }
}
