"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";

type Age = { years: number; months: number; days: number; hours: number; minutes: number; seconds: number };

function calcAge(birth: Date, now: Date): Age {
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  let hours = now.getHours() - birth.getHours();
  let minutes = now.getMinutes() - birth.getMinutes();
  let seconds = now.getSeconds() - birth.getSeconds();

  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prev; months--;
  }
  if (months < 0) { months += 12; years--; }

  return { years, months, days, hours, minutes, seconds };
}

function totalDays(birth: Date, now: Date): number {
  return Math.floor((now.getTime() - birth.getTime()) / 86400000);
}

function nextBirthday(birth: Date, now: Date): { days: number; date: string } {
  const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next <= now) next.setFullYear(next.getFullYear() + 1);
  const days = Math.ceil((next.getTime() - now.getTime()) / 86400000);
  return { days, date: next.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) };
}

function zodiac(month: number, day: number): string {
  const signs = [
    { name: "Capricorn", end: 119 }, { name: "Aquarius", end: 218 },
    { name: "Pisces", end: 320 }, { name: "Aries", end: 419 },
    { name: "Taurus", end: 520 }, { name: "Gemini", end: 620 },
    { name: "Cancer", end: 722 }, { name: "Leo", end: 822 },
    { name: "Virgo", end: 922 }, { name: "Libra", end: 1022 },
    { name: "Scorpio", end: 1121 }, { name: "Sagittarius", end: 1221 },
    { name: "Capricorn", end: 1231 },
  ];
  const md = month * 100 + day;
  for (const s of signs) {
    if (md <= s.end) return s.name;
  }
  return "Capricorn";
}

export default function AgeCalculator() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [includeTime, setIncludeTime] = useState(false);
  const [birthTime, setBirthTime] = useState("09:00");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const birth = useMemo(() => {
    const d = new Date(birthDate);
    if (includeTime) {
      const [h, m] = birthTime.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    }
    return d;
  }, [birthDate, includeTime, birthTime]);

  const age = useMemo(() => calcAge(birth, now), [birth, now]);
  const daysAlive = useMemo(() => totalDays(birth, now), [birth, now]);
  const nextBday = useMemo(() => nextBirthday(birth, now), [birth, now]);
  const sign = useMemo(() => zodiac(birth.getMonth() + 1, birth.getDate()), [birth]);
  const totalHeartbeats = useMemo(() => Math.round(daysAlive * 86400 * 1.2), [daysAlive]);
  const totalSleepHours = useMemo(() => daysAlive * 8, [daysAlive]);
  const isValid = birth <= now;

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="age_calculator" jp="年齢計算" category="utils" href="/utils/age-calculator" />
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
            {/* 01. BIRTH */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. birth{" "}
                <ScrambleText text={"誕生日"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <DatePicker value={birthDate} onChange={setBirthDate} />
              <button
                onClick={() => setIncludeTime(!includeTime)}
                className="flex items-center gap-4 group"
              >
                <div className={`w-4 h-4 border transition-all shrink-0 ${includeTime ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] border-white" : "border-white/20"}`} />
                <span className={`text-[10px] tracking-widest uppercase transition-colors ${includeTime ? "text-white" : "text-white/30"}`}>
                  include_time
                </span>
              </button>
              {includeTime && <TimePicker value={birthTime} onChange={setBirthTime} />}
            </section>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {!isValid ? (
              <div className="flex-1 flex items-center justify-center">
                <ScrambleText text="birth_must_be_in_the_past" className="text-white/10 text-xs tracking-[0.5em] italic" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-10">
                {/* AGE */}
                <div className="text-center">
                  <div className="text-[72px] sm:text-[96px] font-light tracking-tighter text-white leading-none tabular-nums">
                    {age.years}
                  </div>
                  <div className="text-[10px] tracking-[0.4em] uppercase text-white/30 mt-2">
                    years old
                  </div>
                </div>

                {/* BREAKDOWN */}
                <div className="flex gap-6 sm:gap-10 text-center">
                  {[
                    { label: "months", value: age.months },
                    { label: "days", value: age.days },
                    { label: "hours", value: age.hours },
                    { label: "minutes", value: age.minutes },
                    { label: "seconds", value: age.seconds },
                  ].map((item) => (
                    <div key={item.label} className="tabular-nums">
                      <div className="text-2xl sm:text-3xl font-light text-white/80">
                        {String(item.value).padStart(2, "0")}
                      </div>
                      <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mt-1">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* DIVIDER */}
                <div className="w-full max-w-md border-t border-white/5" />

                {/* NEXT BIRTHDAY */}
                <div className="text-center space-y-1">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                    next birthday
                  </div>
                  <div className="text-lg text-white/80">{nextBday.date}</div>
                  <div className="text-sm text-white/50">
                    in <span className="text-white tabular-nums">{nextBday.days}</span> days
                  </div>
                </div>

                {/* DIVIDER */}
                <div className="w-full max-w-md border-t border-white/5" />

                {/* FUN STATS */}
                <div className="flex flex-wrap justify-center gap-6 w-full max-w-lg">
                  <div className="flex-1 min-w-[100px] text-center">
                    <div className="text-xl text-white tabular-nums">{daysAlive.toLocaleString()}</div>
                    <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mt-1">days alive</div>
                  </div>
                  <div className="flex-1 min-w-[100px] text-center">
                    <div className="text-xl text-white tabular-nums">{totalSleepHours.toLocaleString()}</div>
                    <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mt-1">hours slept</div>
                  </div>
                  <div className="flex-1 min-w-[100px] text-center">
                    <div className="text-xl text-white tabular-nums">{totalHeartbeats.toLocaleString()}</div>
                    <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mt-1">beats</div>
                  </div>
                  <div className="flex-1 min-w-[100px] text-center">
                    <div className="text-xl text-white">{sign}</div>
                    <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mt-1">zodiac</div>
                  </div>
                </div>
              </div>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}