"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import { attributePng, attributeJpeg } from "@/lib/attribution";

// ──────────────────────────────
// FILTER DEFINITIONS
// ──────────────────────────────
type FilterDef = {
  id: string;
  label: string;
  jp: string;
  hasPixelSize: boolean;
};

const FILTERS: FilterDef[] = [
  { id: "normal", label: "normal", jp: "ノーマル", hasPixelSize: false },
  { id: "vintage", label: "vintage", jp: "ビンテージ", hasPixelSize: false },
  { id: "grayscale", label: "grayscale", jp: "白黒", hasPixelSize: false },
  { id: "invert", label: "invert", jp: "反転", hasPixelSize: false },
  { id: "comic", label: "comic", jp: "コミック", hasPixelSize: false },
  { id: "thermal", label: "thermal", jp: "サーマル", hasPixelSize: false },
  { id: "glitch", label: "glitch", jp: "グリッチ", hasPixelSize: false },
  { id: "pixelate", label: "pixelate", jp: "ピクセル", hasPixelSize: true },
  { id: "xray", label: "x-ray", jp: "X線", hasPixelSize: false },
  { id: "emboss", label: "emboss", jp: "エンボス", hasPixelSize: false },
  { id: "neon", label: "neon", jp: "ネオン", hasPixelSize: false },
  { id: "mirror", label: "mirror", jp: "ミラー", hasPixelSize: false },
  { id: "oil", label: "oil", jp: "油絵", hasPixelSize: false },
  { id: "kaleidoscope", label: "kaleidoscope", jp: "万華鏡", hasPixelSize: false },
  { id: "wave", label: "wave", jp: "ウェーブ", hasPixelSize: false },
  { id: "duotone", label: "duotone", jp: "デュオトーン", hasPixelSize: false },
  { id: "vhs", label: "vhs", jp: "VHS", hasPixelSize: false },
  { id: "glow", label: "glow", jp: "グロー", hasPixelSize: false },
  { id: "cartoon", label: "cartoon", jp: "カートゥーン", hasPixelSize: false },
  { id: "rainbow", label: "rainbow", jp: "レインボー", hasPixelSize: false },
];

// ──────────────────────────────
// PIXEL FILTER FUNCTIONS
// ──────────────────────────────
function applyFilter(data: ImageData, filterId: string, pixelSize: number, frameCount: number): void {
  switch (filterId) {
    case "normal": break;
    case "vintage": vintage(data); break;
    case "grayscale": grayscale(data); break;
    case "invert": invert(data); break;
    case "comic": comic(data); break;
    case "thermal": thermal(data); break;
    case "glitch": glitch(data); break;
    case "pixelate": pixelate(data, pixelSize); break;
    case "xray": xray(data); break;
    case "emboss": emboss(data); break;
    case "neon": neon(data); break;
    case "mirror": break;
    case "oil": oilFilter(data); break;
    case "kaleidoscope": kaleidoscope(data); break;
    case "wave": waveFilter(data, frameCount); break;
    case "duotone": duotone(data); break;
    case "vhs": vhsFilter(data, frameCount); break;
    case "glow": glowFilter(data); break;
    case "cartoon": cartoonFilter(data); break;
    case "rainbow": rainbowFilter(data); break;
  }
}

function grayscale(data: ImageData) {
  for (let i = 0; i < data.data.length; i += 4) {
    const gray = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    data.data[i] = data.data[i + 1] = data.data[i + 2] = gray;
  }
}

function invert(data: ImageData) {
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 255 - data.data[i];
    data.data[i + 1] = 255 - data.data[i + 1];
    data.data[i + 2] = 255 - data.data[i + 2];
  }
}

function vintage(data: ImageData) {
  const { data: pixels } = data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    pixels[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    pixels[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    pixels[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
  const w = data.width, h = data.height;
  const cx = w / 2, cy = h / 2, maxDist = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
      const factor = 1 - dist * dist * 0.4;
      pixels[i] *= factor;
      pixels[i + 1] *= factor;
      pixels[i + 2] *= factor;
    }
  }
}

function posterize(data: ImageData, levels: number) {
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = Math.round(data.data[i] / step) * step;
    data.data[i + 1] = Math.round(data.data[i + 1] / step) * step;
    data.data[i + 2] = Math.round(data.data[i + 2] / step) * step;
  }
}

function edgeDetect(data: ImageData): ImageData {
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const out = new Uint8ClampedArray(data.data.length);
  const kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let val = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          const gray = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
          val += gray * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      const oi = (y * w + x) * 4;
      val = Math.min(255, Math.max(0, val));
      out[oi] = out[oi + 1] = out[oi + 2] = val;
      out[oi + 3] = 255;
    }
  }
  return new ImageData(out, w, h);
}

function comic(data: ImageData) {
  posterize(data, 6);
  const edges = edgeDetect(data);
  for (let i = 0; i < data.data.length; i += 4) {
    const edge = edges.data[i];
    if (edge > 60) {
      data.data[i] = 0;
      data.data[i + 1] = 0;
      data.data[i + 2] = 0;
    }
  }
}

function thermal(data: ImageData) {
  const palette = [
    [0, 0, 0], [20, 0, 80], [0, 0, 255], [0, 128, 255],
    [0, 255, 255], [0, 255, 0], [128, 255, 0], [255, 255, 0],
    [255, 128, 0], [255, 0, 0], [255, 50, 100], [255, 200, 200],
  ];
  const maxIdx = palette.length - 1;
  for (let i = 0; i < data.data.length; i += 4) {
    const gray = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    const idx = Math.min(maxIdx, Math.floor((gray / 255) * maxIdx));
    data.data[i] = palette[idx][0];
    data.data[i + 1] = palette[idx][1];
    data.data[i + 2] = palette[idx][2];
  }
}

function glitch(data: ImageData) {
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const rngOffset = Math.floor(Math.random() * 15) + 3;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const ri = (y * w + Math.min(w - 1, x + rngOffset)) * 4;
      const bi = (y * w + Math.max(0, x - rngOffset)) * 4;
      data.data[i] = src[ri];
      data.data[i + 2] = src[bi];
    }
  }
  const stripCount = 3 + Math.floor(Math.random() * 4);
  for (let s = 0; s < stripCount; s++) {
    const sy = Math.floor(Math.random() * h);
    const sh = 2 + Math.floor(Math.random() * 8);
    const sx = Math.floor(Math.random() * 20) - 10;
    const nsy = Math.min(h - 1, Math.max(0, sy + Math.floor(Math.random() * 20) - 10));
    for (let yo = 0; yo < sh; yo++) {
      const srcRow = sy + yo;
      const dstRow = nsy + yo;
      if (srcRow >= h || dstRow >= h) continue;
      for (let x = 0; x < w; x++) {
        const si = (srcRow * w + x) * 4;
        if (x + sx >= 0 && x + sx < w) {
          const offsetI = (dstRow * w + Math.min(w - 1, Math.max(0, x + sx))) * 4;
          data.data[offsetI] = src[si];
          data.data[offsetI + 1] = src[si + 1];
          data.data[offsetI + 2] = src[si + 2];
        }
      }
    }
  }
}

function pixelate(data: ImageData, blockSize: number) {
  if (blockSize < 2) return;
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  for (let y = 0; y < h; y += blockSize) {
    for (let x = 0; x < w; x += blockSize) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = 0; dy < blockSize && y + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < w; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4;
          r += src[idx];
          g += src[idx + 1];
          b += src[idx + 2];
          count++;
        }
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      for (let dy = 0; dy < blockSize && y + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < w; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4;
          data.data[idx] = r;
          data.data[idx + 1] = g;
          data.data[idx + 2] = b;
        }
      }
    }
  }
}

function xray(data: ImageData) {
  invert(data);
  grayscale(data);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = Math.min(255, data.data[i] * 1.3);
    data.data[i + 1] = Math.min(255, data.data[i + 1] * 1.3);
    data.data[i + 2] = Math.min(255, data.data[i + 2] * 1.3);
  }
}

function emboss(data: ImageData) {
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          const k = kernel[(ky + 1) * 3 + (kx + 1)];
          r += src[idx] * k;
          g += src[idx + 1] * k;
          b += src[idx + 2] * k;
        }
      }
      const oi = (y * w + x) * 4;
      data.data[oi] = Math.min(255, Math.max(0, r + 128));
      data.data[oi + 1] = Math.min(255, Math.max(0, g + 128));
      data.data[oi + 2] = Math.min(255, Math.max(0, b + 128));
    }
  }
}

function sobelEdge(data: ImageData): Uint8ClampedArray {
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const out = new Uint8ClampedArray(data.data.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const tl = 0.299 * src[idx - w * 4 - 4] + 0.587 * src[idx - w * 4 - 3] + 0.114 * src[idx - w * 4 - 2];
      const tc = 0.299 * src[idx - w * 4] + 0.587 * src[idx - w * 4 + 1] + 0.114 * src[idx - w * 4 + 2];
      const tr = 0.299 * src[idx - w * 4 + 4] + 0.587 * src[idx - w * 4 + 5] + 0.114 * src[idx - w * 4 + 6];
      const ml = 0.299 * src[idx - 4] + 0.587 * src[idx - 3] + 0.114 * src[idx - 2];
      const mr = 0.299 * src[idx + 4] + 0.587 * src[idx + 5] + 0.114 * src[idx + 6];
      const bl = 0.299 * src[idx + w * 4 - 4] + 0.587 * src[idx + w * 4 - 3] + 0.114 * src[idx + w * 4 - 2];
      const bc = 0.299 * src[idx + w * 4] + 0.587 * src[idx + w * 4 + 1] + 0.114 * src[idx + w * 4 + 2];
      const br = 0.299 * src[idx + w * 4 + 4] + 0.587 * src[idx + w * 4 + 5] + 0.114 * src[idx + w * 4 + 6];
      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      out[idx] = out[idx + 1] = out[idx + 2] = mag;
      out[idx + 3] = 255;
    }
  }
  return out;
}

function neon(data: ImageData) {
  const edges = sobelEdge(data);
  for (let i = 0; i < data.data.length; i += 4) {
    const e = edges[i];
    if (e > 40) {
      data.data[i] = Math.min(255, e + 100);
      data.data[i + 1] = Math.min(255, Math.max(0, e - 50));
      data.data[i + 2] = 255;
    } else {
      data.data[i] = data.data[i] * 0.3;
      data.data[i + 1] = data.data[i + 1] * 0.3;
      data.data[i + 2] = data.data[i + 2] * 0.3;
    }
  }
}

// ── NEW CREATIVE FILTERS ──

function oilFilter(data: ImageData) {
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const radius = 3;
  const levels = 8;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const buckets: { r: number; g: number; b: number; count: number }[] = [];
      for (let li = 0; li < levels; li++) buckets.push({ r: 0, g: 0, b: 0, count: 0 });
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = Math.min(w - 1, Math.max(0, x + dx));
          const py = Math.min(h - 1, Math.max(0, y + dy));
          const idx = (py * w + px) * 4;
          const gray = Math.floor((0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2]) / 256 * levels);
          const b = buckets[Math.min(levels - 1, gray)];
          b.r += src[idx];
          b.g += src[idx + 1];
          b.b += src[idx + 2];
          b.count++;
        }
      }
      let maxCount = 0, bestIdx = 0;
      for (let li = 0; li < levels; li++) {
        if (buckets[li].count > maxCount) { maxCount = buckets[li].count; bestIdx = li; }
      }
      const best = buckets[bestIdx];
      const oi = (y * w + x) * 4;
      data.data[oi] = best.count > 0 ? best.r / best.count : 0;
      data.data[oi + 1] = best.count > 0 ? best.g / best.count : 0;
      data.data[oi + 2] = best.count > 0 ? best.b / best.count : 0;
    }
  }
}

function kaleidoscope(data: ImageData) {
  const w = data.width, h = data.height;
  const cx = w / 2, cy = h / 2;
  const segments = 8;
  const src = new Uint8ClampedArray(data.data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy;
      let angle = Math.atan2(dy, dx);
      const radius = Math.sqrt(dx * dx + dy * dy);
      const segAngle = (Math.PI * 2) / segments;
      angle = angle % segAngle;
      if (angle < 0) angle += segAngle;
      if (angle > segAngle / 2) angle = segAngle - angle;
      const sx = Math.round(cx + radius * Math.cos(angle));
      const sy = Math.round(cy + radius * Math.sin(angle));
      const si = (Math.min(h - 1, Math.max(0, sy)) * w + Math.min(w - 1, Math.max(0, sx))) * 4;
      const oi = (y * w + x) * 4;
      data.data[oi] = src[si];
      data.data[oi + 1] = src[si + 1];
      data.data[oi + 2] = src[si + 2];
    }
  }
}

function waveFilter(data: ImageData, frameCount: number) {
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const amplitude = 8;
  const frequency = 0.05;
  for (let y = 0; y < h; y++) {
    const offset = Math.sin(y * frequency + frameCount * 0.1) * amplitude;
    for (let x = 0; x < w; x++) {
      const sx = Math.min(w - 1, Math.max(0, x + offset));
      const si = (y * w + sx) * 4;
      const oi = (y * w + x) * 4;
      data.data[oi] = src[si];
      data.data[oi + 1] = src[si + 1];
      data.data[oi + 2] = src[si + 2];
    }
  }
}

function duotone(data: ImageData) {
  const c1r = 15, c1g = 15, c1b = 80;
  const c2r = 255, c2g = 200, c2b = 50;
  for (let i = 0; i < data.data.length; i += 4) {
    const gray = (0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2]) / 255;
    data.data[i] = Math.round(c1r + (c2r - c1r) * gray);
    data.data[i + 1] = Math.round(c1g + (c2g - c1g) * gray);
    data.data[i + 2] = Math.round(c1b + (c2b - c1b) * gray);
  }
}

function vhsFilter(data: ImageData, frameCount: number) {
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const jitterRows = (frameCount * 7) % h;
  const jitterAmount = Math.sin(frameCount * 0.3) * 6;
  for (let y = 0; y < h; y++) {
    const shift = (y % 5 === 0) ? Math.floor(Math.sin(y + frameCount * 0.5) * 5) : 0;
    if (shift !== 0) {
      for (let x = 0; x < w; x++) {
        const sx = Math.min(w - 1, Math.max(0, x + shift));
        const si = (y * w + sx) * 4;
        const oi = (y * w + x) * 4;
        data.data[oi] = src[si];
        data.data[oi + 1] = src[si + 1];
        data.data[oi + 2] = src[si + 2];
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const bleed = 3;
      const ri = (y * w + Math.min(w - 1, x + bleed)) * 4;
      const bi = (y * w + Math.max(0, x - bleed)) * 4;
      data.data[i] = data.data[i] * 0.5 + src[ri] * 0.5;
      data.data[i + 2] = data.data[i + 2] * 0.5 + src[bi] * 0.5;
    }
  }
}

function glowFilter(data: ImageData) {
  const w = data.width, h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const radius = 4;
  const threshold = 150;
  const bright = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const brightness = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
    bright[i] = brightness > threshold ? brightness - threshold : 0;
  }
  const blurred = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = x + dx, py = y + dy;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            sum += bright[py * w + px];
            count++;
          }
        }
      }
      blurred[y * w + x] = sum / count;
    }
  }
  for (let i = 0; i < data.data.length; i += 4) {
    const gi = i / 4;
    const glowVal = blurred[gi] * 1.5;
    data.data[i] = Math.min(255, src[i] + glowVal);
    data.data[i + 1] = Math.min(255, src[i + 1] + glowVal);
    data.data[i + 2] = Math.min(255, src[i + 2] + glowVal);
  }
}

function cartoonFilter(data: ImageData) {
  const levels = 5;
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = Math.round(data.data[i] / step) * step;
    data.data[i + 1] = Math.round(data.data[i + 1] / step) * step;
    data.data[i + 2] = Math.round(data.data[i + 2] / step) * step;
  }
  const edges = sobelEdge(data);
  for (let i = 0; i < data.data.length; i += 4) {
    const e = edges[i];
    if (e > 80) {
      data.data[i] = Math.max(0, data.data[i] - e * 0.5);
      data.data[i + 1] = Math.max(0, data.data[i + 1] - e * 0.5);
      data.data[i + 2] = Math.max(0, data.data[i + 2] - e * 0.5);
    }
  }
}

function rainbowFilter(data: ImageData) {
  const w = data.width;
  for (let i = 0; i < data.data.length; i += 4) {
    const x = (i / 4) % w;
    const r = data.data[i] / 255, g = data.data[i + 1] / 255, b = data.data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) continue;
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    h = (h + (x / w) * 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x2 = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r1 = 0, g1 = 0, b1 = 0;
    if (h < 60) { r1 = c; g1 = x2; }
    else if (h < 120) { r1 = x2; g1 = c; }
    else if (h < 180) { g1 = c; b1 = x2; }
    else if (h < 240) { g1 = x2; b1 = c; }
    else if (h < 300) { r1 = x2; b1 = c; }
    else { r1 = c; b1 = x2; }
    data.data[i] = Math.round((r1 + m) * 255);
    data.data[i + 1] = Math.round((g1 + m) * 255);
    data.data[i + 2] = Math.round((b1 + m) * 255);
  }
}

// ──────────────────────────────
// GRID LAYOUTS
// ──────────────────────────────
const GRID_LAYOUTS = [
  { label: "1×1", rows: 1, cols: 1 },
  { label: "2×2", rows: 2, cols: 2 },
  { label: "3×3", rows: 3, cols: 3 },
  { label: "3×2", rows: 3, cols: 2 },
  { label: "2×3", rows: 2, cols: 3 },
  { label: "4×3", rows: 4, cols: 3 },
];

function getFilterLabel(id: string): string {
  return FILTERS.find((f) => f.id === id)?.label ?? id;
}

// ──────────────────────────────
// COMPONENT
// ──────────────────────────────
export default function PhotoBoothPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "active" | "error">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(8);
  const [captures, setCaptures] = useState<string[]>([]);
  const [snapping, setSnapping] = useState(false);
  const [gridLayout, setGridLayout] = useState({ rows: 1, cols: 1 });
  const [cellFilters, setCellFilters] = useState<string[]>(["normal"]);
  const [selectedCell, setSelectedCell] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const frameIdRef = useRef(0);
  const frameCountRef = useRef(0);
  const cellCountRef = useRef(1);
  const cellFiltersRef = useRef(cellFilters);
  const gridLayoutRef = useRef(gridLayout);
  const cameraStatusRef = useRef(cameraStatus);

  cellFiltersRef.current = cellFilters;
  gridLayoutRef.current = gridLayout;
  cameraStatusRef.current = cameraStatus;
  cellCountRef.current = gridLayout.rows * gridLayout.cols;

  const showPixelSize = useMemo(() => cellFilters.some((f) => f === "pixelate"), [cellFilters]);

  // ── Camera ──
  const startCamera = useCallback(async () => {
    setCameraStatus("requesting");
    setCameraError(null);
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
        ...(selectedDevice ? { deviceId: { exact: selectedDevice } } : {}),
      },
      audio: false,
    };
    console.log("[photo-booth] requesting camera with constraints:", JSON.stringify(constraints));
    try {
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[photo-booth] getUserMedia resolved, stream id:", s.id, "tracks:", s.getVideoTracks().length);
      setStream(s);
      const videoEl = videoRef.current;
      console.log("[photo-booth] video element exists:", !!videoEl, "dimensions:", videoEl?.videoWidth, videoEl?.videoHeight);
      if (videoEl) {
        videoEl.srcObject = s;
        console.log("[photo-booth] srcObject assigned, readyState:", videoEl.readyState);
      }
      setCameraStatus("active");
      const all = await navigator.mediaDevices.enumerateDevices();
      console.log("[photo-booth] enumerated devices:", all.length, "video inputs:", all.filter((d) => d.kind === "videoinput").length);
      setDevices(all.filter((d) => d.kind === "videoinput"));
    } catch (err: any) {
      console.error("[photo-booth] getUserMedia failed:", { name: err.name, message: err.message, stack: err.stack, constraints: JSON.stringify(constraints) });
      setCameraStatus("error");
      if (err.name === "NotAllowedError") setCameraError("camera permission denied");
      else if (err.name === "NotFoundError") setCameraError("no camera found");
      else if (err.name === "NotReadableError") setCameraError("camera in use by another app");
      else if (err.name === "OverconstrainedError") setCameraError("camera does not support requested resolution");
      else setCameraError(err.message || "camera error");
    }
  }, [selectedDevice]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraStatus("idle");
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stream]);

  const switchDevice = useCallback(
    (deviceId: string) => {
      setSelectedDevice(deviceId);
      if (cameraStatus === "active") {
        stopCamera();
        setTimeout(() => startCamera(), 100);
      }
    },
    [cameraStatus, stopCamera, startCamera]
  );

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // ── Grid ──
  const changeGrid = useCallback((rows: number, cols: number) => {
    const newCount = rows * cols;
    setCellFilters((prev) => {
      if (prev.length === newCount) return prev;
      if (prev.length < newCount) {
        return [...prev, ...Array(newCount - prev.length).fill("normal")];
      }
      return prev.slice(0, newCount);
    });
    setGridLayout({ rows, cols });
    setSelectedCell((prev) => Math.min(prev, newCount - 1));
  }, []);

  const setCellFilter = useCallback((filterId: string) => {
    setCellFilters((prev) => {
      const next = [...prev];
      next[selectedCell] = filterId;
      return next;
    });
  }, [selectedCell]);

  // ── Rendering loop ──
  useEffect(() => {
    if (cameraStatus !== "active") {
      if (frameIdRef.current) { cancelAnimationFrame(frameIdRef.current); frameIdRef.current = 0; }
      return;
    }

    if (!srcCanvasRef.current) {
      srcCanvasRef.current = document.createElement("canvas");
    }
    const srcCanvas = srcCanvasRef.current;
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true })!;

    let lastPw = 0, lastPh = 0;

    const loop = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        frameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw === 0 || vh === 0) {
        frameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // Use camera's native resolution for full quality
      let pw = vw, ph = vh;

      // Resize canvases if aspect ratio changed
      if (pw !== lastPw || ph !== lastPh) {
        srcCanvas.width = pw;
        srcCanvas.height = ph;
        lastPw = pw;
        lastPh = ph;
        // Update all cell canvases
        const cellCount = gridLayoutRef.current.rows * gridLayoutRef.current.cols;
        for (let i = 0; i < cellCount; i++) {
          const c = cellCanvasRefs.current[i];
          if (c) { c.width = pw; c.height = ph; }
        }
      }

      const rows = gridLayoutRef.current.rows;
      const cols = gridLayoutRef.current.cols;
      const cellCount = rows * cols;
      const filters = cellFiltersRef.current;

      frameCountRef.current++;

      const throttle = cellCount <= 1 ? 1 : cellCount <= 4 ? 2 : cellCount <= 6 ? 3 : 4;
      if (frameCountRef.current % throttle !== 0) {
        frameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      srcCtx.drawImage(video, 0, 0, pw, ph);

      for (let i = 0; i < cellCount; i++) {
        const canvas = cellCanvasRefs.current[i];
        if (!canvas) continue;
        const ctx = canvas.getContext("2d")!;
        const fid = filters[i] ?? "normal";

        if (fid === "normal") {
          ctx.drawImage(srcCanvas, 0, 0, canvas.width, canvas.height);
        } else if (fid === "mirror") {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(srcCanvas, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
        } else {
          const data = srcCtx.getImageData(0, 0, pw, ph);
          applyFilter(data, fid, pixelSize, frameCountRef.current);
          ctx.putImageData(data, 0, 0);
        }
      }

      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [cameraStatus, pixelSize]);

  // ── Capture ──
  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || cameraStatus !== "active") return;
    setSnapping(true);
    setTimeout(() => setSnapping(false), 150);

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return;

    const canvas = captureCanvasRef.current!;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    const fid = cellFilters[selectedCell] ?? "normal";

    if (fid === "mirror") {
      ctx.scale(-1, 1);
      ctx.drawImage(video, -w, 0, w, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      ctx.drawImage(video, 0, 0, w, h);
    }

    if (fid !== "normal" && fid !== "mirror") {
      const imgData = ctx.getImageData(0, 0, w, h);
      applyFilter(imgData, fid, pixelSize, frameCountRef.current);
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL("image/png");
    setCaptures((prev) => [dataUrl, ...prev].slice(0, 10));
  }, [cameraStatus, cellFilters, selectedCell, pixelSize]);

  // ── Download ──
  const downloadCapture = useCallback(async (dataUrl: string, ext: "png" | "jpg") => {
    if (ext === "png") {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const attributed = await attributePng(blob);
      const link = document.createElement("a");
      link.download = `photobooth_${Date.now()}.png`;
      link.href = URL.createObjectURL(attributed);
      link.click();
    } else {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const attributed = await attributeJpeg(blob);
      const link = document.createElement("a");
      link.download = `photobooth_${Date.now()}.jpg`;
      link.href = URL.createObjectURL(attributed);
      link.click();
    }
  }, []);

  const cellCount = gridLayout.rows * gridLayout.cols;

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="photo-booth" jp="フォトブース" category="images" href="/images/photo-booth" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <button className="text-[10px] tracking-[0.3em] text-white/50 hover:text-white transition-colors uppercase border border-white/10 px-3 py-2 bg-white/5">
            v0.2
          </button>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* ─── SIDEBAR ─── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. CAMERA */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. camera{" "}
                <ScrambleText text="カメラ" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              {cameraStatus === "requesting" ? (
                <button disabled className="w-full border border-white/10 p-4 text-[10px] uppercase tracking-widest text-white/20 cursor-not-allowed">
                  requesting…
                </button>
              ) : cameraStatus === "idle" || cameraStatus === "error" ? (
                <button
                  onClick={startCamera}
                  className="w-full border border-white/10 p-4 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all"
                >
                  start_camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="w-full border border-white/10 p-4 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all"
                >
                  stop_camera
                </button>
              )}
              {cameraStatus === "active" && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] tracking-widest uppercase text-green-400">live</span>
                </div>
              )}
              {cameraStatus === "error" && cameraError && (
                <div className="text-[10px] tracking-widest uppercase text-red-400">{cameraError}</div>
              )}
              {devices.length > 1 && (
                <select
                  value={selectedDevice}
                  onChange={(e) => switchDevice(e.target.value)}
                  className="w-full bg-transparent border border-white/10 text-[10px] text-white/50 px-3 py-2 outline-none focus:border-white/40 uppercase tracking-widest"
                >
                  <option value="">default camera</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-black text-white/70">
                      {d.label || `camera ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              )}
            </section>

            {/* 02. GRID */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. grid{" "}
                <ScrambleText text="グリッド" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex flex-wrap gap-2">
                {GRID_LAYOUTS.map((gl) => (
                  <button
                    key={gl.label}
                    onClick={() => changeGrid(gl.rows, gl.cols)}
                    className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${gridLayout.rows === gl.rows && gridLayout.cols === gl.cols
                      ? "bg-white text-black border-white font-bold"
                      : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                      }`}
                  >
                    {gl.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 03. FILTERS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. filters{" "}
                <ScrambleText text="フィルター" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="text-[9px] tracking-widest uppercase text-white/25 mb-2">
                cell: {selectedCell + 1} — {getFilterLabel(cellFilters[selectedCell] ?? "normal")}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCellFilter(f.id)}
                    className={`text-[10px] px-2 py-2 border tracking-[0.1em] transition-all ${cellFilters[selectedCell] === f.id
                      ? "bg-white text-black border-white font-bold"
                      : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 04. PIXEL SIZE */}
            {showPixelSize && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  04. pixel size{" "}
                  <ScrambleText text="ピクセルサイズ" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={24}
                    step={2}
                    value={pixelSize}
                    onChange={(e) => setPixelSize(Number(e.target.value))}
                    className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-white/50 font-mono w-6 text-right">{pixelSize}</span>
                </div>
              </section>
            )}

            {/* 05. CAPTURE */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                05. capture{" "}
                <ScrambleText text="撮影" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <button
                onClick={capture}
                disabled={cameraStatus !== "active"}
                className={`w-full aspect-square max-w-[120px] mx-auto rounded-full border-2 border-white/50 flex items-center justify-center transition-all ${snapping ? "scale-95 border-white brightness-150" : "hover:border-white hover:bg-white/5"
                  } disabled:opacity-20 disabled:cursor-not-allowed`}
              >
                <div className="w-10 h-10 rounded-full bg-white" />
              </button>
              {cameraStatus !== "active" && (
                <div className="text-[9px] tracking-widest uppercase text-white/30 text-center">
                  start camera first
                </div>
              )}
            </section>
          </motion.aside>

          {/* ─── MAIN PANE ─── */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative lg:col-span-8 flex flex-col items-center gap-6 bg-white/2 border border-white/5 min-h-[60vh] p-4 sm:p-8"
          >
            {/* Video source - invisible but full-size so browser initializes stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              onLoadedMetadata={() => console.log("[photo-booth] video loadedMetadata, dims:", videoRef.current?.videoWidth, videoRef.current?.videoHeight)}
              onError={() => console.error("[photo-booth] video element error:", videoRef.current?.error?.message)}
            />

            {cameraStatus === "idle" && (
              <ScrambleText text="start_camera_to_begin" className="text-white/10 text-xs tracking-[0.5em] italic my-auto" />
            )}
            {cameraStatus === "requesting" && (
              <ScrambleText text="requesting_camera…" className="text-white/20 text-xs tracking-[0.5em] italic my-auto" />
            )}
            {cameraStatus === "error" && (
              <div className="text-center my-auto">
                <div className="text-red-400/60 text-xs tracking-[0.3em] uppercase mb-2">camera_error</div>
                <div className="text-red-400/40 text-[10px]">{cameraError}</div>
              </div>
            )}

            {/* Canvas grid */}
            {cameraStatus === "active" && (
              <div
                className="w-full max-w-[100%] mx-auto"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
                  gap: "4px",
                }}
              >
                {Array.from({ length: cellCount }).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedCell(i)}
                    className={`relative cursor-pointer transition-all ${selectedCell === i
                      ? "ring-2 ring-white"
                      : "ring-1 ring-white/10 hover:ring-white/30"
                      }`}
                  >
                    <canvas
                      ref={(el) => { cellCanvasRefs.current[i] = el; }}
                      className="w-full block"
                    />
                    <div className="absolute bottom-0.5 left-0.5 text-[7px] leading-none text-white/60 uppercase px-0.5 bg-black/50">
                      {getFilterLabel(cellFilters[i] ?? "normal")}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Captured photo strip */}
            {captures.length > 0 && (
              <div className="w-full max-w-[700px] mx-auto space-y-3">
                <div className="text-[9px] tracking-[0.3em] uppercase text-white/30">captures</div>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {captures.map((dataUrl, i) => (
                    <div key={`${i}-${dataUrl.slice(-20)}`} className="relative group shrink-0">
                      <img
                        src={dataUrl}
                        alt={`capture ${i + 1}`}
                        className="h-24 w-auto border border-white/10 bg-black"
                      />
                      <div className="absolute inset-0 flex items-end justify-center gap-1 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadCapture(dataUrl, "png")}
                          className="text-[8px] px-1.5 py-0.5 bg-white/80 text-black uppercase tracking-widest hover:bg-white transition-all"
                        >
                          png
                        </button>
                        <button
                          onClick={() => downloadCapture(dataUrl, "jpg")}
                          className="text-[8px] px-1.5 py-0.5 bg-white/80 text-black uppercase tracking-widest hover:bg-white transition-all"
                        >
                          jpg
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setCaptures([])}
                  className="text-[9px] tracking-[0.3em] uppercase text-white/30 hover:text-white/60 transition-colors"
                >
                  clear_all
                </button>
              </div>
            )}

            <canvas ref={captureCanvasRef} className="hidden" />
          </motion.main>
        </div>
      </div>
    </div>
  );
}
