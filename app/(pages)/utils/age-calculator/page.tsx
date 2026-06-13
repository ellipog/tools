"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import {
  calcAge, totalDays, nextBirthday, nextBirthdayCountdown,
  zodiac, dayOfWeek, birthSeason, chineseZodiac,
  totalAge, planetAges, lifeProgress, upcomingMilestones,
  absurdStats, generation, animalYears, lifeWeeks,
} from "@/lib/age-utils";

export default function AgeCalculator() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [includeTime, setIncludeTime] = useState(false);
  const [birthTime, setBirthTime] = useState("09:00");
  const [now, setNow] = useState<Date | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("aaenz:age-calculator");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.birthDate) setBirthDate(parsed.birthDate);
        if (typeof parsed.includeTime === "boolean") setIncludeTime(parsed.includeTime);
        if (parsed.birthTime) setBirthTime(parsed.birthTime);
      }
    } catch {}
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    sessionStorage.setItem("aaenz:age-calculator", JSON.stringify({ birthDate, includeTime, birthTime }));
  }, [birthDate, includeTime, birthTime]);

  useEffect(() => {
    setNow(new Date());
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

  const age = useMemo(() => now ? calcAge(birth, now) : null, [birth, now]);
  const daysAlive = useMemo(() => now ? totalDays(birth, now) : 0, [birth, now]);
  const nextBday = useMemo(() => now ? nextBirthday(birth, now) : null, [birth, now]);
  const countdown = useMemo(() => now ? nextBirthdayCountdown(birth, now) : null, [birth, now]);
  const sign = useMemo(() => zodiac(birth.getMonth() + 1, birth.getDate()), [birth]);
  const totalHeartbeats = useMemo(() => Math.round(daysAlive * 86400 * 1.2), [daysAlive]);
  const totalSleepHours = useMemo(() => daysAlive * 8, [daysAlive]);
  const totalAgeData = useMemo(() => now ? totalAge(birth, now) : null, [birth, now]);
  const pct = useMemo(() => now ? lifeProgress(age?.years ?? 0) : 0, [age, now]);
  const milestones = useMemo(() => now ? upcomingMilestones(birth, now) : [], [birth, now]);
  const stats = useMemo(() => now ? absurdStats(daysAlive, age?.years ?? 0) : null, [daysAlive, age]);
  const gen = useMemo(() => generation(birth.getFullYear()), [birth]);
  const animal = useMemo(() => age ? animalYears(age.years) : { dog: 0, cat: 0 }, [age]);
  const weeks = useMemo(() => age ? lifeWeeks(age.years) : { lived: 0, remaining: 0, total: 1 }, [age]);
  const planetData = useMemo(() => now ? planetAges(daysAlive) : null, [daysAlive, now]);
  const dow = useMemo(() => dayOfWeek(birth), [birth]);
  const season = useMemo(() => birthSeason(birth.getMonth() + 1, birth.getDate()), [birth]);
  const cz = useMemo(() => chineseZodiac(birth.getFullYear()), [birth]);
  const isValid = now ? birth <= now : false;

  const [showSections, setShowSections] = useState({
    totalTimeAlive: false,
    progressBar: true,
    milestones: false,
    birthDetails: false,
    planetAges: false,
    lifeCalendar: false,
  });

  const toggleSection = (key: keyof typeof showSections) => {
    setShowSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalUnits = useMemo(() => {
    if (!totalAgeData) return [];
    return [
      { label: "months", value: totalAgeData.totalMonths },
      { label: "weeks", value: totalAgeData.totalWeeks },
      { label: "days", value: totalAgeData.totalDays },
      { label: "hours", value: totalAgeData.totalHours },
      { label: "minutes", value: totalAgeData.totalMinutes },
      { label: "seconds", value: totalAgeData.totalSeconds },
    ];
  }, [totalAgeData]);

  const planets = useMemo(() => {
    if (!planetData) return [];
    return Object.entries(planetData).map(([name, ageYears]) => ({
      name,
      age: ageYears.toFixed(ageYears < 1 ? 2 : 1),
    }));
  }, [planetData]);

  const statItems = useMemo(() => {
    if (!stats || !age) return [];
    return [
      { label: "days alive", value: daysAlive.toLocaleString("en-US") },
      { label: "hours slept", value: totalSleepHours.toLocaleString("en-US") },
      { label: "heartbeats", value: totalHeartbeats.toLocaleString("en-US") },
      { label: "zodiac", value: sign },
      { label: "dog years", value: animal.dog.toString() },
      { label: "cat years", value: animal.cat.toString() },
      { label: "breaths", value: stats.breaths.toLocaleString("en-US") },
      { label: "blinks", value: stats.blinks.toLocaleString("en-US") },
      { label: "food (kg)", value: stats.foodKg.toLocaleString("en-US") },
      { label: "steps", value: stats.steps.toLocaleString("en-US") },
      { label: "movies watched", value: stats.movies.toLocaleString("en-US") },
      { label: "cups of coffee", value: stats.cupsOfCoffee.toLocaleString("en-US") },
    ];
  }, [stats, age, daysAlive, totalSleepHours, totalHeartbeats, sign, animal]);

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
            v0.2
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

            {/* 02. SECTIONS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. sections{" "}
                <ScrambleText text={"セクション"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="space-y-2">
                {[
                  { key: "progressBar", label: "life progress" },
                  { key: "totalTimeAlive", label: "total time alive" },
                  { key: "milestones", label: "upcoming milestones" },
                  { key: "birthDetails", label: "birth details" },
                  { key: "planetAges", label: "planet ages" },
                  { key: "lifeCalendar", label: "life calendar" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleSection(key as keyof typeof showSections)}
                    className="flex items-center gap-4 group w-full text-left"
                  >
                    <div className={`w-4 h-4 border transition-all shrink-0 ${showSections[key as keyof typeof showSections] ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] border-white" : "border-white/20"}`} />
                    <span className={`text-[10px] tracking-widest uppercase transition-colors ${showSections[key as keyof typeof showSections] ? "text-white" : "text-white/30"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {!now ? (
              <div className="flex-1 flex items-center justify-center" />
            ) : !age ? (
              <div className="flex-1 flex items-center justify-center">
                <ScrambleText text="birth_must_be_in_the_past" className="text-white/10 text-xs tracking-[0.5em] italic" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-10">
                {/* AGE */}
                <div className="text-center">
                  <div className="text-[72px] sm:text-[96px] font-light tracking-tighter text-white leading-none tabular-nums">
                    {age!.years}
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

                {showSections.totalTimeAlive && (
                <div className="w-full max-w-lg text-center space-y-4">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                    time alive
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {totalUnits.map((u) => (
                      <div key={u.label} className="tabular-nums min-w-[80px]">
                        <div className="text-lg font-light text-white/80">
                          {u.value.toLocaleString("en-US")}
                        </div>
                        <div className="text-[7px] tracking-[0.3em] uppercase text-white/25 mt-0.5">
                          {u.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {showSections.progressBar && (
                <div className="w-full max-w-md text-center space-y-2">
                  <div className="flex justify-between text-[9px] tracking-widest uppercase text-white/30">
                    <span>birth</span>
                    <span>{pct.toFixed(1)}%</span>
                    <span>80 yrs</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(to right, #3b82f6, #22c55e, #f97316, #ef4444)",
                      }}
                    />
                  </div>
                </div>
                )}

                {/* NEXT BIRTHDAY */}
                <div className="text-center space-y-3">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                    next birthday
                  </div>
                  <div className="text-lg text-white/80">{nextBday!.date}</div>
                  <div className="flex justify-center gap-3 tabular-nums">
                    <div>
                      <div className="text-xl text-white">{countdown!.days}</div>
                      <div className="text-[8px] tracking-[0.3em] uppercase text-white/25">days</div>
                    </div>
                    <div className="text-xl text-white/20">:</div>
                    <div>
                      <div className="text-xl text-white">{String(countdown!.hours).padStart(2, "0")}</div>
                      <div className="text-[8px] tracking-[0.3em] uppercase text-white/25">hrs</div>
                    </div>
                    <div className="text-xl text-white/20">:</div>
                    <div>
                      <div className="text-xl text-white">{String(countdown!.minutes).padStart(2, "0")}</div>
                      <div className="text-[8px] tracking-[0.3em] uppercase text-white/25">min</div>
                    </div>
                    <div className="text-xl text-white/20">:</div>
                    <div>
                      <div className="text-xl text-white">{String(countdown!.seconds).padStart(2, "0")}</div>
                      <div className="text-[8px] tracking-[0.3em] uppercase text-white/25">sec</div>
                    </div>
                  </div>
                </div>

                {showSections.milestones && milestones.length > 0 && (
                  <div className="w-full max-w-md text-center space-y-3">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                      upcoming milestones
                    </div>
                    <div className="space-y-1.5">
                      {milestones.map((m, i) => (
                        <div key={i} className="flex justify-between items-center border border-white/5 px-4 py-2">
                          <span className="text-[10px] tracking-widest uppercase text-white/60">{m.label}</span>
                          <span className="text-[10px] text-white/40 tabular-nums">
                            {m.daysUntil.toLocaleString("en-US")} days
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showSections.birthDetails && (
                <div className="text-center space-y-3">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                    born on
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {[
                      { label: "day", value: dow },
                      { label: "season", value: season },
                      { label: "chinese zodiac", value: cz },
                      { label: "generation", value: `${gen.label} (${gen.range})` },
                    ].map((item) => (
                      <div key={item.label} className="min-w-[100px]">
                        <div className="text-sm text-white/80">{item.value}</div>
                        <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mt-0.5">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* FUN STATS */}
                <div className="w-full max-w-lg text-center space-y-4">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                    lifetime stats
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {statItems.map((item) => (
                      <div key={item.label} className="flex-1 min-w-[90px] border border-white/5 px-3 py-2">
                        <div className="text-sm text-white tabular-nums truncate">{item.value}</div>
                        <div className="text-[7px] tracking-[0.3em] uppercase text-white/25 mt-0.5 truncate">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {showSections.planetAges && (
                <div className="w-full max-w-lg text-center space-y-4">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                    age on other planets
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {planets.map((p) => (
                      <div key={p.name} className="flex-1 min-w-[80px]">
                        <div className="text-sm font-light text-white/80 tabular-nums">{p.age}</div>
                        <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mt-0.5">
                          {p.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {showSections.lifeCalendar && (
                <div className="w-full max-w-lg text-center space-y-3">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                    life calendar · each dot = one week
                  </div>
                  <div className="flex justify-center">
                    <div
                      className="grid gap-[1.5px]"
                      style={{ gridTemplateColumns: "repeat(52, 4px)" }}
                    >
                      {Array.from({ length: Math.min(weeks.total, 52 * 90) }, (_, i) => (
                        <div
                          key={i}
                          className={`w-[4px] h-[4px] ${i < weeks.lived ? "bg-white/70" : "bg-white/5"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-[8px] tracking-[0.3em] uppercase text-white/20">
                    {weeks.lived.toLocaleString("en-US")} weeks lived · {weeks.remaining.toLocaleString("en-US")} weeks remaining
                  </div>
                </div>
                )}
              </div>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
