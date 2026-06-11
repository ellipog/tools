"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { removeBackground, Config } from "@imgly/background-removal";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";

type ProcessStatus =
  | "idle"
  | "loading_model"
  | "processing"
  | "success"
  | "error";

export default function BackgroundRemovalGenerator() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceDimensions, setSourceDimensions] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);

  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>("transparent");

  // Transform States
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isTransforming, setIsTransforming] = useState(false);

  const jpchars = useMemo(() => jpcharlist, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isExportingRef = useRef(false);

  const processFile = useCallback((file: File) => {
    setSourceFile(file);
    setStatus("idle");
    setProcessedUrl(null);
    setProgress(0);
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setRotation(0);
    setSourceDimensions(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSourcePreview(dataUrl);
      const img = new Image();
      img.onload = () =>
        setSourceDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = dataUrl;
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

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomBgUrl(event.target?.result as string);
      setBgColor("custom");
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!sourceFile) return;
    setStatus("loading_model");
    setProgress(0);

    try {
      const config: Config = {
        progress: (key, current, total) => {
          if (key.includes("compute")) setStatus("processing");
          setProgress(Math.round((current / total) * 100));
        },
      };

      const blob = await removeBackground(sourceFile, config);
      const url = URL.createObjectURL(blob);

      setProcessedUrl(url); // ← no dimension override
      setStatus("success");
    } catch (error) {
      console.error("Background removal failed:", error);
      setStatus("error");
    }
  };

  const handleDownload = () => {
    const currentForegroundUrl = processedUrl || sourcePreview;
    if (
      !currentForegroundUrl ||
      !canvasRef.current ||
      !containerRef.current ||
      !imageContainerRef.current
    )
      return;

    if (isExportingRef.current) return;
    isExportingRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isExportingRef.current = false;
      return;
    }

    const foregroundImg = new Image();
    const backgroundImg = new Image();

    const uiW = containerRef.current.clientWidth;
    const uiH = containerRef.current.clientHeight;

    if (uiW === 0 || uiH === 0) {
      isExportingRef.current = false;
      return;
    }

    const onAllLoaded = () => {
      if (!isExportingRef.current) return;

      let exportW: number;
      let exportH: number;

      if (bgColor === "custom" && customBgUrl) {
        exportW = backgroundImg.naturalWidth;
        exportH = backgroundImg.naturalHeight;
      } else {
        // ←←← Non-custom = exactly the original foreground size (no expansion)
        exportW = foregroundImg.naturalWidth;
        exportH = foregroundImg.naturalHeight;
      }

      if (exportW === 0 || exportH === 0) {
        isExportingRef.current = false;
        return;
      }

      canvas.width = exportW;
      canvas.height = exportH;

      ctx.clearRect(0, 0, exportW, exportH);

      // Background
      if (bgColor === "custom" && customBgUrl) {
        ctx.drawImage(backgroundImg, 0, 0, exportW, exportH);
      } else if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, exportW, exportH);
      }

      // Foreground with transforms
      const imgEl = imageContainerRef.current!.querySelector(
        "img",
      ) as HTMLImageElement | null;
      if (!imgEl) {
        isExportingRef.current = false;
        return;
      }

      const visualW = imgEl.clientWidth;
      const visualH = imgEl.clientHeight;
      const mappedScale = exportW / uiW;

      ctx.save();
      ctx.translate(
        (uiW / 2 + position.x) * mappedScale,
        (uiH / 2 + position.y) * mappedScale,
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      ctx.drawImage(
        foregroundImg,
        -(visualW * mappedScale) / 2,
        -(visualH * mappedScale) / 2,
        visualW * mappedScale,
        visualH * mappedScale,
      );
      ctx.restore();

      // ←←← TRANSPARENT TRIM (only when transparent bg is chosen)
      if (bgColor === "transparent") {
        const imageData = ctx.getImageData(0, 0, exportW, exportH);
        const data = imageData.data;

        let minX = exportW,
          minY = exportH,
          maxX = 0,
          maxY = 0;

        for (let y = 0; y < exportH; y++) {
          for (let x = 0; x < exportW; x++) {
            const idx = (y * exportW + x) * 4 + 3; // alpha channel
            if (data[idx] > 5) {
              // tolerance for anti-aliasing
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        if (minX <= maxX) {
          const padding = 5;
          const cropX = Math.max(0, minX - padding);
          const cropY = Math.max(0, minY - padding);
          const cropW = Math.min(exportW, maxX - minX + 1 + 2 * padding);
          const cropH = Math.min(exportH, maxY - minY + 1 + 2 * padding);

          const cropped = document.createElement("canvas");
          cropped.width = cropW;
          cropped.height = cropH;
          const cctx = cropped.getContext("2d")!;
          cctx.drawImage(
            canvas,
            cropX,
            cropY,
            cropW,
            cropH,
            0,
            0,
            cropW,
            cropH,
          );

          const link = document.createElement("a");
          link.download = `bgremoved_${Date.now()}.png`;
          link.href = cropped.toDataURL("image/png");
          link.click();
          isExportingRef.current = false;
          return;
        }
      }

      // Normal download (solid color, custom bg, or empty transparent case)
      const link = document.createElement("a");
      link.download = `bgremoved_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      isExportingRef.current = false;
    };

    let bgReady = bgColor !== "custom" || !customBgUrl;

    if (!bgReady) {
      backgroundImg.onload = () => {
        bgReady = true;
        if (foregroundImg.complete) onAllLoaded();
      };
      backgroundImg.src = customBgUrl!;
    }

    foregroundImg.onload = () => {
      if (bgReady) onAllLoaded();
    };

    foregroundImg.src = currentForegroundUrl;
  };

  const bgOptions = [
    { label: "Transparent", value: "transparent" },
    { label: "Studio Black", value: "#000000" },
    { label: "Clean White", value: "#ffffff" },
    { label: "Chroma Green", value: "#00ff00" },
  ];

  const isEditable = !!sourcePreview;

  // --- Handlers for Math-based Transforms ---
  const handleScaleDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsTransforming(true);
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    const startScale = scale;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentDist = Math.hypot(
        moveEvent.clientX - centerX,
        moveEvent.clientY - centerY,
      );
      setScale(Math.max(0.1, startScale * (currentDist / startDist)));
    };

    const onPointerUp = () => {
      setIsTransforming(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleRotateDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsTransforming(true);
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startRotation = rotation;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentAngle = Math.atan2(
        moveEvent.clientY - centerY,
        moveEvent.clientX - centerX,
      );
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
      setRotation(startRotation + angleDiff);
    };

    const onPointerUp = () => {
      setIsTransforming(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Compute the artboard's base dimensions from the source image.
  // We use a max-height of 65vh and derive width from the aspect ratio.
  // When a custom bg is active it will override via the img tag instead.
  const artboardStyle: React.CSSProperties = sourceDimensions
    ? {
        aspectRatio: `${sourceDimensions.w} / ${sourceDimensions.h}`,
        // Let CSS clamp to available space; the browser will scale keeping the ratio
        maxHeight: "65vh",
        maxWidth: "100%",
        // Start from the natural pixel width; CSS will clamp via maxWidth/maxHeight
        width: `${sourceDimensions.w}px`,
      }
    : {
        width: "800px",
        maxWidth: "100%",
        aspectRatio: "4/3",
      };

  return (
    <div className="min-h-dvh w-full bg-[#050505] overflow-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleFileDrop}>
      <Navbar title="bg-remover" jp="背景削除" category="images" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12 max-h-[calc(100vh-80px)]">
        <header className="flex justify-end gap-4 border-b border-white/10 pb-8">
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${status === "success" ? "bg-green-500" : status === "error" ? "bg-red-500" : status === "idle" ? "bg-white/30" : "bg-yellow-500 animate-pulse"}`}
            />
            {status.replace("_", " ")}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 overflow-hidden">
          {/* SIDEBAR */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10 overflow-y-auto pr-4"
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
            </section>

            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. backdrop{" "}
                <ScrambleText
                  text={"背景"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {bgOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBgColor(opt.value)}
                    className={`text-[10px] py-3 px-4 border tracking-[0.2em] uppercase transition-all text-left flex items-center gap-4 ${bgColor === opt.value ? "bg-white text-black border-white font-bold" : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"}`}
                  >
                    <div
                      className="w-4 h-4 border border-current flex-shrink-0"
                      style={
                        opt.value !== "transparent"
                          ? { backgroundColor: opt.value }
                          : {
                              backgroundImage:
                                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                              backgroundSize: "8px 8px",
                            }
                      }
                    />
                    {opt.label}
                  </button>
                ))}

                <input
                  type="file"
                  ref={bgInputRef}
                  onChange={handleCustomBgUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className={`text-[10px] py-3 px-4 border tracking-[0.2em] uppercase transition-all text-left flex items-center gap-4 ${bgColor === "custom" ? "bg-white text-black border-white font-bold" : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"}`}
                >
                  <div className="w-4 h-4 border border-current flex items-center justify-center overflow-hidden flex-shrink-0">
                    {customBgUrl ? (
                      <img
                        src={customBgUrl}
                        className="w-full h-full object-cover"
                        alt="bg"
                      />
                    ) : (
                      "+"
                    )}
                  </div>
                  {customBgUrl ? "Replace Background" : "Custom Background"}
                </button>
              </div>
            </section>

            <section className="space-y-6">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-6">
                03. engine{" "}
                <ScrambleText
                  text={"処理"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <button
                onClick={processImage}
                disabled={
                  !sourceFile ||
                  status === "loading_model" ||
                  status === "processing"
                }
                className="w-full border border-white/20 py-4 uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all disabled:opacity-30"
              >
                {status === "loading_model" || status === "processing"
                  ? `PROCESSING [${progress}%]`
                  : "EXECUTE_ISOLATION"}
              </button>
            </section>
          </motion.aside>

          {/* MAIN PREVIEW AREA */}
          <motion.main className="lg:col-span-8 flex flex-col border border-white/10 min-h-[60vh] relative overflow-hidden bg-[#111]">
            <canvas ref={canvasRef} className="hidden" />

            {sourcePreview ? (
              <div className="flex-1 w-full h-full relative flex items-center justify-center px-12 pt-12 overflow-hidden">
                {/*
                  ARTBOARD CONTAINER
                  Sized to match the source image's natural aspect ratio.
                  When a custom bg is active, the bg <img> drives the size instead.
                */}
                <div
                  ref={containerRef}
                  className="relative shadow-2xl bg-black ring-1 ring-white/10 mb-28"
                  style={{ display: "inline-block" }}
                >
                  {/* BASE LAYER — dictates artboard size */}
                  {bgColor === "custom" && customBgUrl ? (
                    /*
                      Custom bg: the image fills the artboard completely.
                      object-fit: contain ensures the full image is always visible.
                    */
                    <img
                      src={customBgUrl}
                      className="block pointer-events-none"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "65vh",
                        objectFit: "contain",
                        display: "block",
                      }}
                      alt="bg"
                    />
                  ) : (
                    /*
                      No custom bg: use the source image's natural aspect ratio
                      so the artboard feels like a canvas for the photo itself.
                    */
                    <div
                      className="pointer-events-none"
                      style={{
                        ...artboardStyle,
                        backgroundColor:
                          bgColor !== "transparent" ? bgColor : undefined,
                        backgroundImage:
                          bgColor === "transparent"
                            ? "linear-gradient(45deg, #181818 25%, transparent 25%), linear-gradient(-45deg, #181818 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #181818 75%), linear-gradient(-45deg, transparent 75%, #181818 75%)"
                            : undefined,
                        backgroundSize: "20px 20px",
                      }}
                    />
                  )}

                  {/* FOREGROUND LAYER */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                      ref={imageContainerRef}
                      drag={isEditable && !isTransforming}
                      dragMomentum={false}
                      dragElastic={0}
                      onDrag={(e, info) => {
                        if (isEditable && !isTransforming) {
                          setPosition({
                            x: position.x + info.delta.x,
                            y: position.y + info.delta.y,
                          });
                        }
                      }}
                      style={{
                        x: position.x,
                        y: position.y,
                        rotate: rotation,
                        scale: scale,
                      }}
                      className={`relative group pointer-events-auto ${isEditable && !isTransforming ? "cursor-grab active:cursor-grabbing" : ""}`}
                    >
                      <img
                        src={processedUrl || sourcePreview}
                        alt="Preview"
                        draggable={false}
                        className={`max-w-full max-h-[60vh] block pointer-events-none transition-all ${status === "processing" ? "opacity-50 blur-sm grayscale" : "opacity-100"}`}
                      />

                      {/* TRANSFORMATION CONTROLS */}
                      {isEditable && (
                        <>
                          {/* Invisible hit-area expansion */}
                          <div className="absolute -inset-16 z-[-1]" />

                          {/* Bounding box outline */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{
                              borderWidth: `${1 / scale}px`,
                              borderColor: "rgba(255,255,255,0.4)",
                              borderStyle: "solid",
                            }}
                          />

                          {/* Rotation handle — pure circle, no stem */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                              onPointerDown={handleRotateDrag}
                              className="flex items-center justify-center cursor-crosshair z-10"
                              style={{ width: "2.5rem", height: "2.5rem" }}
                            >
                              <div
                                className="bg-white border border-black rounded-full"
                                style={{
                                  width: "0.875rem",
                                  height: "0.875rem",
                                  transform: `scale(${1 / scale})`,
                                  transformOrigin: "center",
                                }}
                              />
                            </div>
                          </div>

                          {/* Corner scale handles — circles */}
                          {[
                            { class: "-top-5 -left-5 cursor-nwse-resize" },
                            { class: "-top-5 -right-5 cursor-nesw-resize" },
                            { class: "-bottom-5 -left-5 cursor-nesw-resize" },
                            { class: "-bottom-5 -right-5 cursor-nwse-resize" },
                          ].map((pos, i) => (
                            <div
                              key={i}
                              onPointerDown={handleScaleDrag}
                              className={`absolute ${pos.class} flex items-center justify-center opacity-0 group-hover:opacity-100 z-10`}
                              style={{ width: "2.5rem", height: "2.5rem" }}
                            >
                              <div
                                className="bg-white border border-black rounded-full"
                                style={{
                                  width: "0.75rem",
                                  height: "0.75rem",
                                  transform: `scale(${1 / scale})`,
                                  transformOrigin: "center",
                                }}
                              />
                            </div>
                          ))}
                        </>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Progress scanline */}
                {status === "processing" && (
                  <motion.div
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute left-0 right-0 h-px bg-white z-50 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                  />
                )}

                {/* Footer overlay */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-6 flex justify-between items-center bg-black/80 backdrop-blur-md">
                  <span className="text-[11px] text-white/40 font-mono uppercase tracking-widest">
                    {processedUrl ? "ISOLATION_COMPLETE" : "AWAITING_EXECUTION"}
                  </span>
                  <button
                    onClick={handleDownload}
                    className="text-[11px] uppercase tracking-widest border-b border-white/20 text-white/50 hover:text-white transition-all pb-1 z-10"
                  >
                    download_png
                  </button>
                </div>
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
