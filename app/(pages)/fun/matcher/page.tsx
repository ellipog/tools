"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import {
  type MatchMode,
  type MatchResult,
  SUBSCORE_LABELS,
  ALGORITHMS,
  getAlgorithm,
  pickRandomAlgorithm,
  pickTagline,
  playRevealSound,
  renderMatchCard,
} from "@/lib/matcher";

const MATCHER_HISTORY_KEY = "runen:matcher-history";
const MODES: { id: MatchMode; label: string; jp: string }[] = [
  { id: "romance", label: "romance", jp: "ロマンス" },
  { id: "friendship", label: "friendship", jp: "友情" },
  { id: "rivalry", label: "rivalry", jp: "ライバル" },
  { id: "business", label: "business", jp: "ビジネス" },
];

type HistoryEntry = {
  nameA: string;
  nameB: string;
  score: number;
  mode: MatchMode;
  algorithm: string;
  tagline: string;
  timestamp: number;
};

export default function MatcherPage() {
  const jpchars = useMemo(() => jpcharlist, []);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [photoA, setPhotoA] = useState<string | null>(null);
  const [photoB, setPhotoB] = useState<string | null>(null);
  const [mode, setMode] = useState<MatchMode>("romance");
  const [algorithm, setAlgorithm] = useState("classic-sum");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [displayScore, setDisplayScore] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileARef = useRef<HTMLInputElement>(null);
  const fileBRef = useRef<HTMLInputElement>(null);
  const [savingCard, setSavingCard] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MATCHER_HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const handlePhoto = useCallback((side: "A" | "B") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (side === "A") setPhotoA(dataUrl);
      else setPhotoB(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const calculate = useCallback(() => {
    const a = nameA.trim();
    const b = nameB.trim();
    if (!a || !b || calculating) return;

    setCalculating(true);
    setResult(null);
    setDisplayScore(0);

    const algo = algorithm === "surprise" ? pickRandomAlgorithm() : getAlgorithm(algorithm);
    const { score, raw } = algo.compute(a, b);
    const labels = SUBSCORE_LABELS[mode];
    const tagline = pickTagline(mode, score);
    const subScores = raw.map((v, i) => ({ label: labels[i] ?? "?", value: v }));
    const matchResult: MatchResult = { score, subScores, tagline, algorithm: algo.id, mode };

    setTimeout(() => {
      setResult(matchResult);
      const interval = setInterval(() => {
        setDisplayScore(Math.floor(Math.random() * 100));
      }, 60);
      setTimeout(() => {
        clearInterval(interval);
        setDisplayScore(score);
        setCalculating(false);
        if (soundEnabled) playRevealSound(score);
        const entry: HistoryEntry = { nameA: a, nameB: b, score, mode, algorithm: algo.id, tagline, timestamp: Date.now() };
        setHistory((prev) => {
          const next = [entry, ...prev].slice(0, 20);
          try { localStorage.setItem(MATCHER_HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      }, 1200);
    }, 400);
  }, [nameA, nameB, mode, algorithm, calculating, soundEnabled]);

  const copyResult = useCallback(() => {
    if (!result) return;
    const text = `${nameA.trim()} \u2726 ${nameB.trim()} \u2014 ${result.score}% \u2014 ${result.tagline}\n${result.subScores.map((s) => `${s.label}: ${s.value}%`).join(" \u00B7 ")}`;
    navigator.clipboard.writeText(text);
  }, [result, nameA, nameB]);

  const saveCard = useCallback(async () => {
    if (!result) return;
    setSavingCard(true);
    try {
      const blob = await renderMatchCard(nameA.trim(), nameB.trim(), result, photoA, photoB);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `match-${nameA.trim()}-${nameB.trim()}-${result.score}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setSavingCard(false);
  }, [result, nameA, nameB, photoA, photoB]);

  const flip = useCallback(() => {
    setNameA(nameB);
    setNameB(nameA);
    setPhotoA(photoB);
    setPhotoB(photoA);
  }, [nameA, nameB, photoA, photoB]);

  const hasResult = result !== null && displayScore !== null;
  const ready = nameA.trim().length > 0 && nameB.trim().length > 0 && !calculating;

  const HeartIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="matcher" jp="相性診断" category="fun" href="/fun/matcher" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <button className="text-[10px] tracking-[0.3em] text-white/50 hover:text-white transition-colors uppercase border border-white/10 px-3 py-2 bg-white/5 rounded-none">
            v0.1
          </button>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* SIDEBAR */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. NAMES */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. names{" "}
                <ScrambleText text="名前" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={nameA}
                  onChange={(e) => setNameA(e.target.value)}
                  placeholder="name A"
                  className="flex-1 bg-transparent border border-white/10 text-[11px] text-white/60 px-3 py-3 outline-none focus:border-white/30 uppercase tracking-widest placeholder:text-white/20 rounded-none"
                />
                <button
                  onClick={flip}
                  className="border border-white/10 px-2 py-3 text-[10px] text-white/30 hover:text-white hover:border-white/30 transition-colors rounded-none"
                  title="Flip names"
                >
                  {"\u2195"}
                </button>
                <input
                  value={nameB}
                  onChange={(e) => setNameB(e.target.value)}
                  placeholder="name B"
                  className="flex-1 bg-transparent border border-white/10 text-[11px] text-white/60 px-3 py-3 outline-none focus:border-white/30 uppercase tracking-widest placeholder:text-white/20 rounded-none"
                />
              </div>
              <div className="flex gap-2">
                <input ref={fileARef} type="file" accept="image/*" onChange={handlePhoto("A")} hidden />
                <input ref={fileBRef} type="file" accept="image/*" onChange={handlePhoto("B")} hidden />
                <button
                  onClick={() => fileARef.current?.click()}
                  className="flex-1 border border-white/10 py-2 text-[9px] tracking-[0.2em] uppercase text-white/30 hover:text-white hover:border-white/30 transition-colors rounded-none"
                >
                  {photoA ? "IMG A" : "photo A"}
                </button>
                <button
                  onClick={() => fileBRef.current?.click()}
                  className="flex-1 border border-white/10 py-2 text-[9px] tracking-[0.2em] uppercase text-white/30 hover:text-white hover:border-white/30 transition-colors rounded-none"
                >
                  {photoB ? "IMG B" : "photo B"}
                </button>
                {(photoA || photoB) && (
                  <button
                    onClick={() => { setPhotoA(null); setPhotoB(null); }}
                    className="border border-white/10 px-2 py-2 text-[9px] text-white/30 hover:text-white hover:border-white/30 transition-colors rounded-none"
                  >
                    X
                  </button>
                )}
              </div>
            </section>

            {/* 02. MODE */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. mode{" "}
                <ScrambleText text="モード" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`text-[9px] px-3 py-2 border tracking-[0.1em] transition-all text-left uppercase rounded-none ${
                      mode === m.id
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {m.label} / {m.jp}
                  </button>
                ))}
              </div>
            </section>

            {/* 03. ALGORITHM */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. algorithm{" "}
                <ScrambleText text="アルゴリズム" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex gap-2">
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="flex-1 bg-transparent border border-white/10 text-[10px] text-white/50 px-3 py-2.5 outline-none focus:border-white/30 uppercase tracking-widest rounded-none"
                >
                  {ALGORITHMS.map((a) => (
                    <option key={a.id} value={a.id} className="bg-black text-white/70">
                      {a.label}
                    </option>
                  ))}
                  <option value="surprise" className="bg-black text-white/70">
                    surprise me
                  </option>
                </select>
              </div>
            </section>

            {/* MATCH */}
            <motion.button
              onClick={calculate}
              disabled={!ready}
              whileTap={{ scale: 0.95 }}
              className="w-full border border-white/20 py-4 uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all disabled:opacity-30"
            >
              {calculating ? "..." : result ? "RE-MATCH" : "MATCH"}
            </motion.button>

            {/* 05. HISTORY */}
            {history.length > 0 && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  05. history{" "}
                  <ScrambleText text="履歴" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {history.map((h) => (
                    <div key={h.timestamp} className="border-b border-white/5 pb-1.5 flex justify-between items-center">
                      <div className="text-[9px] text-white/30 truncate flex-1">
                        {h.nameA} {"\u2726"} {h.nameB}
                      </div>
                      <div className="text-[11px] text-white/50 font-bold tabular-nums ml-2">{h.score}%</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setHistory([]); localStorage.removeItem(MATCHER_HISTORY_KEY); }}
                  className="text-[9px] tracking-[0.3em] uppercase text-white/30 hover:text-white/60 transition-colors"
                >
                  clear
                </button>
              </section>
            )}
          </motion.aside>

          {/* MAIN PANE */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col items-center justify-center gap-8 bg-white/2 border border-white/5 min-h-[70vh] p-8 relative"
          >
            {/* Idle state */}
            {!hasResult && !calculating && (
              <ScrambleText
                text="enter_two_names_and_conjure_your_fate"
                className="text-white/10 text-xs tracking-[0.5em] italic"
              />
            )}

            {/* Calculating state */}
            {calculating && !hasResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="text-[11px] tracking-[0.4em] uppercase text-white/30 animate-pulse">
                  calculating...
                </div>
                {result && (
                  <div className="w-full max-w-sm space-y-3">
                    {result.subScores.map((s, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[8px] tracking-widest uppercase text-white/30">
                          <span>{s.label}</span>
                          <span>{s.value}%</span>
                        </div>
                        <div className="h-2 bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.value}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="h-full bg-white/30"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Result */}
            <AnimatePresence>
              {hasResult && !calculating && result && (
                <motion.div
                  key={result.tagline}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-8 w-full max-w-lg"
                >
                  {/* Photos + Names */}
                  <div className="flex items-center gap-6 mb-2">
                    <div className="flex flex-col items-center gap-3">
                      {photoA && (
                        <div className="w-24 h-24 border border-white/10 overflow-hidden flex items-center justify-center bg-white/5">
                          <img src={photoA} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-[11px] tracking-widest uppercase text-white/50">{nameA.trim()}</span>
                    </div>
                    {mode === "romance" ? <HeartIcon /> : <span className="text-white/20 text-2xl">{"\u2726"}</span>}
                    <div className="flex flex-col items-center gap-3">
                      {photoB && (
                        <div className="w-24 h-24 border border-white/10 overflow-hidden flex items-center justify-center bg-white/5">
                          <img src={photoB} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-[11px] tracking-widest uppercase text-white/50">{nameB.trim()}</span>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="text-center">
                    <div className="text-[10px] tracking-[0.4em] uppercase text-white/20 mb-2">match</div>
                    <motion.div
                      key={displayScore}
                      className={`font-bold tabular-nums ${result.score >= 80 ? "text-white" : "text-white/80"}`}
                      style={{ fontSize: result.score >= 90 ? "6rem" : "5rem", lineHeight: 1 }}
                    >
                      {displayScore}%
                    </motion.div>
                  </div>

                  {/* Tagline */}
                  <div className="text-[12px] tracking-[0.2em] uppercase text-white/40 text-center max-w-sm leading-relaxed">
                    {result.tagline}
                  </div>

                  {/* Sub-scores */}
                  <div className="w-full space-y-3 mt-2">
                    {result.subScores.map((s, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-[9px] tracking-widest uppercase">
                          <span className="text-white/40">{s.label}</span>
                          <span className="text-white/50 tabular-nums">{s.value}%</span>
                        </div>
                        <div className="h-3 bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.value}%` }}
                            transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                            className="h-full bg-white/30"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={saveCard}
                      disabled={savingCard}
                      className="border border-white/10 px-4 py-2.5 text-[9px] tracking-[0.3em] uppercase text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-30 rounded-none"
                    >
                      {savingCard ? "rendering..." : "save card"}
                    </button>
                    <button
                      onClick={copyResult}
                      className="border border-white/10 px-4 py-2.5 text-[9px] tracking-[0.3em] uppercase text-white/40 hover:text-white hover:border-white/30 transition-all rounded-none"
                    >
                      copy text
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
