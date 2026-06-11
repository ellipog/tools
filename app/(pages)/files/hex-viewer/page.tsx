"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";

const BYTES_PER_PAGE = 256;
const BYTE_OPTIONS = [8, 16, 32] as const;
type BytesPerRow = (typeof BYTE_OPTIONS)[number];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

interface HexRow {
  offset: number;
  hex: string;
  ascii: string;
}

function buildRows(data: Uint8Array, bytesPerRow: number): HexRow[] {
  const rows: HexRow[] = [];
  for (let i = 0; i < data.length; i += bytesPerRow) {
    const slice = data.slice(i, i + bytesPerRow);
    const hex = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    const ascii = Array.from(slice)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join("");
    rows.push({ offset: i, hex, ascii });
  }
  return rows;
}

export default function HexViewerPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [data, setData] = useState<Uint8Array | null>(null);
  const [bytesPerRow, setBytesPerRow] = useState<BytesPerRow>(16);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalPages = data ? Math.max(1, Math.ceil(data.length / BYTES_PER_PAGE)) : 0;

  const pageRows = useMemo(() => {
    if (!data) return [];
    const start = page * BYTES_PER_PAGE;
    const end = Math.min(start + BYTES_PER_PAGE, data.length);
    const chunk = data.slice(start, end);
    return buildRows(chunk, bytesPerRow);
  }, [data, page, bytesPerRow]);

  const reset = () => {
    abortRef.current?.abort();
    setFile(null);
    setFileName("");
    setFileSize(0);
    setData(null);
    setPage(0);
    setError(null);
  };

  const loadFile = async (f: File) => {
    reset();
    setFile(f);
    setFileName(f.name);
    setFileSize(f.size);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const buffer = await f.arrayBuffer();
      if (controller.signal.aborted) return;
      setData(new Uint8Array(buffer));
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Failed to read file");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const handleUpload = (f: File) => loadFile(f);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)));
  }, [totalPages]);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleUpload}>
        <Navbar title="hex-viewer" jp="16進表示" category="files" />
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
                    {file ? fileName : "upload_file"}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                {file && (
                  <div className="text-[10px] text-white/40 tracking-widest uppercase space-y-1">
                    <div>{fileName}</div>
                    <div>{formatFileSize(fileSize)}</div>
                  </div>
                )}
              </section>

              {/* 02. BYTES PER ROW */}
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  02. bytes / row{" "}
                  <ScrambleText
                    text="1行あたり"
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BYTE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => { setBytesPerRow(n); setPage(0); }}
                      className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                        bytesPerRow === n
                          ? "bg-white text-black border-white font-bold"
                          : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </section>

              {/* 03. PAGE NAV */}
              {data && (
                <section className="space-y-3">
                  <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                    03. navigation{" "}
                    <ScrambleText
                      text="ナビゲーション"
                      chars={jpchars}
                      timeOffset={100}
                      autoPlay
                      className="text-sm text-white/35"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(0)}
                      disabled={page === 0}
                      className="text-[10px] px-2 py-1 border border-white/10 text-white/30 hover:text-white hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      {"<<"}
                    </button>
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 0}
                      className="text-[10px] px-2 py-1 border border-white/10 text-white/30 hover:text-white hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      {"<"}
                    </button>
                    <span className="text-[10px] tracking-widest text-white/50 whitespace-nowrap">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="text-[10px] px-2 py-1 border border-white/10 text-white/30 hover:text-white hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      {">"}
                    </button>
                    <button
                      onClick={() => goToPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      className="text-[10px] px-2 py-1 border border-white/10 text-white/30 hover:text-white hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      {">>"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 tracking-widest">goto:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={`1-${totalPages}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt((e.target as HTMLInputElement).value);
                          if (!isNaN(val) && val >= 1 && val <= totalPages) {
                            goToPage(val - 1);
                          }
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="w-16 bg-transparent border-b border-white/10 text-xs text-white/70 px-1 py-1 outline-none focus:border-white/40"
                    />
                  </div>
                </section>
              )}
            </motion.aside>

            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-8 flex flex-col bg-white/2 border border-white/5 min-h-[60vh] p-0"
            >
              {error && (
                <div className="text-red-400 text-xs tracking-widest uppercase p-8">
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex-1 flex items-center justify-center">
                  <ScrambleText
                    text="loading…"
                    className="text-white/30 text-xs tracking-[0.5em] italic"
                  />
                </div>
              )}

              {data && !loading && (
                <div className="w-full overflow-x-auto custom-scrollbar">
                  {/* Header */}
                  <div className="flex text-[10px] text-white/30 tracking-widest uppercase border-b border-white/10 bg-white/[0.02]">
                    <div className="shrink-0 w-28 px-3 py-2">offset</div>
                    <div className="flex-1 px-3 py-2">hex</div>
                    <div className="shrink-0 w-48 px-3 py-2 border-l border-white/10">ascii</div>
                  </div>
                  {/* Rows */}
                  <div className="font-mono text-[12px] leading-relaxed">
                    {pageRows.map((row) => (
                      <div
                        key={row.offset}
                        className="flex border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="shrink-0 w-28 px-3 py-0.5 text-white/30 tracking-wider">
                          {row.offset.toString(16).padStart(8, "0")}
                        </div>
                        <div className="flex-1 px-3 py-0.5 text-white/80 tracking-wider">
                          {row.hex}
                        </div>
                        <div className="shrink-0 w-48 px-3 py-0.5 text-white/50 border-l border-white/10">
                          {row.ascii}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Footer */}
                  <div className="text-[10px] text-white/30 tracking-widest uppercase border-t border-white/10 px-3 py-2 bg-white/[0.02]">
                    showing {page * BYTES_PER_PAGE + 1}–{Math.min((page + 1) * BYTES_PER_PAGE, data.length)} of {data.length} bytes
                  </div>
                </div>
              )}

              {!data && !loading && !error && (
                <div className="flex-1 flex items-center justify-center">
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