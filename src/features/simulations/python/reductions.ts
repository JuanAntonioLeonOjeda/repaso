export type Reduction = "sum" | "mean" | "max" | "argmax";
export type Axis = "none" | 0 | 1;

function reduceValues(values: readonly number[], op: Reduction): number {
  switch (op) {
    case "sum":
      return values.reduce((s, v) => s + v, 0);
    case "mean":
      return values.reduce((s, v) => s + v, 0) / values.length;
    case "max":
      return Math.max(...values);
    case "argmax":
      // first position of the maximum, like NumPy
      return values.indexOf(Math.max(...values));
    default: {
      const unreachable: never = op;
      return unreachable;
    }
  }
}

/**
 * `matrix.op(axis=...)` in NumPy. axis=0 collapses the rows (one result per column), axis=1
 * collapses the columns (one result per row); no axis collapses everything (argmax then gives
 * the position in the flattened array).
 */
export function reduceMatrix(
  matrix: readonly (readonly number[])[],
  op: Reduction,
  axis: Axis,
): number[] {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  if (axis === "none") return [reduceValues(matrix.flat(), op)];
  if (axis === 0) {
    return Array.from({ length: cols }, (_, j) =>
      reduceValues(
        matrix.map((row) => row[j] ?? 0),
        op,
      ),
    );
  }
  return Array.from({ length: rows }, (_, i) => reduceValues(matrix[i] ?? [], op));
}
