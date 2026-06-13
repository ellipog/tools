"use client";

import { useState, useCallback } from "react";
import ScrambleText from "@/components/ScrambleText";
import { useMemo } from "react";
import { jpcharlist } from "@/public/data/charlists";
import { attributeText } from "@/lib/attribution";

interface ShareButtonProps {
  data: string;
  filename?: string;
  label?: string;
}

export default function ShareButton({ data, filename, label }: ShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "downloading">("idle");
  const jpchars = useMemo(() => jpcharlist, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(data);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }, [data]);

  const handleDownload = useCallback(() => {
    setStatus("downloading");
    const blob = new Blob([attributeText(data)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ?? "export.txt";
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setStatus("idle"), 500);
  }, [data, filename]);

  return (
    <div className="flex gap-3 items-center">
      <button
        onClick={handleCopy}
        className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{status === "copied" ? "copied" : label ? `${label}_copy` : "copy"}</span>
      </button>

      <button
        onClick={handleDownload}
        className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v13M8 12l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{status === "downloading" ? "..." : label ? `${label}_dl` : "download"}</span>
      </button>

      <ScrambleText
        text="エクスポート"
        chars={jpchars}
        timeOffset={100}
        autoPlay
        className="text-[9px] text-white/20"
      />
    </div>
  );
}