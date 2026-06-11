"use client";

import { useTheme } from "./ThemeProvider";
import { useMemo } from "react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  const label = useMemo(
    () => (theme === "dark" ? "LIGHT" : "DARK"),
    [theme],
  );

  return (
    <div className="fixed right-4 top-4 z-10000">
      <button
        onClick={toggle}
        className="text-xs tracking-[0.3em] uppercase cursor-pointer transition-colors text-white/40 hover:text-white/70"
      >
        {label}
      </button>
    </div>
  );
}