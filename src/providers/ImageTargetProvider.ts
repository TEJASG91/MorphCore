import type { TargetData, TargetProvider } from '../morph/types';

export interface ImageProviderOptions {
  depth?: number; // z relief scale (brightness → depth)
  span?: number; // world-space size of the longest side
  threshold?: number; // luminance below which a pixel is background (dropped)
  baseRes?: number; // sampling resolution (longest side, px)
  color?: 'spectrum' | 'photo';
}

/**
 * Turns an image into particle targets — M1's single importer. Brightness drives both
 * presence and z-depth (a bas-relief), so a flat photo gains 3D. If sampled points exceed
 * the budget it deterministically subsamples (same indices every time, so all quality
 * tiers show the same image, just sparser); if fewer, the engine leaves the remaining
 * particles transparent.
 *
 * M1 bakes at load. From M3 an offline step calls this and writes a .bin (BinaryLoader);
 * the runtime then consumes the baked file. The TargetProvider contract is identical
 * either way — that's the point.
 */
export class ImageTargetProvider implements TargetProvider {
  readonly id: string;

  constructor(
    private source: HTMLImageElement | HTMLCanvasElement,
    id = 'image',
    private opts: ImageProviderOptions = {},
  ) {
    this.id = id;
  }

  async load(maxParticles: number): Promise<TargetData> {
    const {
      depth = 1.3,
      span = 4.6,
      threshold = 0.06,
      baseRes = 190,
      color = 'spectrum',
    } = this.opts;

    const src = this.source as HTMLImageElement & HTMLCanvasElement;
    const iw = src.naturalWidth || src.width;
    const ih = src.naturalHeight || src.height;
    const s = baseRes / Math.max(iw, ih);
    const w = Math.max(1, Math.round(iw * s));
    const h = Math.max(1, Math.round(ih * s));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(this.source, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;

    const pos: number[] = [];
    const col: number[] = [];
    const siz: number[] = [];
    const scale = span / Math.max(w, h);
    const cx = w / 2;
    const cy = h / 2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (px[i + 3] / 255 < 0.2) continue;
        const r = px[i] / 255,
          g = px[i + 1] / 255,
          b = px[i + 2] / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < threshold) continue;

        pos.push((x - cx) * scale, -(y - cy) * scale, (lum - 0.5) * depth);
        const c =
          color === 'spectrum'
            ? spectrum(lum)
            : [Math.min(1, r * 1.1), Math.min(1, g * 1.1), Math.min(1, b * 1.1)];
        col.push(c[0], c[1], c[2]);
        siz.push(0.6 + lum * 0.9);
      }
    }

    let count = siz.length;
    let positions = new Float32Array(pos);
    let colors = new Float32Array(col);
    let sizes = new Float32Array(siz);

    if (count > maxParticles) {
      const stride = count / maxParticles;
      const p = new Float32Array(maxParticles * 3);
      const c = new Float32Array(maxParticles * 3);
      const z = new Float32Array(maxParticles);
      for (let k = 0; k < maxParticles; k++) {
        const j = Math.floor(k * stride);
        p[k * 3] = positions[j * 3];
        p[k * 3 + 1] = positions[j * 3 + 1];
        p[k * 3 + 2] = positions[j * 3 + 2];
        c[k * 3] = colors[j * 3];
        c[k * 3 + 1] = colors[j * 3 + 1];
        c[k * 3 + 2] = colors[j * 3 + 2];
        z[k] = sizes[j];
      }
      positions = p;
      colors = c;
      sizes = z;
      count = maxParticles;
    }

    return { count, positions, colors, sizes };
  }
}

/** brightness → violet → blue → cyan ramp */
function spectrum(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [0.1, 0.02, 0.22],
    [0.42, 0.1, 0.7],
    [0.62, 0.24, 0.96],
    [0.28, 0.46, 1.0],
    [0.34, 0.86, 1.0],
  ];
  t = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.floor(t),
    f = t - i;
  const a = stops[i],
    b = stops[Math.min(i + 1, stops.length - 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
