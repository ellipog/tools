"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";
import { attributeBlob, attributeText } from "@/lib/attribution";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  convertImage,
  getImageInfo,
  IMAGE_SOURCE_FORMATS,
  IMAGE_TARGET_FORMATS,
  type ImageTargetFormat,
  type ImageFilter,
  type ImageRotation,
  type ImageInfo,
} from "@/lib/converters/image";
import {
  convertData,
  getDataStats,
  DATA_SOURCE_FORMATS,
  DATA_TARGET_FORMATS,
  type DataSourceFormat,
  type DataTargetFormat,
  type DataStats,
} from "@/lib/converters/data";
import {
  convertDocument,
  getDocStats,
  convertCase,
  DOCUMENT_FORMATS,
  type DocumentFormat,
  type DocStats,
  type CaseMode,
} from "@/lib/converters/document";
import AudioPlayer from "@/components/AudioPlayer";
import {
  convertAudio,
  getAudioInfo,
  AUDIO_SOURCE_FORMATS,
  AUDIO_TARGET_FORMATS,
  type AudioTargetFormat,
  type AudioInfo,
} from "@/lib/converters/audio";

type FileCategory = "image" | "data" | "document" | "audio";

const CATEGORIES: { key: FileCategory; label: string; jp: string }[] = [
  { key: "image", label: "image", jp: "画像" },
  { key: "data", label: "data", jp: "データ" },
  { key: "document", label: "document", jp: "文書" },
  { key: "audio", label: "audio", jp: "オーディオ" },
];

const SOURCE_FORMATS: Record<FileCategory, readonly string[]> = {
  image: IMAGE_SOURCE_FORMATS,
  data: DATA_SOURCE_FORMATS,
  document: DOCUMENT_FORMATS,
  audio: AUDIO_SOURCE_FORMATS,
};

const TARGET_FORMATS: Record<FileCategory, readonly string[]> = {
  image: IMAGE_TARGET_FORMATS,
  data: DATA_TARGET_FORMATS,
  document: DOCUMENT_FORMATS,
  audio: AUDIO_TARGET_FORMATS,
};

const FORMAT_EXT_MAP: Record<string, string[]> = {
  png: ["png"],
  jpeg: ["jpg", "jpeg"],
  webp: ["webp"],
  bmp: ["bmp"],
  gif: ["gif"],
  avif: ["avif"],
  svg: ["svg"],
  ico: ["ico"],
  json: ["json"],
  csv: ["csv"],
  yaml: ["yaml", "yml"],
  xml: ["xml"],
  sql: ["sql"],
  markdown: ["md", "markdown"],
  html: ["html", "htm"],
  txt: ["txt", "text"],
  wav: ["wav"],
  mp3: ["mp3"],
  flac: ["flac"],
  aac: ["aac", "m4a"],
  ogg: ["ogg"],
  opus: ["opus"],
  m4a: ["m4a"],
};

const FORMAT_TO_CATEGORY: Record<string, FileCategory> = {
  png: "image", jpeg: "image", webp: "image", bmp: "image",
  gif: "image", avif: "image", svg: "image", ico: "image",
  json: "data", csv: "data", yaml: "data", xml: "data",
  markdown: "document", html: "document", txt: "document",
  wav: "audio", mp3: "audio", flac: "audio", aac: "audio",
  ogg: "audio", opus: "audio", m4a: "audio",
};

const FILTERS: { key: ImageFilter; label: string }[] = [
  { key: "none", label: "none" },
  { key: "grayscale", label: "grayscale" },
  { key: "sepia", label: "sepia" },
  { key: "invert", label: "invert" },
];

const ROTATIONS: { key: ImageRotation; label: string }[] = [
  { key: 0, label: "0°" },
  { key: 90, label: "90°" },
  { key: 180, label: "180°" },
  { key: 270, label: "270°" },
];

const AUDIO_BITRATES = [64, 96, 128, 192, 256, 320];

const CASE_MODES: { key: CaseMode; label: string }[] = [
  { key: "upper", label: "UPPER" },
  { key: "lower", label: "lower" },
  { key: "title", label: "Title" },
  { key: "sentence", label: "Sentence" },
  { key: "camel", label: "camelCase" },
  { key: "snake", label: "snake_case" },
  { key: "kebab", label: "kebab-case" },
];

function detectFormat(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  for (const [fmt, exts] of Object.entries(FORMAT_EXT_MAP)) {
    if (exts.includes(ext)) return fmt;
  }
  return null;
}

export default function FileConverter() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [category, setCategory] = useLocalStorage<FileCategory | null>("runen:converter-category", null);
  const [sourceFormat, setSourceFormat] = useLocalStorage<string>("runen:converter-source-format", "");
  const [targetFormat, setTargetFormat] = useLocalStorage<string>("runen:converter-target-format", "");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultText, setResultText] = useState<string>("");
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string>("");

  const [quality, setQuality] = useState(92);
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [filter, setFilter] = useState<ImageFilter>("none");
  const [rotate, setRotate] = useState<ImageRotation>(0);

  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(true);
  const [indent, setIndent] = useState(2);
  const [sqlTableName, setSqlTableName] = useState("");

  const [bitrate, setBitrate] = useState(192);

  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [docStats, setDocStats] = useState<DocStats | null>(null);
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);

  const [caseMode, setCaseMode] = useState<CaseMode | null>(null);

  const sourceFormats = category ? SOURCE_FORMATS[category] : [];
  const targetFormats = category ? TARGET_FORMATS[category] : [];

  const handleCategory = (cat: FileCategory) => {
    setCategory(cat);
    setSourceFormat("");
    setTargetFormat("");
    setFile(null);
    setFileName("");
    setResultBlob(null);
    setResultText("");
    setError(null);
    setPreviewUrl("");
    setPreviewAudioUrl("");
    setImageInfo(null);
    setDataStats(null);
    setDocStats(null);
    setAudioInfo(null);
    setCaseMode(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setResultBlob(null);
    setResultText("");
    setError(null);
    setPreviewUrl("");
    setPreviewAudioUrl("");
    setImageInfo(null);
    setDataStats(null);
    setDocStats(null);
    setAudioInfo(null);
    setCaseMode(null);

    const detected = detectFormat(f);
    if (detected && sourceFormats.includes(detected)) {
      setSourceFormat(detected);
    } else if (sourceFormats.length > 0) {
      setSourceFormat(sourceFormats[0]);
    }

    const base = f.name.replace(/\.[^.]+$/, "");
    setSqlTableName(base.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase());

    if (category === "image") {
      try { setImageInfo(await getImageInfo(f)); } catch { /* ignore */ }
    } else if (category === "audio") {
      try { setAudioInfo(await getAudioInfo(f)); } catch { /* ignore */ }
    }
  };

  const handleFileDrop = useCallback(async (f: File) => {
    setFile(f);
    setFileName(f.name);
    setResultBlob(null);
    setResultText("");
    setError(null);
    setPreviewUrl("");
    setPreviewAudioUrl("");
    setImageInfo(null);
    setDataStats(null);
    setDocStats(null);
    setAudioInfo(null);
    setCaseMode(null);

    const detected = detectFormat(f);
    if (detected) {
      const cat = FORMAT_TO_CATEGORY[detected];
      if (cat) {
        setCategory(cat);
        setSourceFormat(detected);
      } else if (sourceFormats.includes(detected)) {
        setSourceFormat(detected);
      } else if (sourceFormats.length > 0) {
        setSourceFormat(sourceFormats[0]);
      }
    } else if (sourceFormats.length > 0) {
      setSourceFormat(sourceFormats[0]);
    }

    const base = f.name.replace(/\.[^.]+$/, "");
    setSqlTableName(base.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase());

    if (detected && FORMAT_TO_CATEGORY[detected] === "image") {
      try { setImageInfo(await getImageInfo(f)); } catch { /* ignore */ }
    } else if (f.type.startsWith("image/")) {
      try { setImageInfo(await getImageInfo(f)); } catch { /* ignore */ }
    } else if (detected && FORMAT_TO_CATEGORY[detected] === "audio") {
      try { setAudioInfo(await getAudioInfo(f)); } catch { /* ignore */ }
    } else if (f.type.startsWith("audio/")) {
      try { setAudioInfo(await getAudioInfo(f)); } catch { /* ignore */ }
    }
  }, [sourceFormats]);

  const handleConvert = useCallback(async () => {
    if (!file || !category || !sourceFormat || !targetFormat) return;
    setConverting(true);
    setError(null);
    setResultBlob(null);
    setResultText("");
    setPreviewUrl("");
    setPreviewAudioUrl("");

    try {
      if (category === "image") {
        const blob = await convertImage(file, targetFormat as ImageTargetFormat, {
          quality,
          width: resizeWidth ? parseInt(resizeWidth) : undefined,
          height: resizeHeight ? parseInt(resizeHeight) : undefined,
          maintainAspect,
          filter,
          rotate,
        });
        setResultBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      } else if (category === "data") {
        const text = await file.text();
        const result = convertData(text, sourceFormat as DataSourceFormat, targetFormat as DataTargetFormat, {
          delimiter,
          hasHeader,
          indent,
          tableName: sqlTableName,
        });
        setResultText(result);
        try { setDataStats(getDataStats(text, sourceFormat as DataSourceFormat)); } catch { /* ignore */ }
      } else if (category === "document") {
        const text = await file.text();
        const result = await convertDocument(text, sourceFormat as DocumentFormat, targetFormat as DocumentFormat);
        setResultText(result);
        setDocStats(getDocStats(text));
      } else if (category === "audio") {
        const blob = await convertAudio(file, targetFormat as AudioTargetFormat, { bitrate });
        setResultBlob(blob);
        setPreviewAudioUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  }, [
    file, category, sourceFormat, targetFormat,
    quality, resizeWidth, resizeHeight, maintainAspect, filter, rotate,
    delimiter, hasHeader, indent, sqlTableName,
    bitrate,
  ]);

  const handleApplyCase = () => {
    if (!caseMode || !resultText) return;
    setResultText(convertCase(resultText, caseMode));
  };

  const handleDownload = async () => {
    if (resultBlob) {
      const ext = targetFormat === "jpeg" ? "jpg" : targetFormat;
      const base = fileName.replace(/\.[^.]+$/, "") || "converted";
      const attributed = await attributeBlob(resultBlob);
      const link = document.createElement("a");
      link.download = `${base}.${ext}`;
      link.href = URL.createObjectURL(attributed);
      link.click();
      URL.revokeObjectURL(link.href);
    } else if (resultText) {
      const ext = targetFormat;
      const base = fileName.replace(/\.[^.]+$/, "") || "converted";
      const blob = new Blob([attributeText(resultText)], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.download = `${base}.${ext}`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const showConvert = category && sourceFormat && targetFormat && file;
  const showResult = resultBlob || resultText;

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleFileDrop}>
      <Navbar title="converter" jp="ファイル変換" category="files" href="/files/converter" />
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
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. TYPE */}
            <section>
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. type{" "}
                <ScrambleText
                  text={"タイプ"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handleCategory(cat.key)}
                    className={`text-[10px] py-3 px-4 border tracking-[0.2em] uppercase transition-all text-center ${
                      category === cat.key
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {cat.label}{" "}
                    <ScrambleText
                      text={cat.jp}
                      chars={jpchars}
                      timeOffset={100}
                      autoPlay
                      className="text-xs text-white/35"
                    />
                  </button>
                ))}
              </div>
            </section>

            {category && (
              <>
                {/* 02. FORMAT */}
                <section className="space-y-4">
                  <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                    02. format{" "}
                    <ScrambleText
                      text={"フォーマット"}
                      chars={jpchars}
                      timeOffset={100}
                      autoPlay
                      className="text-sm text-white/35"
                    />
                  </div>

                  <div>
                    <div className="text-[10px] tracking-widest uppercase text-white/40 mb-2">
                      source
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sourceFormats.map((fmt) => (
                        <button
                          key={`src-${fmt}`}
                          onClick={() => setSourceFormat(fmt)}
                          className={`text-sm px-3 py-1.5 border tracking-[0.1em] uppercase transition-all ${
                            sourceFormat === fmt
                              ? "bg-white text-black border-white font-bold"
                              : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] tracking-widest uppercase text-white/40 mb-2">
                      target
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {targetFormats.map((fmt) => (
                        <button
                          key={`tgt-${fmt}`}
                          onClick={() => setTargetFormat(fmt)}
                          className={`text-sm px-3 py-1.5 border tracking-[0.1em] uppercase transition-all ${
                            targetFormat === fmt
                              ? "bg-white text-black border-white font-bold"
                              : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 03. SOURCE */}
                <section className="space-y-6">
                  <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                    03. source{" "}
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
                      {file ? fileName : "upload_file"}
                    </span>
                    <input
                      type="file"
                      onChange={handleUpload}
                      className="hidden"
                      accept={
                        category === "image"
                          ? "image/*,.svg"
                          : category === "data"
                            ? ".json,.csv,.yaml,.yml,.xml"
                            : category === "document"
                              ? ".md,.markdown,.html,.htm,.txt"
                              : "audio/*"
                      }
                    />
                  </label>

                  {/* Image info */}
                  {imageInfo && (
                    <div className="text-[10px] text-white/40 tracking-widest uppercase space-y-1">
                      <div>{imageInfo.width} × {imageInfo.height}px</div>
                      <div>{(imageInfo.size / 1024).toFixed(1)} KB</div>
                    </div>
                  )}

                  {/* Audio info */}
                  {audioInfo && (
                    <div className="text-[10px] text-white/40 tracking-widest uppercase space-y-1">
                      <div>{audioInfo.duration.toFixed(1)}s</div>
                      <div>{audioInfo.sampleRate} Hz · {audioInfo.channels}ch</div>
                      <div>{(audioInfo.size / 1024).toFixed(1)} KB</div>
                    </div>
                  )}

                  {/* Image config */}
                  {file && category === "image" && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-[12px] text-white/40 uppercase tracking-widest">
                          <span>Quality</span>
                          <span>{quality}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer hover:bg-white/20 transition-all"
                        />
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Width</div>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={resizeWidth}
                            onChange={(e) => setResizeWidth(e.target.value)}
                            placeholder="auto"
                            className="w-full bg-transparent border-b border-white/10 text-xs text-white/70 px-1 py-1 outline-none focus:border-white/40"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Height</div>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={resizeHeight}
                            onChange={(e) => setResizeHeight(e.target.value)}
                            placeholder="auto"
                            className="w-full bg-transparent border-b border-white/10 text-xs text-white/70 px-1 py-1 outline-none focus:border-white/40"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setMaintainAspect(!maintainAspect)}
                        className="flex items-center gap-4 group"
                      >
                        <div className={`w-4 h-4 border border-white/20 transition-all ${maintainAspect ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-transparent"}`} />
                        <span className={`text-[10px] tracking-widest uppercase transition-colors ${maintainAspect ? "text-white" : "text-white/30"}`}>
                          maintain_aspect
                        </span>
                      </button>

                      {/* Filter */}
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">filter</div>
                        <div className="flex flex-wrap gap-1.5">
                          {FILTERS.map((f) => (
                            <button
                              key={f.key}
                              onClick={() => setFilter(f.key)}
                              className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                                filter === f.key
                                  ? "bg-white text-black border-white font-bold"
                                  : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rotation */}
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">rotate</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ROTATIONS.map((r) => (
                            <button
                              key={r.key}
                              onClick={() => setRotate(r.key)}
                              className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                                rotate === r.key
                                  ? "bg-white text-black border-white font-bold"
                                  : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                              }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data config */}
                  {file && category === "data" && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">CSV delimiter</div>
                        <div className="flex gap-1.5">
                          {[",", ";", "\t", "|"].map((d) => (
                            <button
                              key={d}
                              onClick={() => setDelimiter(d)}
                              className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                                delimiter === d
                                  ? "bg-white text-black border-white font-bold"
                                  : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                              }`}
                            >
                              {d === "\t" ? "TAB" : d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setHasHeader(!hasHeader)}
                        className="flex items-center gap-4 group"
                      >
                        <div className={`w-4 h-4 border border-white/20 transition-all ${hasHeader ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-transparent"}`} />
                        <span className={`text-[10px] tracking-widest uppercase transition-colors ${hasHeader ? "text-white" : "text-white/30"}`}>
                          header_row
                        </span>
                      </button>

                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Indent</div>
                        <div className="flex gap-1.5">
                          {[2, 4, 8].map((n) => (
                            <button
                              key={n}
                              onClick={() => setIndent(n)}
                              className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                                indent === n
                                  ? "bg-white text-black border-white font-bold"
                                  : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      {targetFormat === "sql" && (
                        <div>
                          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Table name</div>
                          <input
                            type="text"
                            value={sqlTableName}
                            onChange={(e) => setSqlTableName(e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 text-xs text-white/70 px-1 py-1 outline-none focus:border-white/40"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio config */}
                  {file && category === "audio" && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Bitrate</div>
                        <div className="flex flex-wrap gap-1.5">
                          {AUDIO_BITRATES.map((b) => (
                            <button
                              key={b}
                              onClick={() => setBitrate(b)}
                              className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                                bitrate === b
                                  ? "bg-white text-black border-white font-bold"
                                  : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                              }`}
                            >
                              {b}k
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {showConvert && (
              <button
                onClick={handleConvert}
                disabled={converting}
                className="w-full bg-white text-black uppercase text-xs tracking-[0.3em] font-bold py-4 hover:bg-white/90 transition-all disabled:opacity-30"
              >
                {converting ? "converting…" : "convert"}
              </button>
            )}
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col items-center justify-center bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {error && (
              <div className="text-red-400 text-xs tracking-widest uppercase mb-4">
                {error}
              </div>
            )}

            {showResult ? (
              <div className="w-full h-full flex flex-col items-center">
                {/* Image preview */}
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="max-w-full max-h-[60vh] object-contain mb-6"
                  />
                )}

                {/* Audio preview */}
                {previewAudioUrl && (
                  <AudioPlayer key={previewAudioUrl} src={previewAudioUrl} fileName={fileName} />
                )}

                {/* Text/data preview */}
                {resultText && (
                  <pre className="w-full max-h-[60vh] overflow-auto text-xs text-white/80 font-mono leading-relaxed whitespace-pre-wrap break-all custom-scrollbar bg-white/5 p-4 border border-white/10">
                    {resultText.length > 50000
                      ? resultText.slice(0, 50000) + "\n\n... (truncated)"
                      : resultText}
                  </pre>
                )}

                {/* Data stats */}
                {dataStats && (
                  <div className="w-full mt-4 text-[10px] text-white/40 tracking-widest uppercase space-y-1">
                    <div>{dataStats.rowCount} rows · {dataStats.columns.length} columns</div>
                    <div className="flex flex-wrap gap-x-4">
                      {dataStats.columns.map((col) => (
                        <span key={col.name}>
                          {col.name}: {col.type}{col.nullCount > 0 ? ` (${col.nullCount} null)` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doc stats */}
                {docStats && (
                  <div className="w-full mt-4 text-[10px] text-white/40 tracking-widest uppercase space-y-1">
                    <div>
                      {docStats.wordCount} words · {docStats.charCount} chars · {docStats.lineCount} lines · {docStats.paragraphCount} paragraphs
                    </div>
                    {/* Case conversion */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
                      <span className="text-white/50">case:</span>
                      {CASE_MODES.map((m) => (
                        <button
                          key={m.key}
                          onClick={() => { setCaseMode(m.key); handleApplyCase(); }}
                          className={`text-[10px] px-2 py-1 border tracking-[0.05em] transition-all ${
                            caseMode === m.key
                              ? "bg-white text-black border-white font-bold"
                              : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download bar */}
                <div className="mt-6 flex justify-between items-center w-full">
                  <span className="text-[12px] uppercase tracking-widest text-white/50">
                    {resultBlob
                      ? `${(resultBlob.size / 1024).toFixed(1)} KB`
                      : `${resultText.length.toLocaleString()} chars`}
                  </span>
                  <button
                    onClick={handleDownload}
                    className="text-[14px] uppercase tracking-widest border-b border-white/20 text-white/50 hover:text-white cursor-pointer"
                  >
                    download_{targetFormat}
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
