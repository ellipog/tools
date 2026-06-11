"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import ShareButton from "@/components/ShareButton";
import { jpcharlist } from "@/public/data/charlists";
import {
  formatJSON,
  tokenizeJSON,
  FormatMode,
  FormatOptions,
} from "@/lib/json-formatter";

const INDENT_OPTIONS = [2, 4] as const;

export default function JsonFormatterPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<FormatMode>("format");
  const [indentSize, setIndentSize] = useState<number>(2);
  const [useTabs, setUseTabs] = useState(false);
  const [sortKeys, setSortKeys] = useState(false);
  const [stripCommas, setStripCommas] = useState(true);
  const [copyLabel, setCopyLabel] = useState("copy");

  const opts: FormatOptions = useMemo(
    () => ({ indentSize, useTabs, sortKeys, stripTrailingComma: stripCommas }),
    [indentSize, useTabs, sortKeys, stripCommas],
  );

  const result = useMemo(() => formatJSON(input, mode, opts), [input, mode, opts]);

  const tokens = useMemo(
    () => (result.success ? tokenizeJSON(result.output) : []),
    [result.success, result.output],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.output);
    setCopyLabel("copied");
    setTimeout(() => setCopyLabel("copy"), 2000);
  }, [result.output]);

  const handleDownload = useCallback(() => {
    const ext = mode === "yaml" ? "yaml" : "json";
    const blob = new Blob([result.output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result.output, mode]);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  const modes: { id: FormatMode; label: string; jp: string }[] = [
    { id: "format", label: "format", jp: "整形" },
    { id: "minify", label: "minify", jp: "圧縮" },
    { id: "yaml", label: "yaml", jp: "YAML" },
  ];

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="json-formatter" jp="JSON整形" category="text" />

      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                result.success ? "bg-green-500" : input ? "bg-red-500" : "bg-white/20"
              }`}
            />
            {result.success ? "valid" : input ? "error" : "idle"}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. MODE */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. mode{" "}
                <ScrambleText
                  text="モード"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="flex gap-1.5">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex-1 border p-2 text-[10px] uppercase tracking-widest transition-all ${
                      mode === m.id
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 02. INDENT */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. indent{" "}
                <ScrambleText
                  text="字下げ"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="flex gap-1.5">
                {INDENT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setIndentSize(n);
                      setUseTabs(false);
                    }}
                    className={`flex-1 border p-2 text-[10px] uppercase tracking-widest transition-all ${
                      !useTabs && indentSize === n
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setUseTabs(!useTabs)}
                  className={`flex-1 border p-2 text-[10px] uppercase tracking-widest transition-all ${
                    useTabs
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                  }`}
                >
                  tab
                </button>
              </div>
            </section>

            {/* 03. OPTIONS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. options{" "}
                <ScrambleText
                  text="設定"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sortKeys}
                    onChange={(e) => setSortKeys(e.target.checked)}
                    className="w-3.5 h-3.5 accent-white"
                  />
                  <span className="text-[10px] tracking-widest text-white/50 group-hover:text-white/70 transition-colors uppercase">
                    sort_keys
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={stripCommas}
                    onChange={(e) => setStripCommas(e.target.checked)}
                    className="w-3.5 h-3.5 accent-white"
                  />
                  <span className="text-[10px] tracking-widest text-white/50 group-hover:text-white/70 transition-colors uppercase">
                    strip_trailing_commas
                  </span>
                </label>
              </div>
            </section>

            {/* 04. STATS */}
            {result.success && input && (
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  04. stats{" "}
                  <ScrambleText
                    text="統計"
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] tracking-widest uppercase">
                  <div className="border border-white/10 p-2">
                    <div className="text-white/30">size</div>
                    <div className="text-white/80">{formatSize(result.stats.size)}</div>
                  </div>
                  <div className="border border-white/10 p-2">
                    <div className="text-white/30">lines</div>
                    <div className="text-white/80">{result.stats.lines}</div>
                  </div>
                  <div className="border border-white/10 p-2">
                    <div className="text-white/30">depth</div>
                    <div className="text-white/80">{result.stats.depth}</div>
                  </div>
                  <div className="border border-white/10 p-2">
                    <div className="text-white/30">keys</div>
                    <div className="text-white/80">{result.stats.keyCount}</div>
                  </div>
                </div>
              </section>
            )}

            {/* 05. ACTIONS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                05. actions{" "}
                <ScrambleText
                  text="操作"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopy}
                  disabled={!result.success || !input}
                  className="flex-1 border border-white/10 p-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  {copyLabel}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!result.success || !input}
                  className="flex-1 border border-white/10 p-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  download
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 border border-white/10 p-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all"
                >
                  clear
                </button>
              </div>
            </section>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            {/* INPUT */}
            <div className="bg-white/[0.02] border border-white/5 min-h-[25vh]">
              <div className="text-[10px] text-white/20 uppercase tracking-[0.4em] px-4 pt-3 pb-1">
                <ScrambleText text="input" />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='{"key": "value"}'
                spellCheck={false}
                className="w-full h-full min-h-[20vh] bg-transparent text-white/80 font-mono text-[13px] p-4 outline-none resize-y placeholder:text-white/15 selection:bg-white selection:text-black"
              />
            </div>

            {/* OUTPUT */}
            <div className="bg-[#050505] border border-white/5 min-h-[30vh] flex flex-col relative">
              <div className="absolute top-3 left-4 text-[10px] text-white/20 uppercase tracking-[0.4em] z-10">
                <ScrambleText text={`output :: ${mode}`} />
              </div>
              <div className="absolute top-3 right-4 z-10">
                {result.success && input && (
                  <ShareButton
                    data={result.output}
                    filename={`formatted.${mode === "yaml" ? "yaml" : "json"}`}
                  />
                )}
              </div>

              {result.success && input ? (
                <pre className="font-mono text-[13px] p-4 pt-10 whitespace-pre-wrap break-all overflow-x-auto custom-scrollbar flex-1 selection:bg-white selection:text-black">
                  {tokens.map((t, i) => (
                    <span key={i} className={t.color}>
                      {t.text}
                    </span>
                  ))}
                </pre>
              ) : !input ? (
                <div className="flex-1 flex items-center justify-center">
                  <ScrambleText
                    text="awaiting_input"
                    className="text-white/10 text-xs tracking-[0.5em] italic"
                  />
                </div>
              ) : (
                <div className="p-4 pt-10 flex-1">
                  <div className="text-red-400 text-[11px] font-mono">
                    <span className="text-red-400/60 text-[10px] tracking-widest uppercase block mb-2">
                      error
                    </span>
                    {result.error && (
                      <div className="mb-1 text-white/40 text-[10px]">
                        line {result.error.line}, col {result.error.col}
                      </div>
                    )}
                    {result.output}
                  </div>
                </div>
              )}

              {result.success && input && (
                <div className="text-[10px] text-white/20 uppercase tracking-[0.4em] px-4 py-2 border-t border-white/5">
                  <ScrambleText
                    text={`${result.stats.size}B ⋅ ${result.stats.lines} lines ⋅ depth ${result.stats.depth} ⋅ ${result.stats.keyCount} keys`}
                  />
                </div>
              )}
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}