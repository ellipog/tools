export interface VisualizerOptions {
  width: number;
  height: number;
  colors: string[];
  background: "black" | "transparent";
}

export interface VisualizerResult {
  render(ctx: CanvasRenderingContext2D): void;
}

export type VisualizerMode = "waveform" | "frequency" | "spectrogram" | "circle";

export const COLOR_SCHEMES: Record<string, string[]> = {
  Monochrome: ["#ffffff"],
  Heatmap: ["#000022", "#0033ff", "#00ffcc", "#ffff00", "#ff3300"],
  Lava: ["#1a0000", "#660000", "#cc3300", "#ff6600", "#ffee00"],
  Ocean: ["#000a1a", "#003366", "#0088cc", "#44ccff", "#ffffff"],
  Plasma: ["#0d001a", "#440066", "#aa00cc", "#ff44aa", "#ffff88"],
  Matrix: ["#000800", "#003300", "#008800", "#00dd00", "#88ff88"],
  Aurora: ["#001a0d", "#004433", "#008866", "#44dd88", "#aaffcc"],
  Inferno: ["#0d0000", "#660011", "#cc4400", "#ffaa00", "#ffff66"],
};

export function getColorFn(colors: string[], t: number): string {
  if (colors.length === 0) return "#ffffff";
  if (colors.length === 1) return colors[0];
  const clamped = Math.max(0, Math.min(1, t));
  const index = clamped * (colors.length - 1);
  const i0 = Math.floor(index);
  const i1 = Math.min(i0 + 1, colors.length - 1);
  const frac = index - i0;
  if (i0 === i1) return colors[i0];
  const c0 = parseColor(colors[i0]);
  const c1 = parseColor(colors[i1]);
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * frac);
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * frac);
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * frac);
  return `rgb(${r},${g},${b})`;
}

function parseColor(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function applyBackground(ctx: CanvasRenderingContext2D, bg: "black" | "transparent") {
  if (bg === "black") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

export function computeFFT(samples: Float32Array, fftSize: number): Float32Array {
  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);
  for (let i = 0; i < fftSize && i < samples.length; i++) {
    const windowVal = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
    real[i] = samples[i] * windowVal;
    imag[i] = 0;
  }
  const n = fftSize;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let tmp = real[i]; real[i] = real[j]; real[j] = tmp;
      tmp = imag[i]; imag[i] = imag[j]; imag[j] = tmp;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = -2 * Math.PI / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curReal = 1, curImag = 0;
      for (let j = 0; j < halfLen; j++) {
        const tReal = curReal * real[i + j + halfLen] - curImag * imag[i + j + halfLen];
        const tImag = curReal * imag[i + j + halfLen] + curImag * real[i + j + halfLen];
        real[i + j + halfLen] = real[i + j] - tReal;
        imag[i + j + halfLen] = imag[i + j] - tImag;
        real[i + j] += tReal;
        imag[i + j] += tImag;
        const nReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = nReal;
      }
    }
  }
  const magnitudes = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
  }
  return magnitudes;
}

export { applyBackground };