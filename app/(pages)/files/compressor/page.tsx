"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import JSZip from "jszip";
import { ATTRIBUTION } from "@/lib/attribution";

type CompressionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface FileEntry {
  id: string;
  file: File;
}

const LEVELS: { level: CompressionLevel; label: string; jp: string }[] = [
  { level: 0, label: "store", jp: "無圧縮" },
  { level: 1, label: "fast", jp: "高速" },
  { level: 6, label: "normal", jp: "標準" },
  { level: 9, label: "maximum", jp: "最大" },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export default function CompressorPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [level, setLevel] = useState<CompressionLevel>(6);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const totalBytes = useMemo(
    () => files.reduce((sum, e) => sum + e.file.size, 0),
    [files],
  );

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((e) => e.file.name + e.file.size));
      const added = Array.from(newFiles)
        .filter((f) => !existing.has(f.name + f.size))
        .map((f) => ({ id: generateId(), file: f }));
      return [...prev, ...added];
    });
    setResultBlob(null);
    setError(null);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((e) => e.id !== id));
    setResultBlob(null);
    setError(null);
  }, []);

  // Drag-drop handlers
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (dragCounter.current === 1) setDragging(true);
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current <= 0) { dragCounter.current = 0; setDragging(false); }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    };
    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [addFiles]);

  const handleCompress = useCallback(async () => {
    if (files.length === 0) return;
    setCompressing(true);
    setProgress(0);
    setError(null);
    setResultBlob(null);
    try {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        const { file } = files[i];
        zip.file(file.name, file);
        setProgress(Math.round(((i + 1) / files.length) * 50));
      }
      (zip as any).comment = ATTRIBUTION;
      const blob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level } },
        (meta) => {
          setProgress(50 + Math.round(meta.percent / 2));
        },
      );
      setResultBlob(blob);
      setResultSize(blob.size);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed");
    } finally {
      setCompressing(false);
    }
  }, [files, level]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const link = document.createElement("a");
    link.download = "archive.zip";
    link.href = URL.createObjectURL(resultBlob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const savings = totalBytes > 0 && resultSize > 0
    ? ((1 - resultSize / totalBytes) * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="compressor" jp="ファイル圧縮" category="files" href="/files/compressor" />
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
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. FILES */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. files{" "}
                <ScrambleText
                  text={"ファイル"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                <span className="text-xs text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">
                  {files.length > 0 ? `${files.length} file(s) selected` : "add_files"}
                </span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  className="hidden"
                />
              </label>
              {files.length > 0 && (
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                  {files.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between border border-white/5 px-2 py-1 group"
                    >
                      <div className="text-[10px] text-white/70 truncate flex-1 min-w-0">
                        {entry.file.name}
                      </div>
                      <div className="text-[9px] text-white/30 shrink-0 ml-2">
                        {formatFileSize(entry.file.size)}
                      </div>
                      <button
                        onClick={() => removeFile(entry.id)}
                        className="text-[9px] text-white/20 hover:text-white/70 ml-2 shrink-0 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {files.length > 0 && (
                <div className="text-[10px] text-white/40 tracking-widest uppercase">
                  total: {formatFileSize(totalBytes)} ({files.length} files)
                </div>
              )}
            </section>

            {/* 02. LEVEL */}
            <section className="space-y-3">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. compression{" "}
                <ScrambleText
                  text={"圧縮レベル"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.level}
                    onClick={() => setLevel(l.level)}
                    className={`text-[10px] py-3 px-4 border tracking-[0.2em] uppercase transition-all text-center ${
                      level === l.level
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {l.label}{" "}
                    <ScrambleText
                      text={l.jp}
                      chars={jpchars}
                      timeOffset={100}
                      autoPlay
                      className="text-xs text-white/35"
                    />
                  </button>
                ))}
              </div>
            </section>

            {files.length > 0 && (
              <button
                onClick={handleCompress}
                disabled={compressing}
                className="w-full bg-white text-black uppercase text-xs tracking-[0.3em] font-bold py-4 hover:bg-white/90 transition-all disabled:opacity-30"
              >
                {compressing ? "compressing…" : "compress"}
              </button>
            )}
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {error && (
              <div className="text-red-400 text-xs tracking-widest uppercase mb-4">
                {error}
              </div>
            )}

            {compressing && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <ScrambleText
                  text="compressing…"
                  className="text-white/30 text-xs tracking-[0.5em] italic"
                />
                <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-200 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30 tracking-widest">{progress}%</span>
              </div>
            )}

            {resultBlob && !compressing && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="text-center space-y-3">
                  <div className="text-[10px] text-white/40 tracking-widest uppercase">
                    original
                  </div>
                  <div className="text-lg font-mono text-white/80">
                    {formatFileSize(totalBytes)}
                  </div>
                </div>
                <svg className="w-6 h-6 text-white/30 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                <div className="text-center space-y-3">
                  <div className="text-[10px] text-white/40 tracking-widest uppercase">
                    compressed
                  </div>
                  <div className="text-lg font-mono text-white/80">
                    {formatFileSize(resultSize)}
                  </div>
                </div>
                {savings !== null && (
                  <div className="text-[10px] text-white/30 tracking-widest uppercase">
                    saved {savings}%
                  </div>
                )}
                <button
                  onClick={handleDownload}
                  className="text-[14px] uppercase tracking-widest border-b border-white/20 text-white/50 hover:text-white cursor-pointer mt-4"
                >
                  download_archive.zip
                </button>
              </div>
            )}

            {!resultBlob && !compressing && files.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <ScrambleText
                  text="null_data_idle"
                  className="text-white/10 text-xs tracking-[0.5em] italic"
                />
              </div>
            )}

            {!resultBlob && !compressing && files.length > 0 && !error && (
              <div className="flex-1 flex items-center justify-center">
                <ScrambleText
                  text="select_level_and_compress"
                  className="text-white/10 text-xs tracking-[0.5em] italic"
                />
              </div>
            )}
          </motion.main>
        </div>
      </div>

      {/* Drop overlay */}
      {dragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <div className="border-2 border-dashed border-white/30 p-16 text-center">
            <div className="text-sm text-white/70 uppercase tracking-[0.3em]">
              drop files
            </div>
            <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-2">
              anywhere on the page
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}