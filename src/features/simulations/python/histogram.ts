export interface Bin {
  from: number;
  to: number;
  count: number;
}

/**
 * `np.histogram(data, bins=n)`: n equal-width bins between the minimum and the maximum; every
 * bin is half-open [from, to) except the last, which also includes the maximum.
 */
export function histogram(data: readonly number[], bins: number): Bin[] {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const width = (max - min) / bins || 1;
  const result = Array.from({ length: bins }, (_, i) => ({
    from: min + i * width,
    to: min + (i + 1) * width,
    count: 0,
  }));
  for (const value of data) {
    const index = Math.min(Math.floor((value - min) / width), bins - 1);
    const bin = result[index];
    if (bin) bin.count += 1;
  }
  return result;
}

export function median(data: readonly number[]): number {
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? NaN)
    : ((sorted[mid - 1] ?? NaN) + (sorted[mid] ?? NaN)) / 2;
}

/** Sample standard deviation (ddof=1), as scipy uses for the KDE bandwidth. */
function sampleStd(data: readonly number[]): number {
  const m = data.reduce((s, v) => s + v, 0) / data.length;
  return Math.sqrt(data.reduce((s, v) => s + (v - m) ** 2, 0) / (data.length - 1));
}

/** Scott's rule, the default of `scipy.stats.gaussian_kde` (and of pandas' `plot.kde`). */
export function scottBandwidth(data: readonly number[]): number {
  return sampleStd(data) * data.length ** (-1 / 5);
}

/** Gaussian kernel density estimate at x: a small bell on every point, averaged. */
export function kde(data: readonly number[], x: number, bandwidth: number): number {
  const norm = 1 / (Math.sqrt(2 * Math.PI) * bandwidth * data.length);
  return norm * data.reduce((s, v) => s + Math.exp(-0.5 * ((x - v) / bandwidth) ** 2), 0);
}
