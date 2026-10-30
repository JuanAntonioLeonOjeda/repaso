export type BroadcastResult =
  { ok: true; shape: number[] } | { ok: false; axis: number; sizes: [number, number] };

/**
 * NumPy's broadcasting rule: align the shapes on the right; two sizes are compatible when they
 * are equal or one of them is 1 (missing dimensions count as 1).
 */
export function broadcastShapes(a: readonly number[], b: readonly number[]): BroadcastResult {
  const ndim = Math.max(a.length, b.length);
  const shape: number[] = [];
  for (let i = 0; i < ndim; i++) {
    // i counts from the right
    const sa = a[a.length - 1 - i] ?? 1;
    const sb = b[b.length - 1 - i] ?? 1;
    if (sa !== sb && sa !== 1 && sb !== 1) {
      return { ok: false, axis: ndim - 1 - i, sizes: [sa, sb] };
    }
    shape.unshift(Math.max(sa, sb));
  }
  return { ok: true, shape };
}

/** The tuple as NumPy prints it: `(3,)`, `(2, 3)`. */
export function shapeText(shape: readonly number[]): string {
  return shape.length === 1 ? `(${String(shape[0])},)` : `(${shape.join(", ")})`;
}
