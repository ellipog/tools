"use client";

import { useState } from "react";
import SettingsPanel from "./SettingsPanel";

export default function SettingsButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-xs tracking-[0.3em] uppercase cursor-pointer transition-colors ${className}`}
      >
        THEME
      </button>
      <SettingsPanel isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}