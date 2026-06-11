"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getImageInfo } from "@/lib/converters/image";

type ImageFormat = "jpeg" | "png" | "webp";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageResizer() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<{ width: number; height: number; size: number; format: string } | null>(null);

  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [aspectLock, setAspectLock] = useState(true);
  const [format, setFormat] = useLocalStorage<ImageFormat>("runen:resizer-format", "jpeg");
  const [quality, setQuality] = useState(92);
  const [liveEstimate, setLiveEstimate] = useState<string>("");

  const [enableTargetSize, setEnableTargetSize] = useState(false);
  const [targetSize, setTargetSize] = useState<number>(200);
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("KB");
  const [optimizing, setOptimizing] = useState(false);

  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultDimensions, setResultDimensions] = useState<{ w: number; h: number } | null>(null);
  const [compareMode, setCompareMode] = useState<"side" | "slider">("side");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderFrameRef = useRef<number>(0);

  const jpchars = useMemo(() => jpcharlist, []);

  const presetSizes = [1920, 1280, 800, 400];

  const processFile = useCallback((file: File) => {
    setSourceFile(file);
    setResultBlob(null);
    setResultUrl(null);
    setResultDimensions(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setSourcePreview(dataUrl);
      const info = await getImageInfo(file);
      setSourceInfo(info);
      setWidth(info.width);
      setHeight(info.height);
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

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (aspectLock && sourceInfo) {
      setHeight(Math.round(val / (sourceInfo.width / sourceInfo.height)));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (aspectLock && sourceInfo) {
      setWidth(Math.round(val * (sourceInfo.width / sourceInfo.height)));
    }
  };

  const applyPreset = (pw: number) => {
    if (!sourceInfo) return;
    const ratio = sourceInfo.width / sourceInfo.height;
    setWidth(pw);
    setHeight(Math.round(pw / ratio));
  };

  const encodeImage = useCallback(
    (w: number, h: number, fmt: ImageFormat, q: number): Promise<Blob | null> => {
      return new Promise((resolve) => {
        if (!sourcePreview || !canvasRef.current) return resolve(null);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        canvas.width = w;
        canvas.height = h;

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h);
          const mimeMap: Record<ImageFormat, string> = {
            jpeg: "image/jpeg",
            webp: "image/webp",
            png: "image/png",
          };
          const mime = mimeMap[fmt];
          const qualityVal = fmt === "png" ? undefined : q / 100;
          canvas.toBlob((blob) => resolve(blob), mime, qualityVal);
        };
        img.src = sourcePreview;
      });
    },
    [sourcePreview],
  );

  const optimizeToTargetSize = useCallback(
    async (maxW: number, maxH: number, fmt: ImageFormat, targetBytes: number): Promise<Blob | null> => {
      let bestBlob: Blob | null = null;

      let lo = 1, hi = 100;
      for (let iter = 0; iter < 12; iter++) {
        const mid = Math.floor((lo + hi) / 2);
        const blob = await encodeImage(maxW, maxH, fmt, mid);
        if (!blob) continue;
        if (blob.size <= targetBytes) {
          bestBlob = blob;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      if (!bestBlob || bestBlob.size > targetBytes) {
        let scale = 0.9;
        while (scale > 0.1) {
          const w = Math.floor(maxW * scale);
          const h = Math.floor(maxH * scale);
          const blob = await encodeImage(w, h, fmt, 1);
          if (blob && blob.size <= targetBytes) {
            bestBlob = blob;
            break;
          }
          scale -= 0.1;
        }
      }

      return bestBlob;
    },
    [encodeImage],
  );

  const processImage = useCallback(async () => {
    if (!sourceFile || !sourcePreview || !sourceInfo) return;

    const fmt = enableTargetSize ? (format === "png" ? "jpeg" : format) : format;
    const targetBytes = enableTargetSize
      ? targetUnit === "KB" ? targetSize * 1024 : targetSize * 1024 * 1024
      : Infinity;

    let blob: Blob | null = null;
    let outW = width;
    let outH = height;

    if (enableTargetSize && targetBytes < Infinity) {
      setOptimizing(true);
      blob = await optimizeToTargetSize(outW, outH, fmt as ImageFormat, targetBytes);
      setOptimizing(false);
    }

    if (!blob) {
      blob = await encodeImage(outW, outH, fmt as ImageFormat, quality);
    }

    if (!blob) return;

    setResultBlob(blob);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const url = URL.createObjectURL(blob);
    setResultUrl(url);
    setResultDimensions({ w: outW, h: outH });
    setSliderPos(50);
  }, [sourceFile, sourcePreview, sourceInfo, width, height, format, quality, enableTargetSize, targetSize, targetUnit, encodeImage, optimizeToTargetSize, resultUrl]);

  const estimateSize = useCallback(async () => {
    if (!sourcePreview) return;
    const blob = await encodeImage(width, height, format, quality);
    if (blob) setLiveEstimate(formatBytes(blob.size));
  }, [sourcePreview, width, height, format, quality, encodeImage]);

  useEffect(() => {
    const timer = setTimeout(estimateSize, 300);
    return () => clearTimeout(timer);
  }, [estimateSize]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const extMap: Record<ImageFormat, string> = { jpeg: "jpg", png: "png", webp: "webp" };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(resultBlob);
    a.download = `resized_${width}x${height}.${extMap[format]}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleSliderMove = useCallback((clientX: number) => {
    const container = comparisonRef.current;
    if (!container) return;
    cancelAnimationFrame(sliderFrameRef.current);
    sliderFrameRef.current = requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(0, Math.min(100, pct)));
    });
  }, []);

  const reduction = sourceInfo && resultBlob
    ? `${((1 - resultBlob.size / sourceInfo.size) * 100).toFixed(0)}%`
    : "";

  return (
    <div className="h-dvh w-full bg-black overflow-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleFileDrop}>
      <Navbar title="resizer" jp="リサイザー" category="images" href="/images/resizer" />
      <div className="h-dvh text-white pt-28 p-6 sm:p-12 flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-4 shrink-0"
        >
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5">
            {sourceInfo ? `${sourceInfo.width}x${sourceInfo.height} · ${formatBytes(sourceInfo.size)}` : "no source"}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 pt-6">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-6 overflow-y-auto custom-scrollbar pr-2"
          >
            <section>
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. source{" "}
                <ScrambleText
                  text={"源泉"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                <span className="text-xs text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">
                  {sourceFile ? sourceFile.name : "upload_image"}
                </span>
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                  accept="image/*"
                />
              </label>
              {sourceInfo && (
                <div className="mt-3 text-[10px] text-white/30 font-mono space-y-1">
                  <div>DIM: {sourceInfo.width} x {sourceInfo.height}</div>
                  <div>SIZE: {formatBytes(sourceInfo.size)}</div>
                  <div>FMT: {sourceInfo.format}</div>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. resize{" "}
                <ScrambleText
                  text={"リサイズ"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <div className="text-[9px] tracking-widest text-white/30 uppercase">W</div>
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 p-2 text-xs text-white font-mono focus:outline-none focus:border-white/40"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-[9px] tracking-widest text-white/30 uppercase">H</div>
                  <input
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 p-2 text-xs text-white font-mono focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setAspectLock(!aspectLock)}
                  className={`text-[9px] tracking-[0.2em] uppercase border px-3 py-1.5 transition-all ${aspectLock ? "bg-white text-black border-white" : "border-white/10 text-white/30 hover:border-white/40"}`}
                >
                  {aspectLock ? "locked" : "unlocked"} ratio
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {presetSizes.map((ps) => (
                  <button
                    key={ps}
                    onClick={() => applyPreset(ps)}
                    className="text-[9px] tracking-[0.2em] uppercase border border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5 px-3 py-1.5 transition-all"
                  >
                    {ps}
                  </button>
                ))}
                {sourceInfo && (
                  <button
                    onClick={() => { setWidth(sourceInfo.width); setHeight(sourceInfo.height); }}
                    className="text-[9px] tracking-[0.2em] uppercase border border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5 px-3 py-1.5 transition-all"
                  >
                    original
                  </button>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. compress{" "}
                <ScrambleText
                  text={"圧縮"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["jpeg", "png", "webp"] as ImageFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`text-[9px] tracking-[0.2em] uppercase py-3 px-4 border transition-all ${format === f ? "bg-white text-black border-white font-bold" : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>Quality</span>
                  <span>{quality}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer"
                />
              </div>
              {liveEstimate && (
                <div className="text-[10px] text-white/30 font-mono tracking-wider">
                  est: ~{liveEstimate}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                04. target size{" "}
                <ScrambleText
                  text={"目標サイズ"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <button
                onClick={() => setEnableTargetSize(!enableTargetSize)}
                className={`text-[10px] tracking-[0.2em] uppercase border w-full py-3 transition-all ${enableTargetSize ? "bg-white text-black border-white font-bold" : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"}`}
              >
                {enableTargetSize ? "target active" : "enable target size"}
              </button>
              {enableTargetSize && (
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={1}
                    value={targetSize}
                    onChange={(e) => setTargetSize(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-white/5 border border-white/10 p-2 text-xs text-white font-mono focus:outline-none focus:border-white/40"
                  />
                  <div className="flex gap-1">
                    {(["KB", "MB"] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() => setTargetUnit(u)}
                        className={`text-[9px] tracking-[0.2em] uppercase border px-2 py-2 transition-all ${targetUnit === u ? "bg-white text-black border-white" : "border-white/10 text-white/30 hover:border-white/40"}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {enableTargetSize && !resultBlob && liveEstimate && (
                <div className="text-[10px] text-white/20 font-mono">
                  Minimum achievable: ~{liveEstimate}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                05. export{" "}
                <ScrambleText
                  text={"出力"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <button
                onClick={processImage}
                disabled={!sourceFile || optimizing}
                className="w-full border border-white/20 py-4 uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all disabled:opacity-30"
              >
                {optimizing ? "OPTIMIZING..." : resultBlob ? "RE-RENDER" : "RENDER"}
              </button>
              {resultBlob && (
                <div className="space-y-2">
                  <div className="text-[10px] text-white/30 font-mono">
                    {resultDimensions && `${resultDimensions.w}x${resultDimensions.h} · `}{formatBytes(resultBlob.size)}
                    {reduction && ` · -${reduction}`}
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full border border-white/10 py-3 uppercase tracking-widest text-[10px] text-white/50 hover:text-white hover:border-white/40 transition-all"
                  >
                    download .{format === "jpeg" ? "jpg" : format}
                  </button>
                </div>
              )}
            </section>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-9 flex flex-col bg-white/5 border border-white/10 overflow-hidden"
          >
            <canvas ref={canvasRef} className="hidden" />

            {sourcePreview ? (
              <div className="flex-1 flex flex-col min-h-0">
                {resultUrl && (
                  <div className="flex gap-4 px-6 pt-4 pb-3 border-b border-white/10 shrink-0">
                    <button
                      onClick={() => setCompareMode("side")}
                      className={`text-[9px] tracking-[0.2em] uppercase border px-3 py-1.5 transition-all ${compareMode === "side" ? "bg-white text-black border-white" : "border-white/10 text-white/30 hover:border-white/40"}`}
                    >
                      split view
                    </button>
                    <button
                      onClick={() => setCompareMode("slider")}
                      className={`text-[9px] tracking-[0.2em] uppercase border px-3 py-1.5 transition-all ${compareMode === "slider" ? "bg-white text-black border-white" : "border-white/10 text-white/30 hover:border-white/40"}`}
                    >
                      slider
                    </button>
                  </div>
                )}

                <div className="flex-1 flex items-center justify-center p-6 min-h-0">
                  {resultUrl && compareMode === "slider" ? (
                    <div
                      ref={comparisonRef}
                      className="relative w-full h-full max-h-full overflow-hidden select-none"
                      onPointerMove={(e) => handleSliderMove(e.clientX)}
                      onPointerLeave={() => {}}
                    >
                      <img src={resultUrl} alt="result" className="w-full h-full object-contain block" />
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPos}%` }}
                      >
                        <img src={sourcePreview} alt="original" className="w-full h-full object-contain block max-w-none" style={{ width: `${100 / (sliderPos / 100)}%`, height: "100%" }} />
                      </div>
                      <div
                        className="absolute inset-y-0 pointer-events-none z-10"
                        style={{ left: `${sliderPos}%`, width: "3px", background: "rgba(255,255,255,0.6)" }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/30 border border-white/60 flex items-center justify-center backdrop-blur-sm">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none"><path d="M9 4l-6 8 6 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M15 4l6 8-6 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        </div>
                      </div>
                    </div>
                  ) : resultUrl && compareMode === "side" ? (
                    <div className="grid grid-cols-2 gap-4 w-full h-full max-h-full">
                      <div className="flex flex-col min-h-0">
                        <div className="text-[9px] tracking-widest text-white/30 uppercase text-center mb-2 shrink-0">original</div>
                        <div className="flex-1 flex items-center justify-center min-h-0">
                          <img src={sourcePreview} alt="original" className="max-w-full max-h-full object-contain border border-white/10" />
                        </div>
                      </div>
                      <div className="flex flex-col min-h-0">
                        <div className="text-[9px] tracking-widest text-white/30 uppercase text-center mb-2 shrink-0">result</div>
                        <div className="flex-1 flex items-center justify-center min-h-0">
                          <img src={resultUrl} alt="result" className="max-w-full max-h-full object-contain border border-white/10" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <img
                        src={resultUrl || sourcePreview}
                        alt="preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {sourceInfo && (resultBlob || liveEstimate) && (
                  <div className="border-t border-white/10 p-3 flex justify-between items-center bg-zinc-950 shrink-0">
                    <span className="text-[10px] text-white/30 font-mono">
                      Original: {formatBytes(sourceInfo.size)} ({sourceInfo.width}x{sourceInfo.height})
                    </span>
                    {resultBlob && resultDimensions ? (
                      <span className="text-[10px] text-white/50 font-mono">
                        Result: {formatBytes(resultBlob.size)} ({resultDimensions.w}x{resultDimensions.h}){reduction ? ` — ${reduction} reduction` : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/30 font-mono">
                        ~{liveEstimate} · {width}x{height}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <ScrambleText
                  text="system_idle_waiting_for_source"
                  className="text-white/10 text-xs tracking-[0.5em] uppercase font-mono"
                />
              </div>
            )}
          </motion.main>
        </div>
      </div>
      </FileDropZone>
    </div>
  );
}