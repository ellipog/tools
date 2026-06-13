"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";

const ACTIVITIES: { text: string; category: string }[] = [
  { text: "learn to juggle with socks", category: "physical" },
  { text: "write a haiku about your desk", category: "creative" },
  { text: "stare at a wall for 60 seconds", category: "chill" },
  { text: "send a compliment to a friend", category: "social" },
  { text: "organize your bookmarks", category: "productive" },
  { text: "invent a new handshake", category: "weird" },
  { text: "draw a map of your neighborhood from memory", category: "creative" },
  { text: "do 10 jumping jacks", category: "physical" },
  { text: "list 5 things you can hear right now", category: "chill" },
  { text: "clear your desktop", category: "productive" },
  { text: "talk to a plant", category: "weird" },
  { text: "write a short story in 6 words", category: "creative" },
  { text: "stretch for 2 minutes", category: "physical" },
  { text: "watch a cloud for 30 seconds", category: "chill" },
  { text: "text someone you haven't talked to in a year", category: "social" },
  { text: "learn the NATO phonetic alphabet", category: "productive" },
  { text: "eat something with a different hand", category: "weird" },
  { text: "build a tiny fort out of objects on your desk", category: "creative" },
  { text: "balance on one foot for 30 seconds", category: "physical" },
  { text: "breathe deeply for 60 seconds", category: "chill" },
  { text: "leave a nice review for a small business", category: "social" },
  { text: "make your bed", category: "productive" },
  { text: "speak in an accent for 5 minutes", category: "weird" },
  { text: "compose a song using only your voice", category: "creative" },
  { text: "do 5 pushups", category: "physical" },
  { text: "count how many blue things you can see", category: "chill" },
  { text: "smile at a stranger", category: "social" },
  { text: "drink a glass of water", category: "productive" },
  { text: "try to lick your elbow", category: "weird" },
  { text: "design a flag for a fictional country", category: "creative" },
  { text: "take a 2-minute dance break", category: "physical" },
  { text: "listen to a song you've never heard before", category: "chill" },
  { text: "compliment yourself in the mirror", category: "social" },
  { text: "delete 10 old files", category: "productive" },
  { text: "write a message in mirrored text", category: "weird" },
  { text: "invent a new word and its definition", category: "creative" },
  { text: "hold a plank for 20 seconds", category: "physical" },
  { text: "sit in complete silence for 2 minutes", category: "chill" },
  { text: "wave at someone", category: "social" },
  { text: "update your to-do list", category: "productive" },
  { text: "try to memorise a random fact", category: "weird" },
  { text: "draw a self-portrait with your eyes closed", category: "creative" },
  { text: "walk up and down some stairs", category: "physical" },
  { text: "close your eyes and listen to the room", category: "chill" },
  { text: "tell someone a joke", category: "social" },
  { text: "sort your socks", category: "productive" },
  { text: "make up a prophecy about the future", category: "weird" },
  { text: "write a 7-word poem about your day", category: "creative" },
  { text: "do 3 yoga poses", category: "physical" },
  { text: "daydream for 5 minutes", category: "chill" },
  { text: "ask someone how their day is going", category: "social" },
  { text: "review your goals for this month", category: "productive" },
  { text: "create a secret code with a friend", category: "weird" },
  { text: "make up a dance to a song", category: "creative" },
  { text: "take a quick walk around the block", category: "physical" },
  { text: "identify 3 good things about today", category: "chill" },
  { text: "share a meme with someone", category: "social" },
  { text: "clean one small area of your room", category: "productive" },
  { text: "whisper everything for 5 minutes", category: "weird" },
  { text: "draw your favorite animal in 30 seconds", category: "creative" },
  { text: "hold a wall sit for 15 seconds", category: "physical" },
  { text: "notice 5 textures around you", category: "chill" },
  { text: "start a conversation with a coworker", category: "social" },
  { text: "back up one important file", category: "productive" },
  { text: "wear your clothes inside out for 10 minutes", category: "weird" },
  { text: "write a one-sentence horror story", category: "creative" },
  { text: "roll your shoulders 10 times", category: "physical" },
  { text: "pick one thing to declutter", category: "productive" },
  { text: "find something to be curious about", category: "chill" },
  { text: "tell someone they matter", category: "social" },
  { text: "learn one word in a new language", category: "productive" },
  { text: "make a paper airplane", category: "creative" },
  { text: "do 10 calf raises", category: "physical" },
  { text: "write down a random memory from childhood", category: "chill" },
  { text: "ask a question you've always wondered", category: "weird" },
];

const CATEGORIES = [
  { id: "all", label: "all", jp: "すべて" },
  { id: "creative", label: "creative", jp: "創造的" },
  { id: "physical", label: "physical", jp: "身体的" },
  { id: "chill", label: "chill", jp: "リラックス" },
  { id: "social", label: "social", jp: "社会的" },
  { id: "productive", label: "productive", jp: "生産的" },
  { id: "weird", label: "weird", jp: "奇妙" },
];

export default function BoredButtonPage() {
  const jpchars = useMemo(() => jpcharlist, []);
  const [category, setCategory] = useState("all");
  const [current, setCurrent] = useState<{ text: string; category: string } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (category === "all") return ACTIVITIES;
    return ACTIVITIES.filter((a) => a.category === category);
  }, [category]);

  const roll = useCallback(() => {
    if (filtered.length === 0) return;
    setRolling(true);
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    setCurrent(pick);
    setHistory((prev) => [pick.text, ...prev].slice(0, 20));
    setTimeout(() => setRolling(false), 400);
  }, [filtered]);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="bored-button" jp="退屈しのぎ" category="fun" href="/fun/bored-button" />
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
            {/* 01. CATEGORIES */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. category{" "}
                <ScrambleText text="カテゴリー" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex flex-col gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`text-[9px] px-3 py-2 border tracking-[0.1em] transition-all text-left uppercase ${
                      category === cat.id
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {cat.label} / {cat.jp}
                  </button>
                ))}
              </div>
            </section>

            {/* 02. ACTIVITY COUNT */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. stats{" "}
                <ScrambleText text="統計" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="border border-white/10 p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                  <span>activities</span>
                  <span className="text-white/70">{filtered.length}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                  <span>history</span>
                  <span className="text-white/70">{history.length}</span>
                </div>
              </div>
            </section>

            {/* 03. HISTORY */}
            {history.length > 0 && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  03. history{" "}
                  <ScrambleText text="履歴" chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {history.map((h, i) => (
                    <div key={`${i}-${h.slice(0, 10)}`} className="text-[9px] text-white/30 border-b border-white/5 pb-1 leading-relaxed">
                      {i + 1}. {h}
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
            className="lg:col-span-8 flex flex-col items-center justify-center gap-12 bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {!current && (
              <ScrambleText
                text="select_a_category_and_press_the_button"
                className="text-white/10 text-xs tracking-[0.5em] italic"
              />
            )}

            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.text}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="text-center max-w-lg"
                >
                  <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-4">
                    {current.category}
                  </div>
                  <div className="text-xl sm:text-2xl text-white/90 leading-relaxed tracking-wide">
                    {current.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={roll}
              disabled={rolling || filtered.length === 0}
              whileTap={{ scale: 0.95 }}
              className={`px-16 py-6 border-2 text-sm uppercase tracking-[0.3em] transition-all ${
                rolling
                  ? "border-white/20 text-white/20"
                  : "border-white/40 text-white/60 hover:text-white hover:border-white hover:bg-white/5"
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {rolling ? "..." : filtered.length === 0 ? "empty" : "I'M BORED"}
            </motion.button>

            <div className="text-[8px] tracking-[0.4em] uppercase text-white/15">
              {filtered.length} possible activities
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
