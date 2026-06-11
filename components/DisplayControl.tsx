"use client";

import { useEffect, useState } from "react";
import SettingsButton from "./SettingsButton";

const CRT_KEY = "aaenz:crt";
type CrtPref = "on" | "off";

function applyCrtClass(enabled: boolean) {
  document.documentElement.classList.toggle("crt-on", enabled);
}

export default function DisplayControl() {
  const [crtEnabled, setCrtEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CRT_KEY) as CrtPref | null;
    const initial = stored ? stored === "on" : true;
    setCrtEnabled(initial);
    applyCrtClass(initial);
  }, []);

  const toggleCrt = () => {
    setCrtEnabled((prev) => {
      const next = !prev;
      applyCrtClass(next);
      localStorage.setItem(CRT_KEY, next ? "on" : "off");
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2 bg-[#0A0A0A] border border-white/10 px-3 py-2 w-fit">
      <span className="text-[8px] tracking-[0.3em] text-white/20 uppercase leading-none">
        DISPLAY_CTRL
      </span>
      <div className="flex items-center gap-3">
        <SettingsButton className="text-white/40 hover:text-white/70" />
        <span className="text-[8px] text-white/10 select-none">|</span>
        <button
          onClick={toggleCrt}
          className={`text-xs tracking-[0.3em] uppercase cursor-pointer transition-colors ${
            crtEnabled ? "text-white" : "text-white/30 hover:text-white/60"
          }`}
        >
          CRT
        </button>
      </div>
    </div>
  );
}