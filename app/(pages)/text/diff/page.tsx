"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import ShareButton from "@/components/ShareButton";
import { jpcharlist } from "@/public/data/charlists";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  computeDiff,
  toSideBySide,
  toUnified,
  toInline,
  formatPatch,
  type DiffMode,
  type DiffGranularity,
  type DiffOptions,
  type SideBySideLine,
  type UnifiedLine,
  type InlineLine,
} from "@/lib/diff-engine";

const GRANULARITY_OPTIONS: { value: DiffGranularity; label: string }[] = [
  { value: "line", label: "line" },
  { value: "word", label: "word" },
  { value: "char", label: "char" },
];

const MODE_OPTIONS: { value: DiffMode; label: string }[] = [
  { value: "side-by-side", label: "side-by-side" },
  { value: "unified", label: "unified" },
  { value: "inline", label: "inline" },
];

export default function DiffPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [mode, setMode] = useLocalStorage<DiffMode>("runen:diff-mode", "side-by-side");
  const [granularity, setGranularity] = useLocalStorage<DiffGranularity>("runen:diff-granularity", "line");
  const [ignoreWhitespace, setIgnoreWhitespace] = useLocalStorage("runen:diff-ignore-whitespace", false);
  const [wordWrap, setWordWrap] = useLocalStorage("runen:diff-word-wrap", false);
  const [caseSensitive, setCaseSensitive] = useLocalStorage("runen:diff-case-sensitive", true);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const diffOpts: DiffOptions = useMemo(
    () => ({ ignoreWhitespace, caseSensitive }),
    [ignoreWhitespace, caseSensitive],
  );

  const result = useMemo(
    () => computeDiff(textA, textB, granularity, diffOpts),
    [textA, textB, granularity, diffOpts],
  );

  const sideBySideLines = useMemo(
    () => toSideBySide(result.changes),
    [result.changes],
  );

  const unifiedLines = useMemo(
    () => toUnified(result.changes),
    [result.changes],
  );

  const inlineLines = useMemo(
    () => toInline(result.changes),
    [result.changes],
  );

  const patchContent = useMemo(
    () => formatPatch(result.changes),
    [result.changes],
  );

  const handleSwap = () => {
    setTextA(textB);
    setTextB(textA);
  };

  const handleFileLoad = (
    setter: (v: string) => void,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsText(file);
  };

  const handleScroll = useCallback(
    (source: "left" | "right") => {
      if (syncing.current) return;
      syncing.current = true;
      const src = source === "left" ? leftRef.current : rightRef.current;
      const tgt = source === "left" ? rightRef.current : leftRef.current;
      if (src && tgt) {
        const pct = src.scrollTop / (src.scrollHeight - src.clientHeight || 1);
        tgt.scrollTop = pct * (tgt.scrollHeight - tgt.clientHeight || 1);
      }
      setTimeout(() => {
        syncing.current = false;
      }, 16);
    },
    [],
  );

  const showDiff = textA && textB;

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="diff" jp="差分" category="text" href="/text/diff" />

      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                !showDiff
                  ? "bg-white/20"
                  : result.stats.added === 0 && result.stats.removed === 0
                    ? "bg-green-500"
                    : "bg-yellow-500"
              }`}
            />
            {!showDiff
              ? "awaiting"
              : result.stats.added === 0 && result.stats.removed === 0
                ? "no differences"
                : `${result.stats.added} added · ${result.stats.removed} removed`}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. INPUTS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. inputs{" "}
                <ScrambleText
                  text="入力"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] tracking-widest text-white/30 uppercase">input a</span>
                    <label className="text-[9px] tracking-widest text-white/20 hover:text-white/40 cursor-pointer uppercase">
                      upload
                      <input
                        type="file"
                        accept=".txt,.js,.ts,.md,.css,.html,.json,.xml,.yaml,.yml"
                        onChange={handleFileLoad(setTextA)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    value={textA}
                    onChange={(e) => setTextA(e.target.value)}
                    placeholder="Paste or upload text A..."
                    spellCheck={false}
                    className="w-full h-24 bg-transparent border border-white/10 text-white/70 font-mono text-[11px] p-2 outline-none resize-y placeholder:text-white/15 selection:bg-white selection:text-black"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={handleSwap}
                    className="border border-white/10 px-4 py-1 text-[10px] tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                  >
                    swap ↕
                  </button>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] tracking-widest text-white/30 uppercase">input b</span>
                    <label className="text-[9px] tracking-widest text-white/20 hover:text-white/40 cursor-pointer uppercase">
                      upload
                      <input
                        type="file"
                        accept=".txt,.js,.ts,.md,.css,.html,.json,.xml,.yaml,.yml"
                        onChange={handleFileLoad(setTextB)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    value={textB}
                    onChange={(e) => setTextB(e.target.value)}
                    placeholder="Paste or upload text B..."
                    spellCheck={false}
                    className="w-full h-24 bg-transparent border border-white/10 text-white/70 font-mono text-[11px] p-2 outline-none resize-y placeholder:text-white/15 selection:bg-white selection:text-black"
                  />
                </div>
              </div>
            </section>

            {/* 02. CONFIG */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. config{" "}
                <ScrambleText
                  text="設定"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] tracking-widest text-white/30 uppercase mb-1">mode</div>
                  <div className="grid grid-cols-3 gap-1">
                    {MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setMode(opt.value)}
                        className={`border p-1.5 text-[9px] tracking-widest transition-all ${
                          mode === opt.value
                            ? "bg-white text-black border-white font-bold"
                            : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] tracking-widest text-white/30 uppercase mb-1">granularity</div>
                  <div className="grid grid-cols-3 gap-1">
                    {GRANULARITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setGranularity(opt.value)}
                        className={`border p-1.5 text-[9px] tracking-widest transition-all ${
                          granularity === opt.value
                            ? "bg-white text-black border-white font-bold"
                            : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[10px] tracking-widest text-white/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ignoreWhitespace}
                      onChange={() => setIgnoreWhitespace((p) => !p)}
                      className="accent-white"
                    />
                    ignore whitespace
                  </label>
                  <label className="flex items-center gap-2 text-[10px] tracking-widest text-white/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wordWrap}
                      onChange={() => setWordWrap((p) => !p)}
                      className="accent-white"
                    />
                    word wrap
                  </label>
                  <label className="flex items-center gap-2 text-[10px] tracking-widest text-white/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={caseSensitive}
                      onChange={() => setCaseSensitive((p) => !p)}
                      className="accent-white"
                    />
                    case sensitive
                  </label>
                </div>
              </div>
            </section>

            {/* 03. INFO */}
            {showDiff && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  03. info{" "}
                  <ScrambleText
                    text="情報"
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/30"
                  />
                </div>
                <div className="text-[10px] tracking-widest uppercase space-y-1">
                  <div className="flex justify-between border-b border-white/10 py-1">
                    <span className="text-white/30">added</span>
                    <span className="text-white/80">{result.stats.added}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 py-1">
                    <span className="text-white/30">removed</span>
                    <span className="text-white/80">{result.stats.removed}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 py-1">
                    <span className="text-white/30">similarity</span>
                    <span className="text-white/80">{result.stats.similarity}%</span>
                  </div>
                </div>
              </section>
            )}

            {/* 04. EXPORT */}
            {showDiff && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  04. export{" "}
                  <ScrambleText
                    text="エクスポート"
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/30"
                  />
                </div>
                <ShareButton data={patchContent} filename="diff.patch" label="patch" />
              </section>
            )}
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 min-h-[60vh]"
          >
            {!showDiff ? (
              <div className="h-full min-h-[40vh] flex items-center justify-center bg-white/[0.02] border border-white/5">
                <ScrambleText
                  text="paste_or_upload_text_in_both_panels"
                  chars={jpchars}
                  className="text-white/10 text-xs tracking-[0.5em] italic"
                />
              </div>
            ) : mode === "side-by-side" ? (
              <SideBySideView
                lines={sideBySideLines}
                wordWrap={wordWrap}
                leftRef={leftRef}
                rightRef={rightRef}
                onLeftScroll={() => handleScroll("left")}
                onRightScroll={() => handleScroll("right")}
              />
            ) : mode === "unified" ? (
              <UnifiedView lines={unifiedLines} wordWrap={wordWrap} />
            ) : (
              <InlineView lines={inlineLines} wordWrap={wordWrap} />
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}

/* ─── Side-by-Side ─── */

function SideBySideView({
  lines,
  wordWrap,
  leftRef,
  rightRef,
  onLeftScroll,
  onRightScroll,
}: {
  lines: SideBySideLine[];
  wordWrap: boolean;
  leftRef: React.RefObject<HTMLDivElement | null>;
  rightRef: React.RefObject<HTMLDivElement | null>;
  onLeftScroll: () => void;
  onRightScroll: () => void;
}) {
  return (
    <div className="border border-white/5 bg-[#050505] flex flex-col">
      <div className="flex border-b border-white/5">
        <div className="flex-1 text-[10px] tracking-[0.3em] text-white/20 uppercase px-3 py-2 border-r border-white/5">
          old
        </div>
        <div className="flex-1 text-[10px] tracking-[0.3em] text-white/20 uppercase px-3 py-2">
          new
        </div>
      </div>
      <div className="flex min-h-[40vh] max-h-[65vh]">
        <div
          ref={leftRef}
          onScroll={onLeftScroll}
          className={`flex-1 overflow-y-auto overflow-x-hidden border-r border-white/5 custom-scrollbar ${
            wordWrap ? "" : "overflow-x-auto"
          }`}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex items-stretch min-h-[20px] ${
                line.left.type === "rem"
                  ? "bg-red-900/15"
                  : line.left.type === "empty"
                    ? ""
                    : ""
              }`}
            >
              <span className="text-[9px] text-white/15 w-8 shrink-0 text-right pr-1.5 select-none leading-[20px]">
                {line.left.type !== "empty" ? i + 1 : ""}
              </span>
              <span
                className={`font-mono text-[12px] leading-[20px] whitespace-pre ${
                  wordWrap ? "whitespace-pre-wrap break-all" : ""
                } ${
                  line.left.type === "rem"
                    ? "text-red-300/80"
                    : line.left.type === "empty"
                      ? ""
                      : "text-white/70"
                }`}
              >
                {line.left.type === "empty" ? "" : line.left.text || " "}
              </span>
            </div>
          ))}
        </div>
        <div
          ref={rightRef}
          onScroll={onRightScroll}
          className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${
            wordWrap ? "" : "overflow-x-auto"
          }`}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex items-stretch min-h-[20px] ${
                line.right.type === "add"
                  ? "bg-green-900/15"
                  : line.right.type === "empty"
                    ? ""
                    : ""
              }`}
            >
              <span className="text-[9px] text-white/15 w-8 shrink-0 text-right pr-1.5 select-none leading-[20px]">
                {line.right.type !== "empty" ? i + 1 : ""}
              </span>
              <span
                className={`font-mono text-[12px] leading-[20px] whitespace-pre ${
                  wordWrap ? "whitespace-pre-wrap break-all" : ""
                } ${
                  line.right.type === "add"
                    ? "text-green-300/80"
                    : line.right.type === "empty"
                      ? ""
                      : "text-white/70"
                }`}
              >
                {line.right.type === "empty" ? "" : line.right.text || " "}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Unified ─── */

function UnifiedView({
  lines,
  wordWrap,
}: {
  lines: UnifiedLine[];
  wordWrap: boolean;
}) {
  return (
    <div className="border border-white/5 bg-[#050505] min-h-[40vh] max-h-[65vh] overflow-y-auto custom-scrollbar">
      {lines.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-[40vh]">
          <ScrambleText
            text="no_differences_found"
            className="text-white/10 text-xs tracking-[0.5em] italic"
          />
        </div>
      ) : (
        <div className="font-mono text-[12px] leading-[20px]">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex min-h-[20px] ${
                line.prefix === "+"
                  ? "bg-green-900/15"
                  : line.prefix === "-"
                    ? "bg-red-900/15"
                    : ""
              }`}
            >
              <span
                className={`w-5 shrink-0 text-center select-none font-bold ${
                  line.prefix === "+"
                    ? "text-green-400/80"
                    : line.prefix === "-"
                      ? "text-red-400/80"
                      : "text-white/20"
                }`}
              >
                {line.prefix}
              </span>
              <span
                className={`flex-1 whitespace-pre ${
                  wordWrap ? "whitespace-pre-wrap break-all" : ""
                } ${
                  line.prefix === "+"
                    ? "text-green-300/80"
                    : line.prefix === "-"
                      ? "text-red-300/80"
                      : "text-white/60"
                }`}
              >
                {line.text || " "}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Inline ─── */

function InlineView({
  lines,
  wordWrap,
}: {
  lines: InlineLine[];
  wordWrap: boolean;
}) {
  return (
    <div className="border border-white/5 bg-[#050505] min-h-[40vh] max-h-[65vh] overflow-y-auto custom-scrollbar">
      {lines.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-[40vh]">
          <ScrambleText
            text="no_differences_found"
            className="text-white/10 text-xs tracking-[0.5em] italic"
          />
        </div>
      ) : (
        <div className="font-mono text-[12px] leading-[20px]">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex min-h-[20px] ${
                line.prefix === "+"
                  ? "bg-green-900/15"
                  : line.prefix === "-"
                    ? "bg-red-900/15"
                    : ""
              }`}
            >
              <span
                className={`w-5 shrink-0 text-center select-none font-bold ${
                  line.prefix === "+"
                    ? "text-green-400/80"
                    : line.prefix === "-"
                      ? "text-red-400/80"
                      : "text-white/20"
                }`}
              >
                {line.prefix}
              </span>
              <span
                className={`flex-1 whitespace-pre ${
                  wordWrap ? "whitespace-pre-wrap break-all" : ""
                }`}
              >
                {line.words ? (
                  line.words.map((w, wi) => (
                    <span
                      key={wi}
                      className={
                        w.type === "add"
                          ? "bg-green-500/30 text-green-200"
                          : w.type === "rem"
                            ? "bg-red-500/30 text-red-200"
                            : "text-white/60"
                      }
                    >
                      {w.text}
                    </span>
                  ))
                ) : (
                  <span className="text-white/60">{line.text || " "}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}