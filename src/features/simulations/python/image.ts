/** Grayscale images as flat arrays of 0–255 values, row by row, like a 2-D uint8 ndarray. */
export interface GrayImage {
  width: number;
  height: number;
  pixels: number[];
}

/** A synthetic scene: a soft horizontal gradient, a bright disc and a dark square. */
export function makeScene(size = 64): GrayImage {
  const pixels: number[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 40 + (x / (size - 1)) * 120;
      if ((x - size * 0.32) ** 2 + (y - size * 0.4) ** 2 < (size * 0.2) ** 2) v = 225;
      if (x > size * 0.58 && x < size * 0.88 && y > size * 0.55 && y < size * 0.85) v = 15;
      pixels.push(Math.round(v));
    }
  }
  return { width: size, height: size, pixels };
}

/** Diagonal stripes, the second image for blending. */
export function makeStripes(size = 64): GrayImage {
  const pixels: number[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) pixels.push(Math.floor((x + y) / 8) % 2 === 0 ? 250 : 30);
  }
  return { width: size, height: size, pixels };
}

/** `img + delta` on a uint8 array in NumPy: the result wraps around modulo 256. */
export function addWrap(image: GrayImage, delta: number): GrayImage {
  return { ...image, pixels: image.pixels.map((v) => (((v + delta) % 256) + 256) % 256) };
}

/** `cv2.add(img, delta)`: saturating arithmetic, clipped to [0, 255]. */
export function addSaturate(image: GrayImage, delta: number): GrayImage {
  return { ...image, pixels: image.pixels.map((v) => Math.min(255, Math.max(0, v + delta))) };
}

/** `cv2.addWeighted(a, alpha, b, 1 - alpha, 0)`, rounded and saturated like OpenCV. */
export function blend(a: GrayImage, b: GrayImage, alpha: number): GrayImage {
  return {
    ...a,
    pixels: a.pixels.map((v, i) =>
      Math.min(255, Math.max(0, Math.round(alpha * v + (1 - alpha) * (b.pixels[i] ?? 0)))),
    ),
  };
}

function at(image: GrayImage, x: number, y: number): number {
  // replicate the border, so the frame of the image does not look like an edge
  const cx = Math.min(image.width - 1, Math.max(0, x));
  const cy = Math.min(image.height - 1, Math.max(0, y));
  return image.pixels[cy * image.width + cx] ?? 0;
}

/** Horizontal Sobel response at (x, y): positive on dark→bright edges, negative on bright→dark. */
export function sobelX(image: GrayImage, x: number, y: number): number {
  return (
    at(image, x + 1, y - 1) +
    2 * at(image, x + 1, y) +
    at(image, x + 1, y + 1) -
    at(image, x - 1, y - 1) -
    2 * at(image, x - 1, y) -
    at(image, x - 1, y + 1)
  );
}

export function sobelY(image: GrayImage, x: number, y: number): number {
  return (
    at(image, x - 1, y + 1) +
    2 * at(image, x, y + 1) +
    at(image, x + 1, y + 1) -
    at(image, x - 1, y - 1) -
    2 * at(image, x, y - 1) -
    at(image, x + 1, y - 1)
  );
}

export type EdgeMode = "uint8" | "float-abs" | "magnitude";

/**
 * Edges with Sobel, in the three ways the course compares: storing the x-gradient straight into
 * uint8 (negative slopes are clipped to 0, so half the edges vanish), taking its absolute value
 * from a float result (`cv2.CV_64F` then `np.absolute`), or the full magnitude of x and y.
 */
export function edges(image: GrayImage, mode: EdgeMode): GrayImage {
  const pixels: number[] = [];
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const gx = sobelX(image, x, y);
      const value =
        mode === "uint8"
          ? gx
          : mode === "float-abs"
            ? Math.abs(gx)
            : Math.hypot(gx, sobelY(image, x, y));
      pixels.push(Math.min(255, Math.max(0, Math.round(value))));
    }
  }
  return { ...image, pixels };
}
