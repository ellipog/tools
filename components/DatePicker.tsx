import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type DatePickerProps = {
  value: string;
  onChange: (val: string) => void;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDisplay(val: string): string {
  if (!val) return "select_date";
  const d = new Date(val + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const date = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  useEffect(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(8, rect.left + window.scrollX),
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || pickerRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayClick = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setIsOpen(false);
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const selYear = value ? parseInt(value.slice(0, 4)) : 0;
  const selMonth = value ? parseInt(value.slice(5, 7)) - 1 : -1;
  const selDay = value ? parseInt(value.slice(8, 10)) : 0;

  const dim = daysInMonth(viewYear, viewMonth);
  const start = startDay(viewYear, viewMonth);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-4 py-3 outline-none focus:border-white/40 uppercase tracking-widest text-left"
      >
        {formatDisplay(value) || "select_date"}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={pickerRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ position: "absolute", top: coords.top, left: coords.left, zIndex: 9999 }}
                className="w-72 p-4 bg-neutral-900 border border-white/10 shadow-2xl"
              >
                {/* Month/Year nav */}
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={prevMonth} className="text-white/40 hover:text-white transition-colors text-sm px-2 py-1 shrink-0">&lt;</button>
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    className="flex-1 bg-transparent text-xs tracking-widest uppercase text-white/70 text-center border border-white/10 py-1.5 px-2 outline-none focus:border-white/40 cursor-pointer [color-scheme:dark]"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i} className="bg-neutral-900">{m}</option>
                    ))}
                  </select>
                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                    className="flex-1 bg-transparent text-xs tracking-widest text-white/70 text-center border border-white/10 py-1.5 px-2 outline-none focus:border-white/40 cursor-pointer [color-scheme:dark]"
                  >
                    {Array.from({ length: 201 }, (_, i) => {
                      const y = 2026 - 100 + i;
                      return (
                        <option key={y} value={y} className="bg-neutral-900">{y}</option>
                      );
                    })}
                  </select>
                  <button onClick={nextMonth} className="text-white/40 hover:text-white transition-colors text-sm px-2 py-1 shrink-0">&gt;</button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {DAYS.map((d) => (
                    <div key={d} className="text-[9px] tracking-wider text-white/25 text-center h-6 flex items-center justify-center">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: start }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: dim }, (_, i) => {
                    const day = i + 1;
                    const isSel = viewYear === selYear && viewMonth === selMonth && day === selDay;
                    const isToday = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === todayStr;
                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className={`h-8 text-[11px] rounded transition-all ${
                          isSel
                            ? "bg-white text-black font-bold"
                            : isToday
                              ? "text-white border border-white/30"
                              : "text-white/50 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Today button */}
                <button
                  onClick={() => {
                    const d = new Date();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    onChange(`${d.getFullYear()}-${m}-${day}`);
                    setIsOpen(false);
                  }}
                  className="w-full mt-3 text-[9px] tracking-widest uppercase text-white/30 hover:text-white transition-colors py-1.5 border-t border-white/10 pt-3"
                >
                  today
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}