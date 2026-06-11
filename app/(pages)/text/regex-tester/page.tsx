"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import ShareButton from "@/components/ShareButton";
import { jpcharlist } from "@/public/data/charlists";
import {
  testRegex,
  segmentText,
  getMatchColor,
  PRESETS,
} from "@/lib/regex-engine";

interface FlagDef {
  id: string;
  label: string;
  desc: string;
}

const FLAGS: FlagDef[] = [
  { id: "g", label: "g", desc: "global" },
  { id: "i", label: "i", desc: "ignore case" },
  { id: "m", label: "m", desc: "multiline" },
  { id: "s", label: "s", desc: "dotall" },
  { id: "u", label: "u", desc: "unicode" },
  { id: "y", label: "y", desc: "sticky" },
];

export default function RegexTesterPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  });
  const [testStr, setTestStr] = useState("");
  const [replacement, setReplacement] = useState("");
  const [copyLabel, setCopyLabel] = useState("copy");

  const flagsStr = useMemo(
    () =>
      Object.entries(flags)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(""),
    [flags],
  );

  const result = useMemo(
    () => testRegex(pattern, flagsStr, testStr, replacement || undefined),
    [pattern, flagsStr, testStr, replacement],
  );

  const segments = useMemo(
    () => segmentText(testStr, result.matches),
    [testStr, result.matches],
  );

  const [hoveredMatch, setHoveredMatch] = useState<number | null>(null);

  const toggleFlag = (id: string) => {
    setFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setPattern(preset.pattern);
    const newFlags: Record<string, boolean> = { g: false, i: false, m: false, s: false, u: false, y: false };
    for (const ch of preset.flags) newFlags[ch] = true;
    setFlags(newFlags);
  };

  const handleCopyMatches = () => {
    const lines = result.matches.map(
      (m, i) => `#${i + 1} @${m.index}: "${testStr.slice(m.index, m.index + m.length)}"`,
    );
    navigator.clipboard.writeText(lines.join("\n"));
    setCopyLabel("copied");
    setTimeout(() => setCopyLabel("copy"), 2000);
  };

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="regex-tester" jp="正規表現" category="text" href="/text/regex-tester" />

      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                !pattern
                  ? "bg-white/20"
                  : result.isValid
                    ? result.matchCount > 0
                      ? "bg-green-500"
                      : "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            {!pattern
              ? "awaiting"
              : result.isValid
                ? `${result.matchCount} matches`
                : "invalid"}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. FLAGS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. flags{" "}
                <ScrambleText
                  text="フラグ"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {FLAGS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFlag(f.id)}
                    title={f.desc}
                    className={`border p-2 text-[10px] tracking-widest transition-all ${
                      flags[f.id]
                        ? "bg-white text-black border-white font-bold"
                        : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 02. PRESETS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. presets{" "}
                <ScrambleText
                  text="プリセット"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    title={p.description}
                    className="border border-white/10 p-2 text-[10px] tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 03. INFO */}
            {pattern && (
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
                    <span className="text-white/30">matches</span>
                    <span className="text-white/80">{result.matchCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 py-1">
                    <span className="text-white/30">groups</span>
                    <span className="text-white/80">{result.groupCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 py-1">
                    <span className="text-white/30">elapsed</span>
                    <span className="text-white/80">{result.elapsed}ms</span>
                  </div>
                </div>
                {result.matchCount > 0 && (
                  <button
                    onClick={handleCopyMatches}
                    className="text-[10px] tracking-widest uppercase text-white/30 hover:text-white transition-colors"
                  >
                    {copyLabel}_matches
                  </button>
                )}
              </section>
            )}

            {/* 04. GROUP CAPTURES */}
            {result.matchCount > 0 && result.groupCount > 0 && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  04. captures{" "}
                  <ScrambleText
                    text="キャプチャ"
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/30"
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {result.matches.map((m, mi) => (
                    <div
                      key={mi}
                      className="border border-white/10 p-2 text-[10px] font-mono"
                      onMouseEnter={() => setHoveredMatch(mi)}
                      onMouseLeave={() => setHoveredMatch(null)}
                    >
                      <div className="text-white/40 tracking-widest mb-1">
                        #{mi + 1} / &quot;{testStr.slice(m.index, m.index + m.length)}&quot;
                      </div>
                      {m.groups.map((g, gi) =>
                        g !== undefined ? (
                          <div
                            key={gi}
                            className="text-white/60 pl-3 border-l border-white/10 ml-1 mt-0.5"
                          >
                            <span className="text-white/30">${gi + 1}:</span> &quot;{g}&quot;
                          </div>
                        ) : null,
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            {/* PATTERN INPUT */}
            <div className="bg-white/[0.02] border border-white/5">
              <div className="flex items-center px-4 pt-3 pb-1 gap-3">
                <span className="text-[10px] text-white/20 uppercase tracking-[0.4em]">
                  <ScrambleText text="pattern" />
                </span>
                {pattern && !result.isValid && (
                  <span className="text-[10px] text-red-400 tracking-widest uppercase">
                    {result.error}
                  </span>
                )}
              </div>
              <div className="flex items-center px-4 pb-3 gap-2">
                <span className="text-white/30 font-mono text-[13px]">/</span>
                <input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="[\\w.-]+@[\\w.-]+\\.\\w+"
                  spellCheck={false}
                  className="flex-1 bg-transparent text-white/80 font-mono text-[13px] outline-none placeholder:text-white/15 selection:bg-white selection:text-black"
                />
                <span className="text-white/30 font-mono text-[13px]">/</span>
                <span className="text-white/40 font-mono text-[13px] tracking-wider">
                  {flagsStr || "(no flags)"}
                </span>
              </div>
            </div>

            {/* REPLACEMENT */}
            <div className="bg-white/[0.02] border border-white/5">
              <div className="text-[10px] text-white/20 uppercase tracking-[0.4em] px-4 pt-3 pb-1">
                <ScrambleText text="replacement (optional)" />
              </div>
              <input
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="***"
                spellCheck={false}
                className="w-full bg-transparent text-white/80 font-mono text-[13px] p-4 outline-none placeholder:text-white/15 selection:bg-white selection:text-black"
              />
            </div>

            {/* REPLACEMENT PREVIEW */}
            {replacement && result.isValid && (
              <div className="bg-white/[0.02] border border-white/5 min-h-[8vh]">
                <div className="text-[10px] text-white/20 uppercase tracking-[0.4em] px-4 pt-3 pb-1">
                  <ScrambleText text="result" />
                </div>
                <pre className="font-mono text-[13px] p-4 text-white/80 whitespace-pre-wrap break-all selection:bg-white selection:text-black">
                  {result.replacement}
                </pre>
              </div>
            )}

            {/* TEST STRING */}
            <div className="bg-[#050505] border border-white/5 min-h-[30vh] flex flex-col relative">
              <div className="absolute top-3 left-4 text-[10px] text-white/20 uppercase tracking-[0.4em] z-10">
                <ScrambleText text="test_string" />
              </div>
              <div className="absolute top-3 right-4 z-10">
                {result.isValid && pattern && testStr && (
                  <ShareButton data={testStr} filename="regex-test-string.txt" />
                )}
              </div>

              {testStr ? (
                <pre className="font-mono text-[13px] p-4 pt-10 whitespace-pre-wrap break-all overflow-x-auto custom-scrollbar flex-1 leading-relaxed selection:bg-white selection:text-black">
                  {segments.map((seg, i) =>
                    seg.isMatch ? (
                      <span
                        key={i}
                        className={`${getMatchColor(seg.matchIndex ?? 0)} ${
                          hoveredMatch === seg.matchIndex
                            ? "ring-1 ring-white/30"
                            : ""
                        }`}
                        onMouseEnter={() => setHoveredMatch(seg.matchIndex ?? null)}
                        onMouseLeave={() => setHoveredMatch(null)}
                      >
                        {seg.text}
                      </span>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    ),
                  )}
                </pre>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <ScrambleText
                    text="enter_test_string"
                    className="text-white/10 text-xs tracking-[0.5em] italic"
                  />
                </div>
              )}

              {/* Textarea overlay for editing */}
              <textarea
                value={testStr}
                onChange={(e) => setTestStr(e.target.value)}
                placeholder="Paste or type your test string here..."
                spellCheck={false}
                className="w-full min-h-[12vh] bg-transparent text-white/80 font-mono text-[13px] p-4 outline-none resize-y placeholder:text-white/15 border-t border-white/5 selection:bg-white selection:text-black"
              />
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}