/**
 * Pull a dominant-color palette from a photo (a coarse median-cut: bucket the
 * downscaled pixels in RGB space, take the heaviest buckets). Used to offer the
 * photo's own colors as route-color choices in the share editor. Browser-only.
 */

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function distance(a: [number, number, number], b: [number, number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

export function extractPalette(src: string, count = 5): Promise<string[]> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve([]);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => resolve([]);
    img.onload = () => {
      const n = 40;
      const c = document.createElement("canvas");
      c.width = n;
      c.height = n;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0, n, n);
      const d = ctx.getImageData(0, 0, n, n).data;

      const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i]!;
        const g = d[i + 1]!;
        const b = d[i + 2]!;
        const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
        const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
        e.r += r;
        e.g += g;
        e.b += b;
        e.n += 1;
        buckets.set(key, e);
      }

      const cols = [...buckets.values()]
        .map((e) => ({ rgb: [e.r / e.n, e.g / e.n, e.b / e.n] as [number, number, number], n: e.n }))
        .sort((a, b) => b.n - a.n);

      // Keep heaviest, but skip near-duplicates so the palette is varied.
      const picked: [number, number, number][] = [];
      for (const c2 of cols) {
        if (picked.every((p) => distance(p, c2.rgb) > 60)) picked.push(c2.rgb);
        if (picked.length >= count) break;
      }
      resolve(picked.map(([r, g, b]) => toHex(r, g, b)));
    };
    img.src = src;
  });
}
