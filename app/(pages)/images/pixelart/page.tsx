"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import { freecolors, premiumcolors } from "@/public/data/colors";
import Navbar from "@/components/ui/Navbar";
import CustomColorPicker from "@/components/ColorPicker";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";

type ColorData = Record<string, string | undefined>;

const getHex = (obj: ColorData): string => {
  const values = Object.values(obj).filter((v) => v !== undefined);
  return (values[0] as string) || "#000000";
};

const getColorDistance = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
) => {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

const getNearestColor = (
  r: number,
  g: number,
  b: number,
  palette: string[],
) => {
  let minDistance = Infinity;
  let closest = { r: 0, g: 0, b: 0 };
  palette.forEach((hex) => {
    const pr = parseInt(hex.slice(1, 3), 16);
    const pg = parseInt(hex.slice(3, 5), 16);
    const pb = parseInt(hex.slice(5, 7), 16);
    const dist = getColorDistance(r, g, b, pr, pg, pb);
    if (dist < minDistance) {
      minDistance = dist;
      closest = { r: pr, g: pg, b: pb };
    }
  });
  return closest;
};

export default function PixelArtGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Replaced pixelSize with targetWidth as the master source of truth
  const [targetWidth, setTargetWidth] = useState<number>(64);
  const [widthInput, setWidthInput] = useState<string>("64");

  const [totalPixelCount, setTotalPixelCount] = useState(0);
  const [useDithering, setUseDithering] = useState(true);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [enabledPresets, setEnabledPresets] = useState<string[]>([]);
  const [customPalette, setCustomPalette] = useState<string[]>([
    "#000000",
    "#ffffff",
  ]);

  const jpchars = useMemo(() => jpcharlist, []);

  // When a new image is loaded, establish a default block width
  useEffect(() => {
    if (image) {
      const initialWidth = Math.max(1, Math.floor(image.width / 8));
      setTargetWidth(initialWidth);
      setWidthInput(initialWidth.toString());
    }
  }, [image]);

  const handleWidthChange = (val: string) => {
    setWidthInput(val); // Always update visual text first so typing feels natural

    if (!image || val === "") return;

    const numericVal = parseInt(val, 10);
    if (!isNaN(numericVal) && numericVal > 0) {
      // Allow exact precision up to the max boundary
      const clampedW = Math.min(numericVal, image.width);
      setTargetWidth(clampedW);
    }
  };

  const handleWidthBlur = () => {
    if (!image) return;
    const numericVal = parseInt(widthInput, 10);
    // Correct empty or invalid states on blur
    if (isNaN(numericVal) || numericVal <= 0) {
      setWidthInput(targetWidth.toString());
    } else if (numericVal > image.width) {
      setWidthInput(image.width.toString());
      setTargetWidth(image.width);
    } else {
      setWidthInput(targetWidth.toString()); // Re-sync in case of leading zeros
    }
  };

  useEffect(() => {
    setEnabledPresets([
      ...(freecolors as ColorData[]).map(getHex),
      ...(premiumcolors as ColorData[]).map(getHex),
    ]);
  }, []);

  const activePalette = useMemo(
    () => (isAdvanced ? customPalette : enabledPresets),
    [isAdvanced, customPalette, enabledPresets],
  );

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleFileDrop = useCallback((file: File) => {
    processFile(file);
  }, [processFile]);

  // --- Multi-Select Logic ---
  const toggleGroup = (group: any[]) => {
    const groupHexes = group.map(getHex);
    const allIn = groupHexes.every((h) => enabledPresets.includes(h));

    if (allIn) {
      setEnabledPresets((prev) => prev.filter((h) => !groupHexes.includes(h)));
    } else {
      setEnabledPresets((prev) =>
        Array.from(new Set([...prev, ...groupHexes])),
      );
    }
  };

  const processImage = () => {
    if (!image || !canvasRef.current || activePalette.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Use absolute targetWidth instead of downsampling scale factor
    const w = targetWidth;
    const h = Math.max(1, Math.floor(image.height * (w / image.width)));

    if (w < 1 || h < 1) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tCtx = tempCanvas.getContext("2d")!;

    tCtx.drawImage(image, 0, 0, w, h);

    let imgData = tCtx.getImageData(0, 0, w, h);

    applyPaletteLogic(imgData, activePalette, useDithering);

    tCtx.putImageData(imgData, 0, 0);

    // Ensure our output blocks stay mathematically perfectly uniform by
    // rendering out to the closest integer scaled version of the original.
    const displayScale = Math.max(1, Math.round(image.width / w));
    canvas.width = w * displayScale;
    canvas.height = h * displayScale;

    setTotalPixelCount(w * h);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    processImage();
  }, [image, targetWidth, activePalette, useDithering]);

  // Derived display scale for the slider based on the exact user width
  const currentScale = image
    ? Math.max(1, Math.round(image.width / targetWidth))
    : 8;

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden">
      <FileDropZone onDrop={handleFileDrop}>
      <Navbar title="pixel-art" jp="ドット絵" category="images" href="/images/pixelart" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <button
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="text-[10px] tracking-[0.3em] text-white/50 hover:text-white transition-colors uppercase border border-white/10 px-6 py-2 bg-white/5"
          >
            {isAdvanced ? "exit_advanced" : "enter_advanced"}
          </button>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. SOURCE */}
            <section>
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. source{" "}
                <ScrambleText
                  text={"源泉"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay={true}
                  className="text-sm text-white/35 transition-colors"
                />
              </div>
              <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                <span className="text-xs text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">
                  upload_image
                </span>
                <input type="file" onChange={handleUpload} className="hidden" />
              </label>
            </section>

            {/* 02. CONFIG */}
            <section className="space-y-6">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase">
                02. config{" "}
                <ScrambleText
                  text={"設定"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay={true}
                  className="text-sm text-white/35 transition-colors"
                />
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[12px] text-white/40 uppercase tracking-widest">
                    <span>Scale</span>
                    <div>
                      <span>width: </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={widthInput}
                        placeholder="0"
                        onChange={(e) => handleWidthChange(e.target.value)}
                        onBlur={handleWidthBlur}
                        className="w-12 mr-2 text-right focus:outline-none focus:ring-0 border-b"
                      />
                      <span>px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={currentScale}
                    onChange={(e) => {
                      if (!image) return;
                      const scale = Number(e.target.value);
                      const newW = Math.max(1, Math.floor(image.width / scale));
                      setTargetWidth(newW);
                      setWidthInput(newW.toString());
                    }}
                    className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer hover:bg-white/20 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={() => setUseDithering(!useDithering)}
                className="flex items-center gap-4 group"
              >
                <div
                  className={`w-4 h-4 border border-white/20 transition-all ${useDithering ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-transparent"}`}
                />
                <span
                  className={`text-[10px] tracking-widest uppercase transition-colors ${useDithering ? "text-white" : "text-white/30"}`}
                >
                  dither_enabled
                </span>
              </button>
            </section>

            {/* 03. PALETTE */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase">
                03. palette{" "}
                <ScrambleText
                  text={"パレット"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay={true}
                  className="text-sm text-white/35 transition-colors"
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto pr-4 space-y-8 custom-scrollbar">
                {isAdvanced ? (
                  <div className="space-y-6 bg-black text-white">
                    <div className="text-[12px] text-white/50 uppercase tracking-widest font-bold">
                      Custom Palette
                    </div>

                    <div className="-mt-2 grid grid-cols-16 gap-1.5">
                      {customPalette.map((color, i) => (
                        <div key={i} className="group relative">
                          <CustomColorPicker
                            color={color}
                            onChange={(newColor) => {
                              const nextPalette = [...customPalette];
                              nextPalette[i] = newColor;
                              setCustomPalette(nextPalette);
                            }}
                          />

                          <button
                            onClick={() => {
                              const nextPalette = customPalette.filter(
                                (_, index) => index !== i,
                              );
                              setCustomPalette(nextPalette);
                            }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-800 text-white/80 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                            title="Remove color"
                          />
                        </div>
                      ))}

                      <button
                        onClick={() =>
                          setCustomPalette([...customPalette, "#3b82f6"])
                        }
                        className="aspect-square flex items-center justify-center border-2 border-dashed border-white/10 text-white/30 hover:border-white/40 hover:text-white transition-all text-2xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* FREE COLORS */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-[12px] text-white/50 uppercase tracking-widest font-bold">
                          free_palette
                        </div>
                        <button
                          onClick={() => toggleGroup(freecolors)}
                          className="text-[10px] text-white/40 hover:text-white uppercase tracking-tighter border-b border-white/10 pb-0.5 cursor-pointer"
                        >
                          add/remove all
                        </button>
                      </div>
                      <div className="grid grid-cols-16 gap-1.5">
                        {(freecolors as ColorData[]).map((c, i) => {
                          const h = getHex(c);
                          const active = enabledPresets.includes(h);
                          return (
                            <button
                              key={i}
                              onClick={() =>
                                setEnabledPresets(
                                  active
                                    ? enabledPresets.filter((x) => x !== h)
                                    : [...enabledPresets, h],
                                )
                              }
                              className={`aspect-square border scale-92 transition-all cursor-pointer ${active ? "border-white scale-100 z-10" : "border-transparent opacity-20 hover:opacity-100"}`}
                              style={{ backgroundColor: h }}
                              title={Object.keys(c)[0]}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* PREMIUM COLORS */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-[12px] text-white/50 uppercase tracking-widest font-bold">
                          premium_palette
                        </div>
                        <button
                          onClick={() => toggleGroup(premiumcolors)}
                          className="text-[10px] text-white/40 hover:text-white uppercase tracking-tighter border-b border-white/10 pb-0.5 cursor-pointer"
                        >
                          add/remove all
                        </button>
                      </div>
                      <div className="grid grid-cols-16 gap-1.5">
                        {(premiumcolors as ColorData[]).map((c, i) => {
                          const h = getHex(c);
                          const active = enabledPresets.includes(h);
                          return (
                            <button
                              key={i}
                              onClick={() =>
                                setEnabledPresets(
                                  active
                                    ? enabledPresets.filter((x) => x !== h)
                                    : [...enabledPresets, h],
                                )
                              }
                              className={`aspect-square border scale-92 transition-all cursor-pointer ${active ? "border-white scale-100 z-10" : "border-transparent opacity-20 hover:opacity-100"}`}
                              style={{ backgroundColor: h }}
                              title={Object.keys(c)[0]}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col items-center justify-center bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {image ? (
              <div className="relative group">
                <canvas
                  ref={canvasRef}
                  style={{ imageRendering: "pixelated" }}
                  className="max-w-[60vw] w-auto max-h-[74vh]"
                />
                <div className="mt-6 flex justify-between items-center opacity-100 transition-opacity">
                  <span className="text-[16px] uppercase tracking-widest text-white/50">
                    PIXEL COUNT: {totalPixelCount}
                  </span>
                  <button
                    onClick={() => {
                      if (!canvasRef.current || !image) return;

                      // 1. Create a "source of truth" hidden canvas at the actual target resolution
                      const downloadCanvas = document.createElement("canvas");
                      const w = targetWidth;
                      const h = Math.max(
                        1,
                        Math.floor(image.height * (w / image.width)),
                      );

                      downloadCanvas.width = w;
                      downloadCanvas.height = h;
                      const dCtx = downloadCanvas.getContext("2d")!;

                      // 2. Draw the original image to this small canvas
                      dCtx.drawImage(image, 0, 0, w, h);

                      // 3. Apply your pixel/palette logic to this small image
                      const imgData = dCtx.getImageData(0, 0, w, h);
                      applyPaletteLogic(imgData, activePalette, useDithering);
                      dCtx.putImageData(imgData, 0, 0);

                      // 4. Trigger download
                      const link = document.createElement("a");
                      link.download = `pixelart_${w}x${h}.png`;
                      link.href = downloadCanvas.toDataURL("image/png");
                      link.click();
                    }}
                    className="text-[16px] uppercase tracking-widest border-b border-white/20 text-white/50 hover:text-white cursor-pointer"
                  >
                    download_png
                  </button>
                </div>
              </div>
            ) : (
              <ScrambleText
                text="null_data_idle"
                className="text-white/10 text-xs tracking-[0.5em] italic"
              />
            )}
          </motion.main>
        </div>
      </div>
      </FileDropZone>
    </div>
  );
}

// --- Image Engine ---
function applyPaletteLogic(
  imgData: ImageData,
  palette: string[],
  useDithering: boolean,
) {
  const d = imgData.data;
  const w = imgData.width;
  const h = imgData.height;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 128) {
        d[i + 3] = 0;
        continue;
      }

      const oldR = d[i],
        oldG = d[i + 1],
        oldB = d[i + 2];
      const {
        r: newR,
        g: newG,
        b: newB,
      } = getNearestColor(oldR, oldG, oldB, palette);

      d[i] = newR;
      d[i + 1] = newG;
      d[i + 2] = newB;
      d[i + 3] = 255;

      if (useDithering) {
        const errR = oldR - newR,
          errG = oldG - newG,
          errB = oldB - newB;
        distributeError(d, x + 1, y, w, errR, errG, errB, 7 / 16);
        distributeError(d, x - 1, y + 1, w, errR, errG, errB, 3 / 16);
        distributeError(d, x, y + 1, w, errR, errG, errB, 5 / 16);
        distributeError(d, x + 1, y + 1, w, errR, errG, errB, 1 / 16);
      }
    }
  }
}

function distributeError(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  w: number,
  errR: number,
  errG: number,
  errB: number,
  weight: number,
) {
  if (x < 0 || x >= w) return;
  const i = (y * w + x) * 4;
  if (i < 0 || i >= data.length) return;
  data[i] += errR * weight;
  data[i + 1] += errG * weight;
  data[i + 2] += errB * weight;
}
