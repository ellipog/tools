"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";

const WHEEL_COLORS = [
  "#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7",
  "#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE","#85C1E9",
  "#F0B27A","#82E0AA","#F1948A","#73C6B6","#E59866",
  "#6C3483","#2E86C1","#1ABC9C","#E74C3C","#F39C12",
];

export default function RandomPicker() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [input, setInput] = useState("");
  const [count, setCount] = useState(1);
  const [removeDups, setRemoveDups] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [spinText, setSpinText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode] = useState<"pick" | "spin">("pick");
  const [spinAngle, setSpinAngle] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const items = useMemo(() => {
    let list: string[];
    if (input.includes(",") && !input.includes("\n")) {
      list = input.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      list = input.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    if (removeDups) list = [...new Set(list)];
    return list;
  }, [input, removeDups]);

  // ── PICK mode ──
  const pick = useCallback(() => {
    if (items.length === 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    setSpinning(true);
    let ticks = 0;
    const maxTicks = 20;

    intervalRef.current = setInterval(() => {
      ticks++;
      setSpinText(items[Math.floor(Math.random() * items.length)]);
      if (ticks >= maxTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const n = Math.min(count, items.length);
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        setResults(shuffled.slice(0, n));
        setSpinning(false);
        setSpinText("");
      }
    }, 60);
  }, [items, count]);

  // ── SPIN mode ──
  const spin = useCallback(() => {
    if (items.length === 0) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setSpinning(true);
    setWinnerIndex(null);

    const winnerIdx = Math.floor(Math.random() * items.length);
    const segAngle = 360 / items.length;
    const targetAngle = 360 - (winnerIdx * segAngle + segAngle / 2);
    const fullSpins = 360 * (5 + Math.floor(Math.random() * 3));
    const totalRotation = fullSpins + targetAngle - (angleRef.current % 360);
    const duration = 4000;
    const startAngle = angleRef.current;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = startAngle + totalRotation * eased;
      setSpinAngle(angle);
      angleRef.current = angle;

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWinnerIndex(winnerIdx);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [items]);

  const copyResults = async () => {
    const text = results.join("\n");
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  // ── Draw wheel ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "spin") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy) - 20;
    const segAngle = (2 * Math.PI) / (items.length || 1);
    const angleRad = (spinAngle * Math.PI) / 180;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Segments
    items.forEach((item, i) => {
      const start = angleRad - Math.PI / 2 + i * segAngle;
      const end = start + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Text labels
    ctx.fillStyle = "#000";
    ctx.font = `bold ${Math.min(14, radius / 12)}px system-ui, monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    items.forEach((item, i) => {
      const mid = angleRad - Math.PI / 2 + (i + 0.5) * segAngle;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);
      const label = item.length > 14 ? item.slice(0, 14) + "…" : item;
      ctx.fillText(label, radius - 8, 0);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Winner glow
    if (winnerIndex !== null && !spinning) {
      const ws = angleRad - Math.PI / 2 + winnerIndex * segAngle;
      const we = ws + segAngle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius + 5, ws, we);
      ctx.closePath();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(255,255,255,0.5)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Empty state
    if (items.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [items, spinAngle, winnerIndex, spinning, mode]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleAction = mode === "pick" ? pick : spin;
  const actionLabel = mode === "pick" ? (spinning ? "picking…" : "pick") : (spinning ? "spinning…" : "spin");

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="random_picker" jp="ランダム選択" category="utils" href="/utils/random-picker" />
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
            {/* 01. ITEMS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. items{" "}
                <ScrambleText text={"項目"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="one per line, or comma-separated"
                rows={8}
                className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-4 py-3 outline-none focus:border-white/40 placeholder:text-white/20 uppercase tracking-widest resize-none"
              />
              {input && (
                <div className="text-[10px] text-white/40 tracking-widest uppercase">
                  {items.length} items
                </div>
              )}
            </section>

            {/* 02. MODE & OPTIONS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. mode & options{" "}
                <ScrambleText text={"モードとオプション"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>

              {/* Mode toggle */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setMode("pick"); setWinnerIndex(null); setResults([]); }}
                  className={`flex-1 text-[10px] py-1.5 border tracking-[0.1em] transition-all ${
                    mode === "pick"
                      ? "bg-white text-black border-white font-bold"
                      : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                  }`}
                >
                  PICK
                </button>
                <button
                  onClick={() => { setMode("spin"); setResults([]); }}
                  className={`flex-1 text-[10px] py-1.5 border tracking-[0.1em] transition-all ${
                    mode === "spin"
                      ? "bg-white text-black border-white font-bold"
                      : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                  }`}
                >
                  SPIN
                </button>
              </div>

              {/* Pick count (PICK mode only) */}
              {mode === "pick" && (
                <div>
                  <div className="text-[9px] tracking-widest uppercase text-white/40 mb-2">pick count</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 5, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        disabled={n > items.length}
                        className={`flex-1 text-[10px] py-1.5 border tracking-[0.1em] transition-all ${
                          count === n
                            ? "bg-white text-black border-white font-bold"
                            : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                        } disabled:opacity-10 disabled:cursor-not-allowed`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setRemoveDups(!removeDups)}
                className="flex items-center gap-4 group"
              >
                <div className={`w-4 h-4 border transition-all shrink-0 ${removeDups ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] border-white" : "border-white/20"}`} />
                <span className={`text-[10px] tracking-widest uppercase transition-colors ${removeDups ? "text-white" : "text-white/30"}`}>
                  remove_duplicates
                </span>
              </button>
            </section>

            {/* 03. ACTION */}
            <button
              onClick={handleAction}
              disabled={items.length === 0 || spinning}
              className="w-full bg-white text-black uppercase text-xs tracking-[0.3em] font-bold py-4 hover:bg-white/90 transition-all disabled:opacity-30"
            >
              {actionLabel}
            </button>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col items-center justify-center bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            <AnimatePresence mode="wait">
              {mode === "pick" ? (
                /* ── PICK MODE ── */
                <motion.div
                  key="pick"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6 w-full"
                >
                  {spinning ? (
                    <div className="text-4xl sm:text-6xl font-light text-white tabular-nums tracking-wider">
                      {spinText}
                    </div>
                  ) : results.length > 0 ? (
                    <div className="flex flex-col items-center gap-6">
                      {results.length === 1 ? (
                        <div className="text-4xl sm:text-6xl font-light text-white tracking-wider text-center break-all max-w-full">
                          {results[0]}
                        </div>
                      ) : (
                        <div className="space-y-2 max-w-full">
                          {results.map((r, i) => (
                            <div key={i} className="text-xl sm:text-2xl font-light text-white tracking-wider text-center">
                              <span className="text-white/30 text-xs mr-3">{i + 1}.</span>
                              {r}
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={copyResults}
                        className="text-[10px] tracking-[0.3em] uppercase border border-white/10 px-4 py-2 text-white/40 hover:text-white hover:border-white/40 transition-all"
                      >
                        copy_results
                      </button>
                    </div>
                  ) : (
                    <ScrambleText
                      text="add_items_and_pick"
                      className="text-white/10 text-xs tracking-[0.5em] italic"
                    />
                  )}
                </motion.div>
              ) : (
                /* ── SPIN MODE ── */
                <motion.div
                  key="spin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6 w-full"
                >
                  {/* Arrow indicator */}
                  <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[20px] border-l-transparent border-r-transparent border-t-white -mb-1 z-10" />
                  {/* Canvas wheel */}
                  <canvas
                    ref={canvasRef}
                    className="w-full max-w-[500px] aspect-square"
                  />
                  {/* Legend */}
                  {items.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center max-w-md text-[10px] tracking-wider uppercase">
                      {items.map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-white/50">
                          <span
                            className="w-2.5 h-2.5 inline-block"
                            style={{ backgroundColor: WHEEL_COLORS[i % WHEEL_COLORS.length] }}
                          />
                          {item.length > 16 ? item.slice(0, 16) + "…" : item}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Result */}
                  {winnerIndex !== null && !spinning && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <div className="text-center">
                        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">winner</div>
                        <div className="text-3xl sm:text-4xl font-light tracking-wider text-white">
                          {items[winnerIndex]}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {items.length === 0 && (
                    <ScrambleText
                      text="add_items_to_spin"
                      className="text-white/10 text-xs tracking-[0.5em] italic"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
