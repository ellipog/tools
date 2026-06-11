"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";

export default function RandomPicker() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [input, setInput] = useState("");
  const [count, setCount] = useState(1);
  const [removeDups, setRemoveDups] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [spinText, setSpinText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const copyResults = async () => {
    const text = results.join("\n");
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

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

            {/* 02. OPTIONS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. options{" "}
                <ScrambleText text={"オプション"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>

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

            {/* 03. PICK */}
            <button
              onClick={pick}
              disabled={items.length === 0 || spinning}
              className="w-full bg-white text-black uppercase text-xs tracking-[0.3em] font-bold py-4 hover:bg-white/90 transition-all disabled:opacity-30"
            >
              {spinning ? "picking…" : "pick"}
            </button>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col items-center justify-center bg-white/2 border border-white/5 min-h-[60vh] p-8"
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
          </motion.main>
        </div>
      </div>
    </div>
  );
}