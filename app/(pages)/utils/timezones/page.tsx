"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import ShareButton from "@/components/ShareButton";
import { jpcharlist } from "@/public/data/charlists";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  getAllTimezones,
  getTimezoneInfo,
  formatTime,
  formatDate,
  isDST,
  normalizeHour,
  getSunriseSunset,
  type TimezoneInfo,
} from "@/lib/timezone-engine";

const SHORTCUTS = ["America/New_York", "Europe/London", "Asia/Tokyo", "America/Los_Angeles", "Australia/Sydney"];
const SHORTCUT_LABELS: Record<string, string> = {
  "America/New_York": "NYC",
  "Europe/London": "LDN",
  "Asia/Tokyo": "TKY",
  "America/Los_Angeles": "SFO",
  "Australia/Sydney": "SYD",
};
const STORAGE_KEY = "runen:timezone-presets";
const MAX_ZONES = 8;

interface Preset {
  name: string;
  zones: string[];
}

interface ZoneEntry {
  id: string;
  info: TimezoneInfo;
  localTime: string;
  localDate: string;
  isDST: boolean;
  sunriseHour: number;
  sunsetHour: number;
}

export default function TimezonesPage() {
  const jpchars = useMemo(() => jpcharlist, []);
  const allZones = useMemo(() => getAllTimezones(), []);

  const [zones, setZones] = useLocalStorage<string[]>("runen:timezones-zones", ["America/New_York", "Europe/London", "Asia/Tokyo"]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  });
  const [hour12, setHour12] = useLocalStorage("runen:timezones-hour12", false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const date = useMemo(() => {
    const d = new Date(`${selectedDate}T${selectedTime}:00`);
    return d;
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPresets(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allZones
      .filter((z) => z.toLowerCase().includes(q))
      .slice(0, 20);
  }, [searchQuery, allZones]);

  const zoneEntries = useMemo((): ZoneEntry[] => {
    return zones.map((id) => {
      const info = getTimezoneInfo(id, date);
      const ss = getSunriseSunset(id, date);
      return {
        id,
        info,
        localTime: formatTime(id, date, hour12),
        localDate: formatDate(id, date),
        isDST: isDST(id, date),
        sunriseHour: ss?.sunrise ?? 6,
        sunsetHour: ss?.sunset ?? 18,
      };
    });
  }, [zones, date, hour12]);

  const cursorHour = useMemo(() => {
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
    return normalizeHour(utcHours);
  }, [date]);

  const addZone = useCallback((id: string) => {
    setZones((prev) => (prev.length < MAX_ZONES && !prev.includes(id) ? [...prev, id] : prev));
    setSearchQuery("");
    setShowDropdown(false);
  }, []);

  const removeZone = useCallback((id: string) => {
    setZones((prev) => prev.filter((z) => z !== id));
  }, []);

  const moveZone = useCallback((from: number, to: number) => {
    setZones((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const setNow = useCallback(() => {
    const d = new Date();
    setSelectedDate(d.toISOString().slice(0, 10));
    setSelectedTime(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`);
  }, []);

  const savePreset = useCallback(() => {
    if (!presetName.trim() || zones.length === 0) return;
    const newPreset: Preset = { name: presetName.trim(), zones: [...zones] };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPresetName("");
  }, [presetName, zones, presets]);

  const loadPreset = useCallback((preset: Preset) => {
    setZones(preset.zones);
  }, []);

  const deletePreset = useCallback((index: number) => {
    setPresets((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const formatOverlapTime = useCallback((hour: number): string => {
    const h = normalizeHour(hour);
    if (hour12) {
      const period = h >= 12 ? "PM" : "AM";
      const display = h % 12 || 12;
      return `${display}${period}`;
    }
    return `${h.toString().padStart(2, "0")}:00`;
  }, [hour12]);

  const getBarSegment = useCallback((zone: ZoneEntry, hour: number): "night" | "day" => {
    const h = normalizeHour(hour - zone.info.offset);
    return h < zone.sunriseHour || h >= zone.sunsetHour ? "night" : "day";
  }, []);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="timezones" jp="タイムゾーン" category="utils" href="/utils/timezones" />

      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <div className="text-[13px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {zones.length} zones
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. ZONES */}
            <section className="space-y-4">
              <div className="text-base text-white/70 tracking-[0.2em] uppercase mb-4">
                01. zones{" "}
                <ScrambleText
                  text="タイムゾーン"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>

              <div className="space-y-1" ref={searchRef}>
                <div className="relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="add timezone..."
                    className="w-full bg-transparent border border-white/10 p-2.5 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/30 uppercase tracking-widest"
                  />
                  {showDropdown && searchQuery && filteredZones.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-[#0A0A0A] border border-white/10 max-h-48 overflow-y-auto z-20 custom-scrollbar">
                      {filteredZones.map((z) => {
                        const alreadyAdded = zones.includes(z);
                        return (
                          <button
                            key={z}
                            onClick={() => !alreadyAdded && addZone(z)}
                            disabled={alreadyAdded}
                            className={`w-full text-left px-3 py-2 text-[13px] uppercase tracking-wider truncate cursor-pointer ${
                              alreadyAdded
                                ? "text-white/20 hover:bg-transparent cursor-default"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {z.replace(/_/g, " ")}
                            {alreadyAdded && <span className="ml-2 text-[9px] text-white/20 tracking-widest">(added)</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {SHORTCUTS.filter((s) => !zones.includes(s)).map((s) => (
                    <button
                      key={s}
                      onClick={() => addZone(s)}
                      disabled={zones.length >= MAX_ZONES}
                      className="border border-white/10 px-3 py-1.5 text-[11px] text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-widest cursor-pointer"
                    >
                      {SHORTCUT_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                {zoneEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    draggable
                    onDragStart={() => setDraggedIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={() => { if (draggedIndex !== null && draggedIndex !== i) moveZone(draggedIndex, i); setDraggedIndex(null); }}
                    className="flex items-center gap-2 border border-white/10 p-2.5 group hover:border-white/30 transition-all"
                  >
                    <span className="text-white/20 text-[11px] cursor-grab">⣿</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] uppercase tracking-wider truncate text-white/70">
                        {entry.id.split("/").pop()?.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-white/30 tracking-widest">
                        {entry.info.offsetLabel} {entry.isDST && <span className="text-yellow-400/70">DST</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeZone(entry.id)}
                      className="text-white/20 hover:text-white/60 text-[13px] transition-all cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 02. TIME */}
            <section className="space-y-4">
              <div className="text-base text-white/70 tracking-[0.2em] uppercase mb-4">
                02. time{" "}
                <ScrambleText
                  text="時刻"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 bg-transparent border border-white/10 p-2.5 text-[13px] text-white/80 focus:outline-none focus:border-white/30 uppercase tracking-widest"
                />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="flex-1 bg-transparent border border-white/10 p-2.5 text-[13px] text-white/80 focus:outline-none focus:border-white/30 uppercase tracking-widest"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={setNow}
                  className="flex-1 border border-white/10 p-2.5 text-[13px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                >
                  now
                </button>
                <button
                  onClick={() => setHour12(!hour12)}
                  className={`flex-1 border p-2.5 text-[13px] uppercase tracking-widest transition-all cursor-pointer ${
                    hour12 ? "bg-white text-black border-white" : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                  }`}
                >
                  {hour12 ? "12h" : "24h"}
                </button>
              </div>
            </section>

            {/* 03. PRESETS */}
            <section className="space-y-4">
              <div className="text-base text-white/70 tracking-[0.2em] uppercase mb-4">
                03. presets{" "}
                <ScrambleText
                  text="プリセット"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="preset name"
                  className="flex-1 bg-transparent border border-white/10 p-2.5 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/30 uppercase tracking-widest"
                />
                <button
                  onClick={savePreset}
                  disabled={!presetName.trim() || zones.length === 0}
                  className="border border-white/10 px-4 text-[13px] text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-widest cursor-pointer"
                >
                  save
                </button>
              </div>
              <div className="space-y-1.5">
                {presets.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 border border-white/10 p-2.5 group hover:border-white/30 transition-all">
                    <button
                      onClick={() => loadPreset(p)}
                      className="flex-1 text-left text-[13px] text-white/60 hover:text-white uppercase tracking-wider truncate cursor-pointer"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => deletePreset(i)}
                      className="text-white/20 hover:text-white/60 text-[13px] transition-all cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {presets.length === 0 && (
                  <div className="text-[10px] text-white/20 tracking-widest uppercase">
                    no saved presets
                  </div>
                )}
              </div>
            </section>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            {/* TIMELINE */}
            <div className="bg-white/[0.02] border border-white/5 min-h-[40vh]">
              <div className="text-[13px] text-white/20 uppercase tracking-[0.4em] px-4 pt-3 pb-1">
                <ScrambleText text="timeline" />
              </div>

              {zoneEntries.length === 0 ? (
                <div className="flex-1 flex items-center justify-center min-h-[30vh]">
                  <ScrambleText
                    text="add_timezones"
                    className="text-white/10 text-sm tracking-[0.5em] italic"
                  />
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Legend */}
                  <div className="flex items-center gap-6 text-[9px] text-white/30 tracking-widest uppercase border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-2.5 bg-white/[0.03] border border-white/5" />
                      night
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-2.5 bg-white/[0.07] border border-white/5" />
                      day
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-px h-3 bg-white/60" />
                      cursor
                    </div>
                  </div>

                  {/* Hour labels */}
                  <div className="flex">
                    <div className="w-40 shrink-0" />
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="flex-1 text-[9px] text-white/20 text-center tracking-wider">
                        {hour12
                          ? `${i % 12 || 12}${i < 12 ? "a" : "p"}`
                          : i.toString().padStart(2, "0")}
                      </div>
                    ))}
                  </div>

                  {/* Zone bars */}
                  {zoneEntries.map((entry) => (
                    <div key={entry.id} className="flex items-start group">
                      <div className="w-40 shrink-0 pr-3 pt-1">
                        <div className="text-[13px] uppercase tracking-wider truncate text-white/70">
                          {entry.id.split("/").pop()?.replace(/_/g, " ")}
                        </div>
                        <div className="text-[10px] text-white/30 tracking-widest">
                          {entry.info.offsetLabel} · {entry.localTime}
                          {entry.isDST && <span className="text-yellow-400/70 ml-1">DST</span>}
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        <div className="relative h-10 border border-white/5 overflow-hidden">
                          {Array.from({ length: 24 }, (_, hour) => {
                            const seg = getBarSegment(entry, hour);
                            return (
                              <div
                                key={hour}
                                className={`absolute top-0 bottom-0 transition-colors ${
                                  seg === "night" ? "bg-white/[0.03]" : "bg-white/[0.07]"
                                }`}
                                style={{ left: `${(hour / 24) * 100}%`, width: `${100 / 24}%` }}
                                title={`${entry.id}: ${hour}:00`}
                              />
                            );
                          })}
                          {/* Hour grid lines */}
                          {Array.from({ length: 23 }, (_, i) => (
                            <div
                              key={`grid-${i}`}
                              className="absolute top-0 bottom-0 w-px bg-white/[0.015]"
                              style={{ left: `${((i + 1) / 24) * 100}%` }}
                            />
                          ))}
                          {/* Cursor line */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10 shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                            style={{ left: `${(cursorHour / 24) * 100}%` }}
                          >
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-white/70" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CONVERTED TIMES */}
            <div className="bg-[#050505] border border-white/5">
              <div className="text-[13px] text-white/20 uppercase tracking-[0.4em] px-4 pt-3 pb-1">
                <ScrambleText text="converted_times" />
              </div>
              {zoneEntries.length > 0 ? (
                <div className="p-4">
                  <div className="grid gap-3">
                    {zoneEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between border border-white/5 p-3">
                        <div>
                          <div className="text-[13px] uppercase tracking-wider text-white/70">
                            {entry.id.replace(/_/g, " ")}
                          </div>
                          <div className="text-[10px] text-white/30 tracking-widest">
                            {entry.localDate}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-mono tracking-wider text-white/90">
                            {entry.localTime}
                          </div>
                          <div className="text-[10px] text-white/30 tracking-widest">
                            {entry.info.offsetLabel}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 flex items-center justify-center">
                  <ScrambleText
                    text="add_zones_to_convert"
                    className="text-white/10 text-sm tracking-[0.5em] italic"
                  />
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-1.5 justify-end">
              <ShareButton
                data={zoneEntries.map((z) => `${z.id}: ${z.localTime} ${z.localDate}`).join("\n")}
                filename="timezones.txt"
              />
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}