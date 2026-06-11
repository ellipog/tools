"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";

type AlgoKey = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
type HashResult = Record<AlgoKey, string>;

const ALGOS: AlgoKey[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

function bytesToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

async function computeHashes(file: File, selected: AlgoKey[]): Promise<HashResult> {
  const buffer = await file.arrayBuffer();
  const entries = await Promise.all(
    selected.map(async (algo) => {
      const hash = await crypto.subtle.digest(algo, buffer);
      return [algo, bytesToHex(hash)] as [AlgoKey, string];
    }),
  );
  return Object.fromEntries(entries) as HashResult;
}

export default function HashPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [results, setResults] = useState<HashResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<AlgoKey[]>([...ALGOS]);

  const toggleAlgo = (algo: AlgoKey) => {
    setSelected((prev) =>
      prev.includes(algo) ? prev.filter((a) => a !== algo) : [...prev, algo],
    );
  };

  const reset = () => {
    setFile(null);
    setFileName("");
    setFileSize(0);
    setResults(null);
    setError(null);
    setCopied(null);
  };

  const handleUpload = (f: File) => {
    reset();
    setFile(f);
    setFileName(f.name);
    setFileSize(f.size);
  };

  const handleCompute = useCallback(async () => {
    if (!file || selected.length === 0) return;
    setComputing(true);
    setError(null);
    setResults(null);
    try {
      const hashes = await computeHashes(file, selected);
      setResults(hashes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hash computation failed");
    } finally {
      setComputing(false);
    }
  }, [file, selected]);

  const copyHash = async (algo: AlgoKey, hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(algo);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleUpload}>
        <Navbar title="hash" jp="ハッシュ生成" category="files" />
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

              {/* 02. ALGORITHMS */}
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  02. algorithms{" "}
                  <ScrambleText
                    text={"アルゴリズム"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                {ALGOS.map((algo) => (
                  <button
                    key={algo}
                    onClick={() => toggleAlgo(algo)}
                    className="flex items-center gap-4 group w-full"
                  >
                    <div
                      className={`w-4 h-4 border transition-all shrink-0 ${
                        selected.includes(algo)
                          ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] border-white"
                          : "border-white/20"
                      }`}
                    />
                    <span
                      className={`text-[10px] tracking-widest uppercase transition-colors ${
                        selected.includes(algo) ? "text-white" : "text-white/30"
                      }`}
                    >
                      {algo}
                    </span>
                  </button>
                ))}
              </section>

              {file && selected.length > 0 && (
                <button
                  onClick={handleCompute}
                  disabled={computing}
                  className="w-full bg-white text-black uppercase text-xs tracking-[0.3em] font-bold py-4 hover:bg-white/90 transition-all disabled:opacity-30"
                >
                  {computing ? "computing…" : "compute"}
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

              {results ? (
                <div className="w-full space-y-6">
                  <div className="text-[10px] text-white/40 tracking-widest uppercase pb-2 border-b border-white/10">
                    {fileName} — {formatFileSize(fileSize)}
                  </div>
                  {ALGOS.filter((a) => results[a]).map((algo) => (
                    <div key={algo} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-white/50">
                          {algo}
                        </span>
                        <button
                          onClick={() => copyHash(algo, results[algo])}
                          className="text-[9px] uppercase tracking-widest border border-white/10 px-2 py-0.5 text-white/40 hover:text-white hover:border-white/30 transition-all"
                        >
                          {copied === algo ? "copied" : "copy"}
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-white/80 bg-white/5 border border-white/10 p-3 break-all select-all leading-relaxed">
                        {results[algo]}
                      </div>
                    </div>
                  ))}
                </div>
              ) : file && !computing ? (
                <div className="flex-1 flex items-center justify-center">
                  <ScrambleText
                    text="select_algorithms_and_compute"
                    className="text-white/10 text-xs tracking-[0.5em] italic"
                  />
                </div>
              ) : computing ? (
                <div className="flex-1 flex items-center justify-center">
                  <ScrambleText
                    text="computing…"
                    className="text-white/30 text-xs tracking-[0.5em] italic"
                  />
                </div>
              ) : (
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