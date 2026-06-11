"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "./ThemeProvider";

const CRT_KEY = "aaenz:crt";
type CrtPref = "on" | "off";

function applyCrtClass(enabled: boolean) {
  document.documentElement.classList.toggle("crt-on", enabled);
}

function useCrt() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CRT_KEY) as CrtPref | null;
    const initial = stored ? stored === "on" : true;
    setEnabled(initial);
    applyCrtClass(initial);
  }, []);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      applyCrtClass(next);
      localStorage.setItem(CRT_KEY, next ? "on" : "off");
      return next;
    });
  };

  return { enabled, toggle };
}

export default function DisplayControl() {
  const { theme, toggle: toggleTheme } = useTheme();
  const crt = useCrt();

  const themeLabel = useMemo(
    () => (theme === "dark" ? "LIGHT" : "DARK"),
    [theme],
  );

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2 bg-[#0A0A0A] border border-white/10 px-3 py-2 min-w-[120px]">
      <span className="text-[8px] tracking-[0.3em] text-white/20 uppercase leading-none">
        DISPLAY_CTRL
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="text-xs tracking-[0.3em] uppercase cursor-pointer transition-colors text-white/40 hover:text-white/70"
        >
          {themeLabel}
        </button>
        <span className="text-[8px] text-white/10 select-none">|</span>
        <button
          onClick={crt.toggle}
          className={`text-xs tracking-[0.3em] uppercase cursor-pointer transition-colors ${
            crt.enabled
              ? "text-white"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          CRT
        </button>
      </div>
    </div>
  );
}