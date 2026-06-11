"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";

type Unit = "metric" | "imperial";

function calcBMI(weight: number, height: number, unit: Unit): number {
  if (height <= 0 || weight <= 0) return 0;
  if (unit === "metric") return weight / ((height / 100) * (height / 100));
  return (weight / (height * height)) * 703;
}

function category(bmi: number): { label: string; color: string; range: string } {
  if (bmi < 18.5) return { label: "underweight", color: "text-blue-400", range: "< 18.5" };
  if (bmi < 25) return { label: "normal", color: "text-green-400", range: "18.5–24.9" };
  if (bmi < 30) return { label: "overweight", color: "text-orange-400", range: "25–29.9" };
  return { label: "obese", color: "text-red-400", range: "≥ 30" };
}

function healthyRange(height: number, unit: Unit): { low: number; high: number } {
  if (height <= 0) return { low: 0, high: 0 };
  if (unit === "metric") {
    const hM = height / 100;
    return { low: Math.round(18.5 * hM * hM * 10) / 10, high: Math.round(24.9 * hM * hM * 10) / 10 };
  }
  return { low: Math.round(18.5 * height * height / 703 * 10) / 10, high: Math.round(24.9 * height * height / 703 * 10) / 10 };
}

function gaugePercent(bmi: number): number {
  if (bmi <= 13) return 0;
  if (bmi >= 40) return 100;
  return ((bmi - 13) / (40 - 13)) * 100;
}

export default function BMICalculator() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [unit, setUnit] = useState<Unit>("metric");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const w = parseFloat(weight);
  const h = parseFloat(height);
  const bmi = calcBMI(w, h, unit);
  const cat = category(bmi);
  const range = healthyRange(h, unit);
  const gpct = gaugePercent(bmi);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="bmi_calculator" jp="BMI計算" category="utils" href="/utils/bmi-calculator" />
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
            {/* 01. UNIT */}
            <section className="space-y-3">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. unit{" "}
                <ScrambleText text={"単位"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex gap-1.5">
                {(["metric", "imperial"] as Unit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`flex-1 text-[10px] py-2 px-3 border tracking-[0.2em] uppercase transition-all ${
                      unit === u
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {u === "metric" ? "metric" : "imperial"}
                  </button>
                ))}
              </div>
            </section>

            {/* 02. HEIGHT */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. height{" "}
                <ScrambleText text={"身長"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-4 py-3 outline-none focus:border-white/40 placeholder:text-white/20 uppercase tracking-widest"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 tracking-widest uppercase">
                  {unit === "metric" ? "cm" : "in"}
                </span>
              </div>
            </section>

            {/* 03. WEIGHT */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. weight{" "}
                <ScrambleText text={"体重"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-4 py-3 outline-none focus:border-white/40 placeholder:text-white/20 uppercase tracking-widest"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 tracking-widest uppercase">
                  {unit === "metric" ? "kg" : "lbs"}
                </span>
              </div>
            </section>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {!w || !h || h <= 0 || w <= 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <ScrambleText text="enter_height_and_weight" className="text-white/10 text-xs tracking-[0.5em] italic" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-10">
                {/* BMI number */}
                <div className="text-center">
                  <div className="text-[72px] sm:text-[96px] font-light tracking-tighter text-white leading-none tabular-nums">
                    {bmi.toFixed(1)}
                  </div>
                  <div className={`text-[12px] tracking-[0.4em] uppercase mt-3 ${cat.color}`}>
                    {cat.label}
                  </div>
                </div>

                {/* Gauge */}
                <div className="w-full max-w-md">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${gpct}%`,
                        background: "linear-gradient(to right, #60a5fa, #22c55e, #f97316, #ef4444)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] tracking-widest text-white/20 mt-1 uppercase">
                    <span>13</span>
                    <span>18.5</span>
                    <span>25</span>
                    <span>30</span>
                    <span>40</span>
                  </div>
                </div>

                {/* Healthy range */}
                {(range.low > 0) && (
                  <div className="text-center space-y-1">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                      healthy BMI range
                    </div>
                    <div className="text-sm text-white/70">
                      {range.low}–{range.high} {unit === "metric" ? "kg" : "lbs"}
                    </div>
                  </div>
                )}

                {/* Category breakdown */}
                <div className="grid grid-cols-4 gap-4 w-full max-w-md text-center">
                  {[
                    { label: "underweight", range: "< 18.5", color: "text-blue-400", active: bmi < 18.5 },
                    { label: "normal", range: "18.5–24.9", color: "text-green-400", active: bmi >= 18.5 && bmi < 25 },
                    { label: "overweight", range: "25–29.9", color: "text-orange-400", active: bmi >= 25 && bmi < 30 },
                    { label: "obese", range: "≥ 30", color: "text-red-400", active: bmi >= 30 },
                  ].map((c) => (
                    <div key={c.label} className={`text-center ${c.active ? c.color : "text-white/15"}`}>
                      <div className="text-xs font-bold tabular-nums">{c.range}</div>
                      <div className="text-[7px] tracking-[0.3em] uppercase mt-1">{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}