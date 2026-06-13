"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  SHORT, MEDIUM, LONG,
  pickPassage, getRank, formatTime,
  type PassageLength, type HistoryEntry,
} from "@/lib/typing-data";

type WpmPoint = { t: number; wpm: number };

function WpmChart({ data, compact, dots }: { data: WpmPoint[]; compact?: boolean; dots?: boolean }) {
  const w = compact ? 200 : 400;
  const h = compact ? 50 : 120;
  if (data.length < 2) {
    return <div className="text-white/15 text-[8px] tracking-widest uppercase text-center py-2">—</div>;
  }

  const maxWpm = Math.max(...data.map((d) => d.wpm), 30);
  const maxTime = data[data.length - 1].t;
  const pmaxWpm = Math.ceil(maxWpm / 10) * 10 + 10;
  const pmaxTime = Math.max(maxTime * 1.05, 5);

  const toX = (t: number) => (t / pmaxTime) * w;
  const toY = (v: number) => h - (v / pmaxWpm) * h;

  const pts = data.map((d) => `${toX(d.t)},${toY(d.wpm)}`).join(" ");
  const line = `M${pts}`;
  const r = compact ? 1.5 : 2.5;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
      {!compact && Array.from({ length: 5 }, (_, i) => (
        <line key={`g${i}`} x1={0} y1={(h / 5) * i} x2={w} y2={(h / 5) * i} stroke="white" strokeOpacity={0.05} />
      ))}
      {dots ? (
        data.map((d, i) => (
          <circle key={i} cx={toX(d.t)} cy={toY(d.wpm)} r={r} fill="rgba(255,255,255,0.6)" />
        ))
      ) : (
        <path d={line} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={compact ? 1.5 : 2} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {!compact && (
        <>
          <text x={0} y={h - 2} fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace">0</text>
          <text x={w} y={h - 2} fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace" textAnchor="end">{pmaxTime}s</text>
          <text x={2} y={10} fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace">{pmaxWpm}</text>
        </>
      )}
    </svg>
  );
}

export default function TypingSpeedPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [passageLength, setPassageLength] = useLocalStorage<PassageLength>("runen:typing-speed-length", "medium");
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>("runen:typing-speed-history", []);

  const passages = useMemo(() => {
    switch (passageLength) {
      case "short": return SHORT;
      case "medium": return MEDIUM;
      case "long": return LONG;
    }
  }, [passageLength]);

  const [mounted, setMounted] = useState(false);
  const [passage, setPassage] = useState(() => pickPassage(passages));
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "typing" | "done">("idle");
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [wpmData, setWpmData] = useState<WpmPoint[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<Omit<HistoryEntry, "date"> | null>(null);
  const lastWpmRef = useRef(0);

  const displayText = passage;

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const resetTest = useCallback(() => {
    setPassage(pickPassage(passages));
    setInput("");
    setStartTime(null);
    setEndTime(null);
    setStatus("idle");
    setCorrectKeystrokes(0);
    setIncorrectKeystrokes(0);
    setWpmData([]);
    lastWpmRef.current = 0;
    resultRef.current = null;
    inputRef.current?.focus();
  }, [passages]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;

      if (status === "idle" && val.length > 0) {
        setStatus("typing");
        setStartTime(Date.now());
      }

      if (status === "done") return;
      if (val.length > displayText.length) return;

      const prevLen = input.length;
      if (val.length > prevLen) {
        const typedChar = val[val.length - 1];
        const targetChar = displayText[val.length - 1];
        if (typedChar !== undefined && targetChar !== undefined) {
          if (typedChar === targetChar) {
            setCorrectKeystrokes((p) => p + 1);
          } else {
            setIncorrectKeystrokes((p) => p + 1);
          }
        }
      }

      setInput(val);

      if (val.length === displayText.length) {
        setStatus("done");
        const now = Date.now();
        setEndTime(now);
        const start = startTime ?? now;
        const elapsedMs = now - start;
        const elapsedMin = elapsedMs / 60000;
        const totalKeystrokes = correctKeystrokes + incorrectKeystrokes + 1;
        const errs = incorrectKeystrokes + (val[val.length - 1] !== displayText[val.length - 1] ? 1 : 0);
        const gwpm = elapsedMin > 0 ? (val.length / 5) / elapsedMin : 0;
        const nwpm = gwpm * (1 - (totalKeystrokes > 0 ? errs / totalKeystrokes : 0));
        const acc = totalKeystrokes > 0 ? ((totalKeystrokes - errs) / totalKeystrokes) * 100 : 100;
        resultRef.current = {
          wpm: Math.round(gwpm),
          netWpm: Math.round(nwpm),
          accuracy: Math.round(acc),
          time: elapsedMs,
          length: passageLength,
        };
      }
    },
    [passageLength, status, input.length, correctKeystrokes, incorrectKeystrokes, displayText, startTime],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (status === "done") e.preventDefault();
  }, [status]);

  useEffect(() => {
    if (status !== "typing") return;
    const id = setInterval(() => setCurrentTime(Date.now()), 100);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === "done" && resultRef.current) {
      setHistory((prev) => {
        const entry: HistoryEntry = {
          ...(resultRef.current as HistoryEntry),
          date: new Date().toISOString(),
        };
        return [entry, ...prev].slice(0, 50);
      });
      resultRef.current = null;
    }
  }, [status, setHistory]);

  useEffect(() => {
    if (status === "idle") {
      inputRef.current?.focus();
    }
  }, [status, passage]);

  const elapsed = useMemo(() => {
    if (status === "idle" || !startTime) return 0;
    const end = status === "done" ? (endTime ?? startTime) : (currentTime || startTime);
    return end - startTime;
  }, [status, startTime, endTime, currentTime]);

  const elapsedMinutes = elapsed / 60000;
  const totalTyped = input.length;
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const grossWPM = elapsedMinutes > 0 ? (totalTyped / 5) / elapsedMinutes : 0;
  const errorRate = totalKeystrokes > 0 ? incorrectKeystrokes / totalKeystrokes : 0;
  const netWPM = grossWPM * (1 - errorRate);
  const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 100;
  const rank = getRank(netWPM);

  useEffect(() => {
    if (status !== "typing" || !startTime) return;
    const elapsedSec = elapsed / 1000;
    if (elapsedSec <= 0) return;
    const nwpm = grossWPM * (1 - (totalKeystrokes > 0 ? incorrectKeystrokes / totalKeystrokes : 0));
    if (Math.abs(nwpm - lastWpmRef.current) < 0.5) return;
    lastWpmRef.current = nwpm;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWpmData((prev) => [...prev, { t: elapsedSec, wpm: nwpm }]);
  }, [elapsed, startTime, status, grossWPM, totalKeystrokes, incorrectKeystrokes]);

  const renderPassage = useMemo(() => {
    return displayText.split("").map((char, i) => {
      let className = "transition-colors duration-75";

      if (status === "idle" && i === 0) {
        className += " text-white/80 border-b border-white/60";
      } else if (i < input.length) {
        if (input[i] === char) {
          className += " text-green-300/90";
        } else {
          className += " text-red-400";
        }
      } else if (i === input.length && status === "typing") {
        className += " text-white/80 border-b border-white/60";
      } else {
        className += " text-white/40";
      }

      return (
        <span key={i} className={className} data-idx={i}>
          {char}
        </span>
      );
    });
  }, [displayText, input, status]);

  if (!mounted) return null;

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="typing-speed" jp="タイピング速度" category="text" href="/text/typing-speed" />

      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status === "idle" ? "bg-white/20" : status === "typing" ? "bg-green-500" : "bg-blue-500"}`} />
            {status === "idle" ? "awaiting" : status === "typing" ? `${totalTyped} / ${displayText.length}` : "complete"}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. CONFIG */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. config{" "}
                <ScrambleText text="設定" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/30" />
              </div>

              <div>
                <div className="text-[10px] tracking-widest text-white/30 uppercase mb-1">passage length</div>
                <div className="grid grid-cols-3 gap-1">
                  {(["short", "medium", "long"] as const).map((len) => (
                    <button
                      key={len}
                      onClick={() => { setPassageLength(len); resetTest(); }}
                      className={`border p-1.5 text-[9px] tracking-widest transition-all cursor-pointer ${
                        passageLength === len ? "bg-white text-black border-white font-bold" : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={resetTest} className="w-full border border-white/10 p-3 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all cursor-pointer">
                new passage
              </button>
            </section>

            {/* 02. STATS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. stats{" "}
                <ScrambleText text="統計" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/30" />
              </div>
              <div className="text-[10px] tracking-widest uppercase space-y-1">
                <div className="flex justify-between border-b border-white/10 py-1">
                  <span className="text-white/30">wpm</span>
                  <span className="text-white/80">{status === "idle" ? "—" : Math.round(netWPM)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 py-1">
                  <span className="text-white/30">accuracy</span>
                  <span className="text-white/80">{status === "idle" ? "—" : `${Math.round(accuracy)}%`}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 py-1">
                  <span className="text-white/30">time</span>
                  <span className="text-white/80">{status === "idle" ? "—" : formatTime(elapsed)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 py-1">
                  <span className="text-white/30">errors</span>
                  <span className="text-white/80">{status === "idle" ? "—" : incorrectKeystrokes}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 py-1">
                  <span className="text-white/30">keystrokes</span>
                  <span className="text-white/80">{status === "idle" ? "—" : `${correctKeystrokes}+${incorrectKeystrokes}`}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 py-1">
                  <span className="text-white/30">progress</span>
                  <span className="text-white/80">{status === "idle" ? "—" : `${Math.round((input.length / displayText.length) * 100)}%`}</span>
                </div>
              </div>

              {(status === "typing" || status === "done") && wpmData.length > 1 && (
                <div className="pt-1">
                  <WpmChart data={wpmData} compact dots={status === "typing"} />
                </div>
              )}
            </section>

            {/* 03. HISTORY */}
            {history.length > 0 && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  03. history{" "}
                  <ScrambleText text="履歴" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/30" />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {history.map((h, i) => {
                    const r = getRank(h.netWpm);
                    return (
                      <div key={`${h.date}-${i}`} className="border-b border-white/5 pb-2 last:border-0">
                        <div className="text-[10px] text-white/70 flex justify-between">
                          <span className={r.color}>{r.label}</span>
                          <span className="text-white/40">{h.netWpm} wpm</span>
                        </div>
                        <div className="text-[8px] text-white/30 flex justify-between mt-0.5">
                          <span>{h.accuracy}% · {formatTime(h.time)}</span>
                          <span className="uppercase">{h.length ?? ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setHistory([])} className="text-[9px] tracking-[0.3em] uppercase text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                  clear
                </button>
              </section>
            )}
          </motion.aside>

          {/* ─── MAIN ─── */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            <div className="bg-[#050505] border border-white/5 min-h-[40vh] flex flex-col relative">
              {status === "done" ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                  <div className="flex flex-col lg:flex-row items-center gap-10 w-full max-w-xl">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-center shrink-0"
                    >
                      <div className="text-[8px] tracking-[0.4em] uppercase text-white/30 mb-4">results</div>
                      <div className="text-6xl sm:text-7xl font-bold tracking-tight mb-2">
                        {Math.round(netWPM)}
                        <span className="text-xl sm:text-2xl text-white/40 font-normal ml-2">wpm</span>
                      </div>
                      <div className={`text-lg sm:text-xl font-bold tracking-wide ${rank.color}`}>{rank.label}</div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex gap-6 sm:gap-8 text-[10px] tracking-widest uppercase"
                    >
                      <div className="text-center">
                        <div className="text-white/80 text-lg font-bold">{Math.round(accuracy)}%</div>
                        <div className="text-white/30 mt-1">accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/80 text-lg font-bold">{formatTime(elapsed)}</div>
                        <div className="text-white/30 mt-1">time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/80 text-lg font-bold">{incorrectKeystrokes}</div>
                        <div className="text-white/30 mt-1">errors</div>
                      </div>
                    </motion.div>
                  </div>

                  {wpmData.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="w-full max-w-xl border border-white/5 p-4"
                    >
                      <div className="text-[8px] tracking-[0.4em] uppercase text-white/20 mb-3">wpm over time</div>
                      <WpmChart data={wpmData} />
                    </motion.div>
                  )}

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={resetTest}
                    className="border border-white/20 px-8 py-3 text-[10px] uppercase tracking-[0.3em] text-white/50 hover:text-white hover:border-white/40 transition-all cursor-pointer mt-2"
                  >
                    try again
                  </motion.button>
                </div>
              ) : (
                <>
                  <div className="absolute top-3 left-4 text-[10px] text-white/20 uppercase tracking-[0.4em] z-10">
                    <ScrambleText text="passage" />
                  </div>

                  <div
                    ref={passageRef}
                    className="flex-1 p-4 pt-10 text-[15px] sm:text-[17px] leading-[2] tracking-wide font-mono whitespace-pre-wrap break-all select-none overflow-y-auto max-h-[55vh]"
                  >
                    {renderPassage}
                  </div>

                  {status === "idle" && (
                    <div className="pb-4 text-center">
                      <ScrambleText text="start_typing_to_begin" chars={jpchars} className="text-white/15 text-[9px] tracking-[0.5em] italic" />
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInput}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-default resize-none outline-none"
                    aria-label="typing input"
                  />
                </>
              )}
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
