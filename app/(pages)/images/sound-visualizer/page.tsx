"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import AudioPlayer from "@/components/AudioPlayer";
import ShareButton from "@/components/ShareButton";
import { jpcharlist } from "@/public/data/charlists";
import { attributePng, attributeGif } from "@/lib/attribution";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  COLOR_SCHEMES,
  type VisualizerOptions,
  type VisualizerMode,
} from "@/lib/visualizers";
import { renderWaveform } from "@/lib/visualizers/waveform";
import { renderFrequencyBars } from "@/lib/visualizers/frequency";
import { renderSpectrogram } from "@/lib/visualizers/spectrogram";
import { renderCircleWave } from "@/lib/visualizers/circle";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

const MODES: { id: VisualizerMode; label: string }[] = [
  { id: "waveform", label: "Waveform" },
  { id: "frequency", label: "Frequency Bars" },
  { id: "spectrogram", label: "Spectrogram" },
  { id: "circle", label: "Circle Wave" },
];

const COLOR_SCHEME_KEYS = Object.keys(COLOR_SCHEMES);

export default function SoundVisualizerPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useLocalStorage<VisualizerMode>("runen:soundviz-mode", "waveform");
  const [colorScheme, setColorScheme] = useLocalStorage("runen:soundviz-color-scheme", COLOR_SCHEME_KEYS[0]);
  const [timeStart, setTimeStart] = useState(0);
  const [timeEnd, setTimeEnd] = useState(100);
  const [outputWidth, setOutputWidth] = useState(800);
  const [background, setBackground] = useState<"black" | "transparent">("black");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const duration = audioBuffer?.duration ?? 0;
  const timeStartSec = (timeStart / 100) * duration;
  const timeEndSec = (timeEnd / 100) * duration;

  const visualizerOpts = useMemo<VisualizerOptions>(() => ({
    width: outputWidth,
    height: Math.round(outputWidth * 0.5),
    colors: COLOR_SCHEMES[colorScheme] ?? COLOR_SCHEMES.Monochrome,
    background,
  }), [outputWidth, colorScheme, background]);

  const handleFileDrop = useCallback(async (f: File) => {
    setError(null);
    setDecoding(true);
    setAudioBuffer(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setFile(f);

    try {
      const url = URL.createObjectURL(f);
      setAudioUrl(url);
      const arrayBuffer = await f.arrayBuffer();
      const audioCtx = new AudioContext();
      const buf = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      audioCtx.close();
      setAudioBuffer(buf);
      setTimeStart(0);
      setTimeEnd(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decode audio");
    } finally {
      setDecoding(false);
    }
  }, [audioUrl]);

  const renderVisualization = useCallback(() => {
    if (!audioBuffer || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const opts = visualizerOpts;

    switch (mode) {
      case "waveform": {
        const viz = renderWaveform(audioBuffer, opts, timeStartSec, timeEndSec);
        viz.render(ctx);
        break;
      }
      case "frequency": {
        const viz = renderFrequencyBars(audioBuffer, opts, 2048, 64, timeStartSec, timeEndSec);
        viz.render(ctx);
        break;
      }
      case "spectrogram": {
        const viz = renderSpectrogram(audioBuffer, opts, 1024, timeStartSec, timeEndSec);
        viz.render(ctx);
        break;
      }
      case "circle": {
        const viz = renderCircleWave(audioBuffer, opts, timeStartSec, timeEndSec);
        viz.render(ctx);
        break;
      }
    }
  }, [audioBuffer, visualizerOpts, mode, timeStartSec, timeEndSec]);

  useEffect(() => {
    renderVisualization();
  }, [renderVisualization]);

  const handleExportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const attributed = await attributePng(blob);
      const url = URL.createObjectURL(attributed);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sound-visualizer-${mode}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [mode]);

  const handleExportGif = useCallback(async () => {
    if (!audioBuffer) return;
    const GIF = (await import("gif.js")).default;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;
    const totalFrames = Math.min(Math.floor(duration * 10), 200);
    const frameDuration = duration / totalFrames;
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext("2d")!;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: "/workers/gif.worker.js",
    });

    const sampleRate = audioBuffer.sampleRate;
    const data = audioBuffer.getChannelData(0);

    const opts = visualizerOpts;

    for (let f = 0; f < totalFrames; f++) {
      const t = (f / totalFrames) * duration;
      offCtx.clearRect(0, 0, width, height);
      if (background === "black") {
        offCtx.fillStyle = "#000000";
        offCtx.fillRect(0, 0, width, height);
      }

      const tStart = t;
      const tEnd = Math.min(t + frameDuration, duration);

      switch (mode) {
        case "waveform": {
          const viz = renderWaveform(audioBuffer, { ...opts, width, height }, tStart, tEnd);
          viz.render(offCtx);
          break;
        }
        case "frequency": {
          const segStart = Math.floor(tStart * sampleRate);
          const segLen = Math.min(2048, data.length - segStart);
          if (segLen > 0) {
            const viz = renderFrequencyBars(audioBuffer, { ...opts, width, height }, 2048, 64, tStart, tEnd);
            viz.render(offCtx);
          }
          break;
        }
        case "circle": {
          const viz = renderCircleWave(audioBuffer, { ...opts, width, height }, tStart, tEnd);
          viz.render(offCtx);
          break;
        }
        case "spectrogram":
        default: {
          const viz = renderSpectrogram(audioBuffer, { ...opts, width, height }, 512, tStart, tEnd);
          viz.render(offCtx);
          break;
        }
      }

      gif.addFrame(offCtx, { copy: true, delay: Math.round(frameDuration * 100) });
    }

    gif.on("finished", async (blob: Blob) => {
      const attributed = await attributeGif(blob);
      const url = URL.createObjectURL(attributed);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sound-visualizer-${mode}.gif`;
      a.click();
      URL.revokeObjectURL(url);
    });

    gif.render();
  }, [audioBuffer, mode, visualizerOpts, background, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!playheadRef.current || !canvasRef.current || duration === 0) return;
      const pct = (audio.currentTime / duration) * 100;
      const canvasW = canvasRef.current.offsetWidth;
      playheadRef.current.style.left = `${(pct / 100) * canvasW}px`;
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [duration]);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleFileDrop}>
        <Navbar
          title="sound-visualizer"
          jp="サウンドビジュアライザー"
          category="images"
          href="/files/sound-visualizer"
        />
        <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end gap-4 border-b border-white/10 pb-8"
          >
            <button className="text-[10px] tracking-[0.3em] text-white/50 hover:text-white transition-colors uppercase border border-white/10 px-3 py-2 bg-white/5">
              v0.1
            </button>
          </motion.header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 space-y-10"
            >
              {/* 01. SOURCE */}
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  01. source{" "}
                  <ScrambleText
                    text={"ソース"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                  <span className="text-xs text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">
                    {file ? file.name : "upload_audio"}
                  </span>
                  <input
                    type="file"
                    accept=".mp3,.wav,.flac,.ogg,.m4a,.opus"
                    onChange={(e) => e.target.files?.[0] && handleFileDrop(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                {file && (
                  <div className="text-[10px] text-white/40 tracking-widest uppercase space-y-1">
                    <div>{file.name}</div>
                    <div>{formatFileSize(file.size)}</div>
                    {audioBuffer && (
                      <div>{audioBuffer.duration.toFixed(1)}s</div>
                    )}
                  </div>
                )}
              </section>

              {/* 02. MODE */}
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  02. mode{" "}
                  <ScrambleText
                    text={"モード"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as VisualizerMode)}
                  className="w-full bg-transparent border border-white/10 text-white/80 text-[10px] uppercase tracking-widest p-3 focus:outline-none focus:border-white/40"
                >
                  {MODES.map((m) => (
                    <option key={m.id} value={m.id} className="bg-black">
                      {m.label}
                    </option>
                  ))}
                </select>
              </section>

              {/* 03. COLOR SCHEME */}
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  03. color scheme{" "}
                  <ScrambleText
                    text={"配色"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <select
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                  className="w-full bg-transparent border border-white/10 text-white/80 text-[10px] uppercase tracking-widest p-3 focus:outline-none focus:border-white/40"
                >
                  {COLOR_SCHEME_KEYS.map((key) => (
                    <option key={key} value={key} className="bg-black">
                      {key}
                    </option>
                  ))}
                </select>
              </section>

              {/* 04. TIME RANGE */}
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  04. time range{" "}
                  <ScrambleText
                    text={"時間範囲"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] tracking-widest text-white/40">
                    <span>{(timeStart / 100 * duration).toFixed(1)}s</span>
                    <span>{(timeEnd / 100 * duration).toFixed(1)}s</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-[9px] text-white/30 w-6">min</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={timeStart}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v < timeEnd) setTimeStart(v);
                      }}
                      className="flex-1 appearance-none h-[2px] bg-white/20 rounded-full outline-none"
                    />
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-[9px] text-white/30 w-6">max</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={timeEnd}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v > timeStart) setTimeEnd(v);
                      }}
                      className="flex-1 appearance-none h-[2px] bg-white/20 rounded-full outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* 05. RESOLUTION */}
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  05. resolution{" "}
                  <ScrambleText
                    text={"解像度"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <input
                  type="number"
                  min={400}
                  max={4000}
                  step={100}
                  value={outputWidth}
                  onChange={(e) => setOutputWidth(Math.max(400, Math.min(4000, Number(e.target.value))))}
                  className="w-full bg-transparent border-b border-white/10 text-white/80 text-[10px] uppercase tracking-widest p-2 focus:outline-none focus:border-white/40"
                />
                <div className="text-[9px] text-white/30 tracking-widest">
                  {outputWidth} × {Math.round(outputWidth * 0.5)} px
                </div>
              </section>

              {/* 06. EXPORT */}
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  06. export{" "}
                  <ScrambleText
                    text={"エクスポート"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <button
                  onClick={handleExportPng}
                  disabled={!audioBuffer}
                  className="w-full bg-white text-black uppercase text-xs tracking-[0.3em] font-bold py-3 hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  export PNG
                </button>
                <button
                  onClick={handleExportGif}
                  disabled={!audioBuffer || duration === 0}
                  className="w-full border border-white/20 text-white/80 uppercase text-[10px] tracking-[0.3em] py-3 hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  export animated GIF
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBackground(background === "black" ? "transparent" : "black")}
                    className={`text-[9px] uppercase tracking-widest px-3 py-1.5 border transition-all ${background === "black" ? "bg-white text-black border-white" : "border-white/20 text-white/50"}`}
                  >
                    bg: {background}
                  </button>
                </div>
              </section>
            </motion.aside>

            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-9 flex flex-col gap-6"
            >
              {error && (
                <div className="text-red-400 text-xs tracking-widest uppercase mb-2">
                  {error}
                </div>
              )}

              {decoding ? (
                <div className="flex-1 flex items-center justify-center bg-white/2 border border-white/5 min-h-[50vh]">
                  <ScrambleText
                    text="decoding_audio…"
                    className="text-white/30 text-xs tracking-[0.5em] italic"
                  />
                </div>
              ) : audioBuffer ? (
                <>
                  <div className="relative bg-white/2 border border-white/5 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={visualizerOpts.width}
                      height={visualizerOpts.height}
                      className="w-full h-auto"
                    />
                    <div
                      ref={playheadRef}
                      className="absolute top-0 bottom-0 w-px bg-white/60 pointer-events-none transition-none"
                      style={{ left: "-1px" }}
                    />
                  </div>
                  {audioUrl && (
                    <div className="mb-2">
                      <audio ref={audioRef} src={audioUrl} preload="auto" />
                      <AudioPlayer src={audioUrl} fileName={file?.name} />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <ShareButton data={""} filename={`sound-visualizer-${mode}.txt`} />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-white/2 border border-white/5 min-h-[50vh]">
                  <ScrambleText
                    text="null_data_idle"
                    className="text-white/10 text-xs tracking-[0.5em] italic"
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