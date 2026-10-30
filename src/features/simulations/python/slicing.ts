/** The indices a Python slice `seq[start:stop:step]` selects, with CPython's rules. */
export function sliceIndices(
  length: number,
  start: number | null,
  stop: number | null,
  step = 1,
): number[] {
  if (step === 0) throw new Error("slice step cannot be zero");
  // Same normalisation as PySlice_AdjustIndices: negative indices count from the end, then clamp
  const lower = step > 0 ? 0 : -1;
  const upper = step > 0 ? length : length - 1;
  const adjust = (value: number | null, fallback: number): number => {
    if (value === null) return fallback;
    const absolute = value < 0 ? value + length : value;
    return Math.min(Math.max(absolute, lower), upper);
  };
  const first = adjust(start, step > 0 ? lower : upper);
  const last = adjust(stop, step > 0 ? upper : lower);
  const indices: number[] = [];
  for (let i = first; step > 0 ? i < last : i > last; i += step) indices.push(i);
  return indices;
}

/** How the slice is written in Python, leaving out the parts that take their default. */
export function sliceText(start: number | null, stop: number | null, step: number): string {
  const part = (value: number | null): string => (value === null ? "" : String(value));
  return step === 1
    ? `${part(start)}:${part(stop)}`
    : `${part(start)}:${part(stop)}:${String(step)}`;
}
