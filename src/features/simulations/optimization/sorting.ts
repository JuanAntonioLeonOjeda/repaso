/**
 * Sorting algorithms that record every comparison and write as a frame, so the
 * simulation can replay them step by step and count the work each one does.
 */
export interface Frame {
  array: number[];
  /** Indices being compared or written in this step. */
  active: number[];
  comparisons: number;
  writes: number;
}

export type SortName = "bubble" | "insertion" | "selection" | "merge" | "quick";

function recorder(input: readonly number[]) {
  const a = [...input];
  const frames: Frame[] = [];
  let comparisons = 0;
  let writes = 0;
  return {
    a,
    frames,
    compare(i: number, j: number): boolean {
      comparisons++;
      frames.push({ array: [...a], active: [i, j], comparisons, writes });
      return (a[i] ?? 0) > (a[j] ?? 0);
    },
    swap(i: number, j: number): void {
      [a[i], a[j]] = [a[j] ?? 0, a[i] ?? 0];
      writes += 2;
      frames.push({ array: [...a], active: [i, j], comparisons, writes });
    },
    set(i: number, v: number): void {
      a[i] = v;
      writes++;
      frames.push({ array: [...a], active: [i], comparisons, writes });
    },
    countCompare(): void {
      comparisons++;
    },
  };
}

export function sortFrames(name: SortName, input: readonly number[]): Frame[] {
  const r = recorder(input);
  const { a } = r;
  const n = a.length;
  switch (name) {
    case "bubble":
      for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - 1 - i; j++) {
          if (r.compare(j, j + 1)) {
            r.swap(j, j + 1);
            swapped = true;
          }
        }
        if (!swapped) break; // already sorted: the best case is O(n)
      }
      break;
    case "selection":
      for (let i = 0; i < n - 1; i++) {
        let min = i;
        for (let j = i + 1; j < n; j++) if (r.compare(min, j)) min = j;
        if (min !== i) r.swap(i, min);
      }
      break;
    case "insertion":
      for (let i = 1; i < n; i++) {
        let j = i;
        while (j > 0 && r.compare(j - 1, j)) {
          r.swap(j - 1, j);
          j--;
        }
      }
      break;
    case "merge": {
      const mergeSort = (lo: number, hi: number): void => {
        if (hi - lo < 1) return;
        const mid = Math.floor((lo + hi) / 2);
        mergeSort(lo, mid);
        mergeSort(mid + 1, hi);
        const left = a.slice(lo, mid + 1);
        const right = a.slice(mid + 1, hi + 1);
        let i = 0;
        let j = 0;
        let k = lo;
        while (i < left.length && j < right.length) {
          r.countCompare();
          if ((left[i] ?? 0) <= (right[j] ?? 0)) r.set(k++, left[i++] ?? 0);
          else r.set(k++, right[j++] ?? 0);
        }
        while (i < left.length) r.set(k++, left[i++] ?? 0);
        while (j < right.length) r.set(k++, right[j++] ?? 0);
      };
      mergeSort(0, n - 1);
      break;
    }
    case "quick": {
      const quick = (lo: number, hi: number): void => {
        if (lo >= hi) return;
        // Lomuto partition with the last element as pivot
        let p = lo;
        for (let i = lo; i < hi; i++) {
          if (!r.compare(i, hi)) {
            r.swap(i, p);
            p++;
          }
        }
        r.swap(p, hi);
        quick(lo, p - 1);
        quick(p + 1, hi);
      };
      quick(0, n - 1);
      break;
    }
    default: {
      const unreachable: never = name;
      return unreachable;
    }
  }
  const last = r.frames.at(-1);
  r.frames.push({
    array: [...a],
    active: [],
    comparisons: last?.comparisons ?? 0,
    writes: last?.writes ?? 0,
  });
  return r.frames;
}
