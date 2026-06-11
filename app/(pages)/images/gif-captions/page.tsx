"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import GIF from "gif.js";
import { parseGIF, decompressFrames } from "gifuct-js";

type CaptionMode = "classic_top" | "classic_bottom" | "overlay_drag";

export default function CaptionGenerator() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceDimensions, setSourceDimensions] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "gif">("image");
  const [bitrate, setBitrate] = useState(0);
  const [kaomoji] = useState("(￣▽￣)ノ");

  const [captionText, setCaptionText] = useState("");
  const [mode, setMode] = useState<CaptionMode>("classic_top");
  const [fontSize, setFontSize] = useState(40);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [fontFamily, setFontFamily] = useLocalStorage("runen:gif-font-family", "Impact");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [copyLabel, setCopyLabel] = useState("generate_gif");

  const jpchars = useMemo(() => jpcharlist, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const PALETTE_PRESETS = {
    LT_CLASSIC: {
      textColor: "#FFFFFF",
      strokeColor: "#000000",
      bgColor: "#FFFFFF",
      strokeWidth: 4,
    },
    NEWSPAPER: {
      textColor: "#000000",
      strokeColor: "transparent",
      bgColor: "#FFFFFF",
      strokeWidth: 0,
    },
    DK_CLASSIC: {
      textColor: "#FFFFFF",
      strokeColor: "#000000",
      bgColor: "#000000",
      strokeWidth: 4,
    },
  };

  const [activePreset, setActivePreset] = useState<string | null>("LT_CLASSIC");

  const applyPreset = (id: keyof typeof PALETTE_PRESETS) => {
    const p = PALETTE_PRESETS[id];
    setTextColor(p.textColor);
    setStrokeColor(p.strokeColor);
    setBgColor(p.bgColor);
    setStrokeWidth(p.strokeWidth);
    setActivePreset(id);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, sourcePreview]);

  const drawFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      source: CanvasImageSource,
      width: number,
      height: number,
    ) => {
      if (!width || !height) return;
      if (
        source instanceof HTMLImageElement &&
        (!source.complete || source.naturalWidth === 0)
      )
        return;

      const previewWidth = containerRef.current?.clientWidth || width;
      const exportScale = width / previewWidth;
      const scaledFontSize = fontSize * exportScale;
      const padding = 20 * exportScale;
      const maxWidth = width - padding * 2;

      ctx.font = `bold ${scaledFontSize}px ${fontFamily}, sans-serif`;
      const words = captionText.split(" ");
      const lines: string[] = [];
      let currentLine = words[0] || "";

      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + " " + words[i];
        if (ctx.measureText(testLine).width < maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = scaledFontSize * 1.2;
      const realExtraHeight = mode.startsWith("classic")
        ? lines.length * lineHeight + padding
        : 0;

      const canvas = ctx.canvas;
      if (
        canvas.width !== width ||
        canvas.height !== height + realExtraHeight
      ) {
        canvas.width = width;
        canvas.height = height + realExtraHeight;
      }

      ctx.fillStyle = mode.startsWith("classic") ? bgColor : "transparent";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mediaY = mode === "classic_top" ? realExtraHeight : 0;
      ctx.drawImage(source, 0, mediaY, width, height);

      ctx.font = `bold ${scaledFontSize}px ${fontFamily}, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = strokeWidth * (fontSize / 32) * exportScale;
      ctx.strokeStyle = strokeColor;

      const drawLine = (line: string, x: number, y: number) => {
        if (strokeWidth > 0) ctx.strokeText(line, x, y);
        ctx.fillStyle = textColor;
        ctx.fillText(line, x, y);
      };

      if (mode.startsWith("classic")) {
        const startY =
          mode === "classic_top"
            ? padding / 2 + lineHeight / 2
            : height + padding / 2 + lineHeight / 2;

        lines.forEach((line, i) => {
          drawLine(line, canvas.width / 2, startY + i * lineHeight);
        });
      } else if (mode === "overlay_drag") {
        ctx.save();
        ctx.translate(
          (previewWidth / 2 + position.x) * exportScale,
          ((containerRef.current?.clientHeight || height) / 2 + position.y) *
            exportScale,
        );
        drawLine(captionText, 0, 0);
        ctx.restore();
      }
    },
    [
      captionText,
      fontSize,
      fontFamily,
      mode,
      textColor,
      bgColor,
      strokeColor,
      strokeWidth,
      position,
    ],
  );

  useEffect(() => {
    let frameId: number;
    const loop = () => {
      if (
        canvasRef.current &&
        sourceDimensions &&
        (imageRef.current || videoRef.current)
      ) {
        const ctx = canvasRef.current.getContext("2d", {
          willReadFrequently: true,
        });
        if (ctx) {
          const source =
            fileType === "video" ? videoRef.current : imageRef.current;
          if (source)
            drawFrame(ctx, source, sourceDimensions.w, sourceDimensions.h);
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [drawFrame, sourceDimensions, fileType]);

  const processFile = useCallback((file: File) => {
    setSourceFile(file);
    const type = file.type.startsWith("video")
      ? "video"
      : file.type === "image/gif"
        ? "gif"
        : "image";
    setFileType(type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSourcePreview(dataUrl);
      const media =
        type === "video" ? document.createElement("video") : new Image();
      const loadEvent = type === "video" ? "onloadedmetadata" : "onload";
      (media as any)[loadEvent] = () => {
        setSourceDimensions({
          w:
            type === "video"
              ? (media as HTMLVideoElement).videoWidth
              : (media as HTMLImageElement).naturalWidth,
          h:
            type === "video"
              ? (media as HTMLVideoElement).videoHeight
              : (media as HTMLImageElement).naturalHeight,
        });
      };
      media.src = dataUrl;
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

  const handleDownload = async () => {
    if (!sourcePreview || !sourceDimensions) return;
    setCopyLabel("rendering...");

    const offscreenCanvas = document.createElement("canvas");
    const offCtx = offscreenCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;
    const dummySource =
      fileType === "video" ? videoRef.current! : imageRef.current!;
    drawFrame(offCtx, dummySource, sourceDimensions.w, sourceDimensions.h);

    const gifEncoder = new GIF({
      workers: 4,
      quality: 10,
      width: offscreenCanvas.width,
      height: offscreenCanvas.height,
      workerScript: "/workers/gif.worker.js",
    });

    if (fileType === "gif" && sourceFile) {
      const arrayBuffer = await sourceFile.arrayBuffer();
      const frames = decompressFrames(parseGIF(arrayBuffer), true);
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = sourceDimensions.w;
      tempCanvas.height = sourceDimensions.h;
      const tempCtx = tempCanvas.getContext("2d")!;

      const step = Math.max(1, Math.round(playbackSpeed));

      for (let i = 0; i < frames.length; i += step) {
        const frame = frames[i];
        if (frame.disposalType === 2)
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        const frameData = tempCtx.createImageData(
          frame.dims.width,
          frame.dims.height,
        );
        frameData.data.set(frame.patch);
        const patchCanvas = document.createElement("canvas");
        patchCanvas.width = frame.dims.width;
        patchCanvas.height = frame.dims.height;
        patchCanvas.getContext("2d")!.putImageData(frameData, 0, 0);
        tempCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

        drawFrame(offCtx, tempCanvas, sourceDimensions.w, sourceDimensions.h);
        gifEncoder.addFrame(offscreenCanvas, {
          copy: true,
          delay: frame.delay / playbackSpeed,
        });
      }
    } else if (fileType === "video" && videoRef.current) {
      const video = videoRef.current;
      const baseFps = 20;
      const timeIncrement = (1 / baseFps) * playbackSpeed;
      const frameCount = 150;

      for (let i = 0; i < frameCount; i++) {
        const targetTime = i * timeIncrement;
        if (targetTime > video.duration) break;

        video.currentTime = targetTime;
        await new Promise((r) => (video.onseeked = r));
        drawFrame(offCtx, video, sourceDimensions.w, sourceDimensions.h);
        gifEncoder.addFrame(offscreenCanvas, {
          copy: true,
          delay: 1000 / baseFps,
        });
      }
    } else if (imageRef.current) {
      drawFrame(
        offCtx,
        imageRef.current,
        sourceDimensions.w,
        sourceDimensions.h,
      );
      gifEncoder.addFrame(offscreenCanvas, { copy: true, delay: 200 });
    }

    gifEncoder.on("finished", (blob: Blob) => {
      const link = document.createElement("a");
      link.download = `meme_${Date.now()}.gif`;
      link.href = URL.createObjectURL(blob);
      link.click();
      setCopyLabel("done");
      setTimeout(() => setCopyLabel("generate_gif"), 2000);
    });

    gifEncoder.render();
  };

  useEffect(() => {
    const interval = setInterval(
      () => setBitrate(Math.floor(Math.random() * 700 + 3800)),
      1500,
    );
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return <div className="min-h-dvh bg-[#050505]" />;

  return (
    <div className="min-h-dvh w-full bg-[#050505] overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleFileDrop}>
      <Navbar title="caption-gen" jp="キャプション" category="media" href="/images/gif-captions" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <button className="text-[10px] tracking-[0.3em] text-white/50 border border-white/10 px-3 py-2 bg-white/5">
            {kaomoji}
          </button>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-8"
          >
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. Source{" "}
                <ScrambleText
                  text={"源泉"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                <span className="text-[10px] text-white/40 group-hover:text-white uppercase tracking-widest">
                  {sourceFile ? sourceFile.name.toLowerCase() : "upload_media"}
                </span>
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                  accept="image/*,video/*"
                />
              </label>
            </section>

            <section className="space-y-6">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. Typography{" "}
                <ScrambleText
                  text={"書体"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <input
                type="text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="ENTER TEXT..."
                className="w-full bg-white/5 border border-white/10 p-3 text-sm tracking-widest font-mono focus:outline-none"
              />

              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-3 text-[13px] uppercase font-mono outline-none appearance-none cursor-pointer"
              >
                {[
                  "Impact",
                  "Arial",
                  "Verdana",
                  "Courier New",
                  "Georgia",
                  "Inter",
                ].map((f) => (
                  <option key={f} value={f} className="bg-[#050505]">
                    {f}
                  </option>
                ))}
              </select>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-[11px] text-white/30 uppercase flex justify-between">
                    <span>Size</span> <span>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-white h-px bg-white/10 appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] text-white/30 uppercase flex justify-between">
                    <span>Stroke</span> <span>{strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="w-full accent-white h-px bg-white/10 appearance-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. Palette{" "}
                <ScrambleText
                  text={"配色"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="flex gap-1.5 justify-stretch mt-4">
                {(
                  Object.keys(PALETTE_PRESETS) as Array<
                    keyof typeof PALETTE_PRESETS
                  >
                ).map((id) => (
                  <button
                    key={id}
                    onClick={() => applyPreset(id)}
                    className={`flex-1 text-[11px] font-bold border py-2 transition-all uppercase tracking-widest ${activePreset === id ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-black text-white/50 border-white/20 hover:border-white/50 hover:text-white"}`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                04. Smart Skip Speed{" "}
                <ScrambleText
                  text={"フレーム調整"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="space-y-2">
                <div className="text-[11px] text-white/30 uppercase flex justify-between">
                  <span>Factor</span> <span>{playbackSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="w-full accent-white h-px bg-white/10 appearance-none"
                />
                <div className="mt-4 flex justify-between text-[11px] text-white/20 font-mono">
                  <span>REALTIME</span>
                  <span>ULTRA SKIP</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                05. Layout{" "}
                <ScrambleText
                  text={"レイアウト"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {["classic_top", "classic_bottom", "overlay_drag"].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m as CaptionMode);
                      setPosition({ x: 0, y: 0 });
                    }}
                    className={`text-[9px] py-2 px-3 border tracking-[0.2em] uppercase transition-all ${mode === m ? "bg-white text-black border-white font-bold" : "border-white/10 text-white/30 hover:border-white/40"}`}
                  >
                    {m.replace("_", " ")}
                  </button>
                ))}
              </div>
            </section>

            <button
              onClick={handleDownload}
              disabled={!sourcePreview || copyLabel.includes("rendering")}
              className="w-full border border-white/20 py-4 uppercase text-[11px] tracking-[0.2em] font-bold hover:bg-white hover:text-black transition-all disabled:opacity-20"
            >
              {copyLabel}
            </button>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-9 flex flex-col bg-white/5 border border-white/10 min-h-[70vh] relative overflow-hidden"
          >
            <div className="w-full border-b border-white/10 bg-black/40 backdrop-blur-md px-6 py-3 flex items-center justify-between z-10 font-mono text-[9px] text-white/30 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${sourcePreview ? "bg-green-500" : "bg-red-500"}`}
                />
                <span>
                  Status: {sourcePreview ? "Active_Feed" : "Awaiting_Input"}
                </span>
              </div>
              <div>
                {bitrate} KBPS // {fileType}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {sourcePreview ? (
                <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#000000] overflow-hidden">
                  <div
                    ref={containerRef}
                    className="relative shadow-2xl ring-1 ring-white/10 max-h-full max-w-full"
                  >
                    <canvas
                      ref={canvasRef}
                      className="max-h-[67vh] w-auto object-contain block h-auto"
                    />
                    <div className="hidden">
                      {fileType === "video" ? (
                        <video
                          ref={videoRef}
                          src={sourcePreview}
                          autoPlay
                          loop
                          muted
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <img
                          ref={imageRef}
                          src={sourcePreview}
                          alt="source"
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                    {mode === "overlay_drag" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                          drag
                          dragMomentum={false}
                          onDrag={(_, info) =>
                            setPosition({
                              x: position.x + info.delta.x,
                              y: position.y + info.delta.y,
                            })
                          }
                          className="pointer-events-auto cursor-grab active:cursor-grabbing w-32 h-12 border border-dashed border-white/20"
                          style={{ x: position.x, y: position.y }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <ScrambleText
                    text="awaiting_media_input"
                    className="uppercase tracking-[0.5em] font-mono text-white/10 text-xs"
                  />
                </div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
      </FileDropZone>
    </div>
  );
}
