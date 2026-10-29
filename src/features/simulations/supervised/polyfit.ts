/**
 * Least-squares polynomial fit by solving the normal equations (XᵀX + λI)w = Xᵀy with
 * Gaussian elimination. Inputs are expected in [-1, 1] so high degrees stay stable.
 */
export function fitPolynomial(
  xs: readonly number[],
  ys: readonly number[],
  degree: number,
  lambda = 0,
): number[] {
  const n = degree + 1;
  const A: number[][] = Array.from({ length: n }, () => new Array<number>(n + 1).fill(0));
  xs.forEach((x, k) => {
    const powers = Array.from({ length: n }, (_, i) => x ** i);
    for (let i = 0; i < n; i++) {
      const row = A[i];
      if (row === undefined) continue;
      for (let j = 0; j < n; j++) row[j] = (row[j] ?? 0) + (powers[i] ?? 0) * (powers[j] ?? 0);
      row[n] = (row[n] ?? 0) + (powers[i] ?? 0) * (ys[k] ?? 0);
    }
  });
  // Ridge term (not on the intercept) keeps the system solvable for high degrees.
  for (let i = 1; i < n; i++) {
    const row = A[i];
    if (row) row[i] = (row[i] ?? 0) + lambda + 1e-9;
  }
  return solve(A, n);
}

function solve(A: number[][], n: number): number[] {
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r]?.[col] ?? 0) > Math.abs(A[pivot]?.[col] ?? 0)) pivot = r;
    }
    const tmp = A[col];
    const p = A[pivot];
    if (tmp === undefined || p === undefined) continue;
    A[col] = p;
    A[pivot] = tmp;
    const pivotRow = A[col] ?? [];
    const pv = pivotRow[col] ?? 1;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const row = A[r];
      if (row === undefined) continue;
      const factor = (row[col] ?? 0) / pv;
      for (let c = col; c <= n; c++) row[c] = (row[c] ?? 0) - factor * (pivotRow[c] ?? 0);
    }
  }
  return Array.from({ length: n }, (_, i) => (A[i]?.[n] ?? 0) / (A[i]?.[i] ?? 1));
}

export function evalPolynomial(w: readonly number[], x: number): number {
  return w.reduce((acc, wi, i) => acc + wi * x ** i, 0);
}

export function mse(w: readonly number[], xs: readonly number[], ys: readonly number[]): number {
  return xs.reduce((s, x, i) => s + (evalPolynomial(w, x) - (ys[i] ?? 0)) ** 2, 0) / xs.length;
}
