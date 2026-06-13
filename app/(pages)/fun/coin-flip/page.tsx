"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import { useLocalStorage } from "@/hooks/useLocalStorage";

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function CoinFace({ character }: { character: string }) {
  return (
    <div className="w-full h-full rounded-full border border-white/20 bg-white/5 flex items-center justify-center select-none">
      <span className="font-mono text-7xl sm:text-8xl font-black text-white/80">
        {character}
      </span>
    </div>
  );
}

export default function CoinFlipPage() {
  const jpchars = useMemo(() => jpcharlist, []);
  const flippingRef = useRef(false);

  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [history, setHistory] = useLocalStorage<{ result: string; timestamp: number }[]>("aaenz:coin:history", []);
  const [counts, setCounts] = useLocalStorage<{ heads: number; tails: number }>("aaenz:coin:counts", { heads: 0, tails: 0 });
  const [flipCount, setFlipCount] = useLocalStorage("aaenz:coin:flipCount", 0);
  const [streak, setStreak] = useLocalStorage("aaenz:coin:streak", 0);
  const [currentStreakSide, setCurrentStreakSide] = useLocalStorage<string | null>("aaenz:coin:streakSide", null);

  const coinChar = result === null ? "?" : result === "heads" ? "H" : "T";

  const flip = useCallback(() => {
    if (flippingRef.current) return;

    const outcome = Math.random() < 0.5 ? "heads" : "tails";

    flippingRef.current = true;
    setFlipping(true);

    setTimeout(() => {
      setResult(outcome);
      setCounts((prev) => ({
        heads: prev.heads + (outcome === "heads" ? 1 : 0),
        tails: prev.tails + (outcome === "tails" ? 1 : 0),
      }));
      setFlipCount((prev) => prev + 1);
      setHistory((prev) => [{ result: outcome, timestamp: Date.now() }, ...prev].slice(0, 20));

      setCurrentStreakSide((prevSide) => {
        if (prevSide === outcome) {
          setStreak((s) => s + 1);
        } else {
          setStreak(1);
        }
        return outcome;
      });

      flippingRef.current = false;
      setFlipping(false);
    }, 800);
  }, [setCounts, setFlipCount, setHistory, setStreak, setCurrentStreakSide]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      }
      if (e.key === "Escape" && result !== null && !flipping) {
        setResult(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flip, result, flipping]);

  const clearAll = useCallback(() => {
    setHistory([]);
    setCounts({ heads: 0, tails: 0 });
    setFlipCount(0);
    setStreak(0);
    setCurrentStreakSide(null);
  }, [setHistory, setCounts, setFlipCount, setStreak, setCurrentStreakSide]);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="coin-flip" jp="コインフリップ" category="fun" href="/fun/coin-flip" />
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
          {/* ─── SIDEBAR ─── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. STATS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. stats{" "}
                <ScrambleText text="統計" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="border border-white/10 p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                  <span>heads</span>
                  <span className="text-white/70">{counts.heads}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                  <span>tails</span>
                  <span className="text-white/70">{counts.tails}</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2" />
                <div className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                  <span>total flips</span>
                  <span className="text-white/70">{flipCount}</span>
                </div>
                {streak > 0 && (
                  <div className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                    <span>streak</span>
                    <span className="text-white/70">{streak}x {currentStreakSide}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 02. HISTORY */}
            {history.length > 0 && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  02. history{" "}
                  <ScrambleText text="履歴" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {history.map((h, i) => (
                    <div
                      key={`${h.timestamp}-${i}`}
                      className="text-[9px] text-white/30 border-b border-white/5 pb-1 leading-relaxed flex justify-between"
                    >
                      <span className="uppercase">{h.result}</span>
                      <span className="text-white/20">{formatTimestamp(h.timestamp)}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={clearAll}
                  className="text-[9px] tracking-[0.3em] uppercase text-white/30 hover:text-white/60 transition-colors"
                >
                  clear
                </button>
              </section>
            )}
          </motion.aside>

          {/* ─── MAIN ─── */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col items-center justify-center gap-8 bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {result === null && !flipping && (
              <ScrambleText
                text="tap_to_flip"
                className="text-white/10 text-xs tracking-[0.5em] italic mb-4"
              />
            )}

            {/* Coin */}
            <motion.div
              onClick={flip}
              animate={
                flipping
                  ? {
                      rotateX: [0, 720],
                      scaleY: [1, 0.3, 1.15, 1],
                    }
                  : {}
              }
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-64 h-64 sm:w-80 sm:h-80 cursor-pointer"
            >
              <CoinFace character={coinChar} />
            </motion.div>

            {/* Result text */}
            <div className="min-h-[2rem]">
              <AnimatePresence mode="wait">
                {!flipping && result && (
                  <motion.div
                    key={result}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl sm:text-2xl tracking-[0.3em] uppercase font-bold text-white/80"
                  >
                    {result}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
