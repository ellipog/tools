"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import {
  generatePassword,
  getStrengthColor,
  getStrengthBarWidth,
} from "@/lib/password-generator";

export default function PasswordGeneratorPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [length, setLength] = useState(20);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [regenKey, setRegenKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const effectiveSets = useMemo(() => {
    const hasAny = useUpper || useLower || useDigits || useSymbols;
    return {
      upper: useUpper,
      lower: hasAny ? useLower : true,
      digits: useDigits,
      symbols: useSymbols,
    };
  }, [useUpper, useLower, useDigits, useSymbols]);

  const result = useMemo(() => {
    return generatePassword(length, effectiveSets, excludeAmbiguous);
  }, [length, effectiveSets, excludeAmbiguous, regenKey]);

  const handleRegenerate = useCallback(() => {
    setRegenKey((k) => k + 1);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result.password]);

  const strengthColor = useMemo(
    () => getStrengthColor(result.strength),
    [result.strength],
  );
  const barWidth = useMemo(
    () => getStrengthBarWidth(result.entropy),
    [result.entropy],
  );

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar
        title="password-generator"
        jp="パスワード生成"
        category="utils"
        href="/utils/password-generator"
      />

      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${strengthColor}`}
            />
            {result.strength === "very-strong"
              ? "very-strong"
              : result.strength}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. OPTIONS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. options{" "}
                <ScrambleText
                  text="オプション"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>

              {/* Length slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] tracking-widest uppercase">
                  <span className="text-white/40">length</span>
                  <span className="text-white/80 font-mono">{length}</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={64}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-white/20 tracking-widest">
                  <span>4</span>
                  <span>64</span>
                </div>
              </div>

              {/* Character set toggles */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setUseUpper((v) => !v)}
                  className={`border p-2 text-[10px] tracking-widest transition-all ${
                    useUpper
                      ? "bg-white text-black border-white font-bold"
                      : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                  }`}
                >
                  A–Z
                </button>
                <button
                  onClick={() => setUseLower((v) => !v)}
                  className={`border p-2 text-[10px] tracking-widest transition-all ${
                    useLower
                      ? "bg-white text-black border-white font-bold"
                      : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                  }`}
                >
                  a–z
                </button>
                <button
                  onClick={() => setUseDigits((v) => !v)}
                  className={`border p-2 text-[10px] tracking-widest transition-all ${
                    useDigits
                      ? "bg-white text-black border-white font-bold"
                      : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                  }`}
                >
                  0–9
                </button>
                <button
                  onClick={() => setUseSymbols((v) => !v)}
                  className={`border p-2 text-[10px] tracking-widest transition-all ${
                    useSymbols
                      ? "bg-white text-black border-white font-bold"
                      : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                  }`}
                >
                  !@#$
                </button>
              </div>

              {/* Exclude ambiguous toggle */}
              <button
                onClick={() => setExcludeAmbiguous((v) => !v)}
                className="flex items-center gap-4 group"
              >
                <div
                  className={`w-4 h-4 border transition-all shrink-0 ${
                    excludeAmbiguous
                      ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] border-white"
                      : "border-white/20"
                  }`}
                />
                <span
                  className={`text-[10px] tracking-widest uppercase transition-colors ${
                    excludeAmbiguous ? "text-white" : "text-white/30"
                  }`}
                >
                  exclude il1o0O
                </span>
              </button>
            </section>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            {/* Password display */}
            <div className="bg-white/[0.02] border border-white/5">
              <div className="text-[10px] text-white/20 uppercase tracking-[0.4em] px-4 pt-3 pb-1">
                <ScrambleText text="password" />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${regenKey}-${length}-${useUpper}-${useLower}-${useDigits}-${useSymbols}-${excludeAmbiguous}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono text-[22px] sm:text-[28px] tracking-[0.15em] p-4 sm:p-6 break-all select-all text-white/90"
                >
                  {result.password}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Strength bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] tracking-widest uppercase">
                <span className="text-white/40">
                  strength — {result.strength.replace("-", "_")}
                </span>
                <span className="text-white/50 font-mono">
                  {result.entropy} bits
                </span>
              </div>
              <div className="w-full h-1 bg-white/10">
                <div
                  className={`h-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5">
              <button
                onClick={handleCopy}
                className="flex-1 border border-white/10 p-3 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all"
              >
                {copied ? "copied!" : "copy"}
              </button>
              <button
                onClick={handleRegenerate}
                className="flex-1 border border-white/10 p-3 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all"
              >
                regenerate
              </button>
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
