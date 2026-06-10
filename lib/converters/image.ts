export const IMAGE_SOURCE_FORMATS = ["png", "jpeg", "webp", "bmp", "gif", "avif", "svg", "ico"] as const;
export const IMAGE_TARGET_FORMATS = ["png", "jpeg", "webp", "bmp", "gif", "avif", "ico"] as const;
export type ImageSourceFormat = (typeof IMAGE_SOURCE_FORMATS)[number];
export type ImageTargetFormat = (typeof IMAGE_TARGET_FORMATS)[number];

const MIME_MAP: Record<ImageTargetFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
  gif: "image/gif",
  avif: "image/avif",
  ico: "image/x-icon",
};

const FILTER_MAP: Record<string, string> = {
  grayscale: "grayscale(100%)",
  sepia: "sepia(100%)",
  invert: "invert(100%)",
};

export type ImageFilter = "none" | "grayscale" | "sepia" | "invert";
export type ImageRotation = 0 | 90 | 180 | 270;

export interface ImageOptions {
  quality?: number;
  width?: number;
  height?: number;
  maintainAspect?: boolean;
  filter?: ImageFilter;
  rotate?: ImageRotation;
}

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size: number;
}

export async function getImageInfo(file: File): Promise<ImageInfo> {
  const isSvg = file.name.toLowerCase().endsWith(".svg");
  if (isSvg) {
    const text = await file.text();
    const match = text.match(/<svg[^>]*width="(\d+)"[^>]*height="(\d+)"|<svg[^>]*viewBox="(\d+)\s+(\d+)\s+(\d+)\s+(\d+)"/);
    let width = 0, height = 0;
    if (match) {
      if (match[1]) {
        width = parseInt(match[1]);
        height = parseInt(match[2]);
      } else {
        width = parseInt(match[5]);
        height = parseInt(match[6]);
      }
    }
    return { width, height, format: "svg", size: file.size };
  }
  const img = await loadImage(file);
  return { width: img.width, height: img.height, format: file.type || "unknown", size: file.size };
}

export async function convertImage(
  file: File,
  targetFormat: ImageTargetFormat,
  options?: ImageOptions,
): Promise<Blob> {
  const isSvg = file.name.toLowerCase().endsWith(".svg") || file.type === "image/svg+xml";
  const img = isSvg ? await loadSvg(file) : await loadImage(file);
  const { width, height } = computeDimensions(img, options);
  const angle = options?.rotate ?? 0;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  if (angle % 180 === 90) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.save();
  if (angle > 0) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
  } else {
    if (options?.filter && options.filter !== "none") {
      ctx.filter = FILTER_MAP[options.filter];
    }
    ctx.drawImage(img, 0, 0, width, height);
  }
  ctx.restore();

  if (targetFormat === "ico") {
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))),
        "image/png",
      );
    });
    return encodeIco(pngBlob, width, height);
  }

  const mime = MIME_MAP[targetFormat];
  const quality = targetFormat === "jpeg" || targetFormat === "webp"
    ? (options?.quality ?? 92) / 100
    : undefined;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
      mime,
      quality,
    );
  });
  return blob;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    img.src = url;
  });
}

function loadSvg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const blob = new Blob([text], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to render SVG"));
      };
      img.src = url;
    };
    reader.readAsText(file);
  });
}

function computeDimensions(
  img: HTMLImageElement,
  options?: ImageOptions,
): { width: number; height: number } {
  let { width, height } = img;
  if (!options?.width && !options?.height) return { width, height };

  const optW = options.width;
  const optH = options.height;
  const maintain = options.maintainAspect ?? true;

  if (optW && !optH) {
    width = optW;
    height = maintain ? Math.round(img.height * (optW / img.width)) : img.height;
  } else if (optH && !optW) {
    height = optH;
    width = maintain ? Math.round(img.width * (optH / img.height)) : img.width;
  } else if (optW && optH) {
    width = optW;
    height = maintain
      ? Math.round(img.height * (optW / img.width))
      : optH;
    if (maintain && height > optH) {
      height = optH;
      width = Math.round(img.width * (optH / img.height));
    }
  }

  return { width: Math.max(1, width), height: Math.max(1, height) };
}

async function encodeIco(pngBlob: Blob, width: number, height: number): Promise<Blob> {
  const pngBuf = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngBuf);

  const w = Math.min(width, 255);
  const h = Math.min(height, 255);

  const header = new Uint8Array(6 + 16);
  const view = new DataView(header.buffer);
  let off = 0;
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 1, true); off += 2;
  view.setUint16(off, 1, true); off += 2;

  const imgOff = 6 + 16;
  view.setUint8(off, w); off += 1;
  view.setUint8(off, h); off += 1;
  view.setUint8(off, 0); off += 1;
  view.setUint8(off, 0); off += 1;
  view.setUint16(off, 1, true); off += 2;
  view.setUint16(off, 32, true); off += 2;
  view.setUint32(off, pngBuf.byteLength, true); off += 4;
  view.setUint32(off, imgOff, true);

  const result = new Uint8Array(header.length + pngBuf.byteLength);
  result.set(header, 0);
  result.set(pngBytes, header.length);

  return new Blob([result], { type: "image/x-icon" });
}
