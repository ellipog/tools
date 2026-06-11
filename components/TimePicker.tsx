import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type TimePickerProps = {
  value: string;
  onChange: (val: string) => void;
};

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [hourBuf, setHourBuf] = useState("");
  const [minBuf, setMinBuf] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [h, m] = (value || "09:00").split(":").map(Number);

  useEffect(() => {
    setHourBuf(String(h).padStart(2, "0"));
    setMinBuf(String(m).padStart(2, "0"));
  }, [value, h, m]);

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

  const commit = () => {
    const hr = Math.min(23, Math.max(0, parseInt(hourBuf) || 0));
    const mn = Math.min(59, Math.max(0, parseInt(minBuf) || 0));
    const str = `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
    onChange(str);
    setIsOpen(false);
  };

  const clampHour = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 2);
    setHourBuf(n);
  };

  const clampMin = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 2);
    setMinBuf(n);
  };

  const nudge = (field: "hour" | "min", delta: number) => {
    if (field === "hour") {
      const cur = parseInt(hourBuf) || 0;
      const next = (cur + delta + 24) % 24;
      setHourBuf(String(next).padStart(2, "0"));
    } else {
      const cur = parseInt(minBuf) || 0;
      const next = (cur + delta + 60) % 60;
      setMinBuf(String(next).padStart(2, "0"));
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-4 py-3 outline-none focus:border-white/40 uppercase tracking-widest text-left"
      >
        {value || "select_time"}
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
                className="w-56 p-5 bg-neutral-900 border border-white/10 shadow-2xl"
              >
                {/* CLOCK */}
                <div className="flex items-center justify-center gap-2 mb-5">
                  <div className="relative">
                    <input
                      type="text"
                      value={hourBuf}
                      onChange={(e) => clampHour(e.target.value)}
                      className="w-14 bg-transparent text-3xl font-light text-white text-center outline-none tabular-nums border-b border-white/10 focus:border-white/40"
                      maxLength={2}
                    />
                    <div className="flex absolute -right-5 top-1/2 -translate-y-1/2 flex-col gap-0">
                      <button onClick={() => nudge("hour", 1)} className="text-white/20 hover:text-white text-[10px] leading-none pb-0.5">▲</button>
                      <button onClick={() => nudge("hour", -1)} className="text-white/20 hover:text-white text-[10px] leading-none pt-0.5">▼</button>
                    </div>
                  </div>
                  <span className="text-3xl font-light text-white/40">:</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={minBuf}
                      onChange={(e) => clampMin(e.target.value)}
                      className="w-14 bg-transparent text-3xl font-light text-white text-center outline-none tabular-nums border-b border-white/10 focus:border-white/40"
                      maxLength={2}
                    />
                    <div className="flex absolute -right-5 top-1/2 -translate-y-1/2 flex-col gap-0">
                      <button onClick={() => nudge("min", 1)} className="text-white/20 hover:text-white text-[10px] leading-none pb-0.5">▲</button>
                      <button onClick={() => nudge("min", -1)} className="text-white/20 hover:text-white text-[10px] leading-none pt-0.5">▼</button>
                    </div>
                  </div>
                </div>

                {/* Set + Now */}
                <div className="flex gap-2">
                  <button
                    onClick={commit}
                    className="flex-1 text-[9px] tracking-widest uppercase border border-white/10 py-2 text-white/50 hover:text-white hover:border-white/30 transition-all"
                  >
                    set
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date();
                      onChange(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-[9px] tracking-widest uppercase border border-white/10 py-2 text-white/50 hover:text-white hover:border-white/30 transition-all"
                  >
                    now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}