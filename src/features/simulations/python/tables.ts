/** Small tables for the pandas simulations: rows as plain objects, `null` for NaN. */
export type Value = string | number | null;
export type Row = Readonly<Record<string, Value>>;

export type Aggregation = "count" | "sum" | "mean" | "max";

export interface Group {
  key: string;
  rows: Row[];
  value: number;
}

function aggregate(values: readonly number[], how: Aggregation): number {
  switch (how) {
    case "count":
      return values.length;
    case "sum":
      return values.reduce((s, v) => s + v, 0);
    case "mean":
      return values.reduce((s, v) => s + v, 0) / values.length;
    case "max":
      return Math.max(...values);
    default: {
      const unreachable: never = how;
      return unreachable;
    }
  }
}

/**
 * `df.groupby(by)[column].agg(how)`: split by the key, apply to each group, combine. Like pandas,
 * groups come out sorted by key and NaN values are skipped (count counts non-NaN values).
 */
export function groupBy(
  rows: readonly Row[],
  by: string,
  column: string,
  how: Aggregation,
): Group[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = row[by];
    if (key === null || key === undefined) continue; // dropna=True: rows with a NaN key vanish
    const list = groups.get(String(key)) ?? [];
    list.push(row);
    groups.set(String(key), list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, list]) => ({
      key,
      rows: list,
      value: aggregate(
        list.flatMap((r) => (typeof r[column] === "number" ? [r[column]] : [])),
        how,
      ),
    }));
}

export type JoinHow = "inner" | "left" | "right" | "outer";

export interface MergedRow {
  left: Row | null;
  right: Row | null;
}

function compareKeys(a: Value, b: Value): number {
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

/**
 * `pd.merge(left, right, on=key, how=how)`. Each left row is paired with every right row that has
 * the same key, so a key repeated on the right multiplies the left row. Order as in pandas:
 * inner and left keep the left order, right keeps the right order, outer sorts by key.
 */
export function merge(
  left: readonly Row[],
  right: readonly Row[],
  key: string,
  how: JoinHow,
): MergedRow[] {
  if (how === "right") {
    return merge(right, left, key, "left").map(({ left: r, right: l }) => ({ left: l, right: r }));
  }
  const result: MergedRow[] = [];
  for (const l of left) {
    const matches = right.filter((r) => r[key] === l[key]);
    if (matches.length > 0) matches.forEach((r) => result.push({ left: l, right: r }));
    else if (how !== "inner") result.push({ left: l, right: null });
  }
  if (how !== "outer") return result;
  const unmatched = right.filter((r) => !left.some((l) => l[key] === r[key]));
  const keyOf = (m: MergedRow): Value => (m.left ?? m.right)?.[key] ?? null;
  return [...result, ...unmatched.map((r) => ({ left: null, right: r }))].sort((a, b) =>
    compareKeys(keyOf(a), keyOf(b)),
  );
}
