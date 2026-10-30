/**
 * CLAHE (Contrast Limited Adaptive Histogram Equalization), as OpenCV's createCLAHE that the
 * TFM applies to every radiograph (clipLimit 2.0, 8×8 tiles):
 *   1. split the image into tiles and build a histogram per tile;
 *   2. clip each histogram at clipLimit × (pixels per tile / 256) and spread the excess evenly;
 *   3. turn each histogram into a mapping (its cumulative distribution);
 *   4. map every pixel by bilinear interpolation between the four nearest tile mappings,
 *      so tile borders do not show.
 */

export function equalizeMapping(
  hist: readonly number[],
  clipLimit: number,
  pixels: number,
): Uint8Array {
  const bins = hist.length;
  const h = [...hist];
  if (clipLimit > 0) {
    const limit = Math.max(1, Math.floor((clipLimit * pixels) / bins));
    let excess = 0;
    for (let i = 0; i < bins; i++) {
      const over = (h[i] ?? 0) - limit;
      if (over > 0) {
        excess += over;
        h[i] = limit;
      }
    }
    const share = Math.floor(excess / bins);
    let rest = excess - share * bins;
    for (let i = 0; i < bins; i++) {
      h[i] = (h[i] ?? 0) + share + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
    }
  }
  const map = new Uint8Array(bins);
  let cumulative = 0;
  for (let i = 0; i < bins; i++) {
    cumulative += h[i] ?? 0;
    map[i] = Math.min(255, Math.round((cumulative * 255) / pixels));
  }
  return map;
}

/** CLAHE on an 8-bit grayscale image stored row-major in `src` (width × height). */
export function clahe(
  src: Uint8Array,
  width: number,
  height: number,
  clipLimit: number,
  grid: number,
): Uint8Array {
  const tw = width / grid;
  const th = height / grid;
  const maps: Uint8Array[] = [];
  for (let ty = 0; ty < grid; ty++) {
    for (let tx = 0; tx < grid; tx++) {
      const hist = new Array<number>(256).fill(0);
      const x0 = Math.floor(tx * tw);
      const x1 = Math.floor((tx + 1) * tw);
      const y0 = Math.floor(ty * th);
      const y1 = Math.floor((ty + 1) * th);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const v = src[y * width + x] ?? 0;
          hist[v] = (hist[v] ?? 0) + 1;
        }
      }
      maps.push(equalizeMapping(hist, clipLimit, (x1 - x0) * (y1 - y0)));
    }
  }
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    // Position relative to tile centres, clamped at the borders
    const gy = Math.min(grid - 1, Math.max(0, (y + 0.5) / th - 0.5));
    const ty0 = Math.floor(gy);
    const ty1 = Math.min(grid - 1, ty0 + 1);
    const fy = gy - ty0;
    for (let x = 0; x < width; x++) {
      const gx = Math.min(grid - 1, Math.max(0, (x + 0.5) / tw - 0.5));
      const tx0 = Math.floor(gx);
      const tx1 = Math.min(grid - 1, tx0 + 1);
      const fx = gx - tx0;
      const v = src[y * width + x] ?? 0;
      const a = maps[ty0 * grid + tx0]?.[v] ?? v;
      const b = maps[ty0 * grid + tx1]?.[v] ?? v;
      const c = maps[ty1 * grid + tx0]?.[v] ?? v;
      const d = maps[ty1 * grid + tx1]?.[v] ?? v;
      out[y * width + x] = Math.round(
        (1 - fy) * ((1 - fx) * a + fx * b) + fy * ((1 - fx) * c + fx * d),
      );
    }
  }
  return out;
}

export function histogram(src: Uint8Array, bins = 64): number[] {
  const h = new Array<number>(bins).fill(0);
  for (const v of src) {
    const b = Math.min(bins - 1, Math.floor((v * bins) / 256));
    h[b] = (h[b] ?? 0) + 1;
  }
  return h;
}

/**
 * A synthetic, low-contrast "lumbar radiograph" (no patient data): five vertebrae with a
 * trabecular texture over soft tissue, washed out like an unprocessed DICOM.
 */
export function syntheticSpine(size: number, seed = 1): Uint8Array {
  let s = seed;
  const rand = (): number => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const img = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = (x - size / 2) / size;
      const body = Math.exp(-(cx * cx) / 0.08) * 40; // soft tissue
      let bone = 0;
      for (let v = 0; v < 5; v++) {
        const vy = (y - size * (0.14 + v * 0.17)) / size;
        const inside = Math.abs(cx) < 0.11 && Math.abs(vy) < 0.065;
        if (inside) bone = 38 + 12 * Math.sin(x * 0.9) * Math.sin(y * 0.7); // trabeculae
      }
      const noise = (rand() - 0.5) * 10;
      img[y * size + x] = Math.max(0, Math.min(255, 95 + body + bone + noise));
    }
  }
  return img;
}
