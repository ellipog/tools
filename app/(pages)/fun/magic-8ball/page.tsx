"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";

const ANSWERS = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes — definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

function getAnswer(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

export default function Magic8BallPage() {
  const jpchars = useMemo(() => jpcharlist, []);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [revealed, setRevealed] = useState(false);

  const ask = useCallback(() => {
    const q = question.trim();
    if (!q || shaking) return;
    setShaking(true);
    setRevealed(false);
    setAnswer(null);
    setTimeout(() => {
      const a = getAnswer();
      setAnswer(a);
      setRevealed(true);
      setShaking(false);
      setHistory((prev) => [{ q, a }, ...prev].slice(0, 20));
    }, 1200);
  }, [question, shaking]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") ask();
    },
    [ask]
  );

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="magic-8ball" jp="マジック８ボール" category="fun" href="/fun/magic-8ball" />
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
            {/* 01. QUESTION */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. question{" "}
                <ScrambleText text="質問" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ask yes/no question…"
                className="w-full bg-transparent border border-white/10 text-[11px] text-white/60 px-3 py-3 outline-none focus:border-white/30 uppercase tracking-widest placeholder:text-white/20"
              />
              <button
                onClick={ask}
                disabled={!question.trim() || shaking}
                className="w-full border border-white/10 p-4 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                {shaking ? "consulting the spirits…" : "ASK THE 8-BALL"}
              </button>
            </section>

            {/* 02. STATS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. stats{" "}
                <ScrambleText text="統計" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="border border-white/10 p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                  <span>questions asked</span>
                  <span className="text-white/70">{history.length}</span>
                </div>
                {history.length > 0 && (
                  <div className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                    <span>last answer</span>
                    <span className="text-white/70 truncate max-w-[120px]">{history[0].a}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 03. HISTORY */}
            {history.length > 0 && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  03. history{" "}
                  <ScrambleText text="履歴" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {history.map((h, i) => (
                    <div key={i} className="border-b border-white/5 pb-2">
                      <div className="text-[8px] text-white/20 tracking-widest uppercase">Q: {h.q}</div>
                      <div className="text-[10px] text-white/50 tracking-wide">A: {h.a}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setHistory([])}
                  className="text-[9px] tracking-[0.3em] uppercase text-white/30 hover:text-white/60 transition-colors"
                >
                  clear
                </button>
              </section>
            )}
          </motion.aside>

          {/* ─── MAIN PANE ─── */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col items-center justify-center gap-8 bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {!question.trim() && !answer && (
              <ScrambleText
                text="type_a_question_and_ask_the_8ball"
                className="text-white/10 text-xs tracking-[0.5em] italic"
              />
            )}

            {/* 8-Ball */}
            <motion.div
              onClick={ask}
              animate={
                shaking
                  ? {
                      rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
                      scale: [1, 1.02, 0.98, 1.02, 0.98, 1.01, 0.99, 1],
                    }
                  : {}
              }
              transition={{ duration: 1.2 }}
              className="relative w-64 h-64 sm:w-80 sm:h-80 cursor-pointer"
            >
              {/* Outer circle */}
              <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-gradient-to-b from-white/5 to-white/10" />
              {/* Inner circle */}
              <div className="absolute inset-4 rounded-full border border-white/10 bg-black flex items-center justify-center">
                {!answer && !shaking && (
                  <div className="text-center">
                    <div className="text-[40px] sm:text-[48px] font-bold text-white/10 select-none">8</div>
                    <div className="text-[8px] tracking-[0.4em] uppercase text-white/15 mt-2">click to ask</div>
                  </div>
                )}
                {shaking && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                    className="text-center"
                  >
                    <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">…</div>
                  </motion.div>
                )}
                <AnimatePresence>
                  {!shaking && answer && revealed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="text-center px-6"
                    >
                      <div className="text-[11px] sm:text-[13px] text-white/80 leading-relaxed tracking-wide">
                        {answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {answer && !shaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[9px] tracking-[0.3em] uppercase text-white/25 text-center max-w-md"
              >
                <div className="text-white/20 text-[8px] mb-1">your question:</div>
                <div className="truncate">{question}</div>
              </motion.div>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
