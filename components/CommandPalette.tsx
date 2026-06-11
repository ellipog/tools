"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ScrambleText from "@/components/ScrambleText";
import { jpcharlist } from "@/public/data/charlists";

type ToolEntry = {
  label: string;
  href: string;
  description?: string;
  icon: "code" | "photo" | "mail" | "braces" | "search" | "hash" | "hex" | "archive" | "shuffle" | "layers" | "eraser" | "book" | "list";
  category: string;
};

function PaletteIcon({ kind }: { kind: ToolEntry["icon"] }) {
  const common = "h-3 w-3 shrink-0 opacity-60";
  switch (kind) {
    case "photo":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8.5 10.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="m21 16-5.5-5.5L6 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "code":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18 3 12l6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "braces":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 4 4 12l5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 4l5 8-5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "search":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
    case "hash":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9h12M6 15h12M10 3l-2 18M16 3l-2 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
    case "hex":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><polygon points="12 2 20 6 20 18 12 22 4 18 4 6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 10.5l1.5-1.5L13 10.5M10 13.5l1.5 1.5L13 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "archive":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M5 5v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 9v7M9 13l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "shuffle":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 4 4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 4h12v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 20H4V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "layers":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8l8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M4 12l8 4 8-4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M4 16l8 4 8-4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
    case "eraser":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 4a2.12 2.12 0 0 1 3 3L7 19l-3-3L16 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 16l2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
    case "book":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h5a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H3V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M21 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
    case "list":
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
    default:
      return <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/></svg>;
  }
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tools: ToolEntry[];
  pins: string[];
}

export default function CommandPalette({ isOpen, onClose, tools, pins }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const jpchars = useMemo(() => jpcharlist, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let matched = tools;
    if (q) {
      matched = tools.filter((t) => {
        const hay = `${t.label} ${t.description ?? ""} ${t.category}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return [...matched].sort((a, b) => {
      const aPinned = pins.includes(a.href) ? 0 : 1;
      const bPinned = pins.includes(b.href) ? 0 : 1;
      return aPinned - bPinned;
    });
  }, [tools, query, pins]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigate = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      navigate(filtered[selectedIndex].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [filtered, selectedIndex, navigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[440px] max-w-[90vw] bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tools..."
                className="w-full bg-white/5 border border-white/10 p-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
              />
              <div className="flex gap-3 mt-2 text-[9px] uppercase tracking-widest text-white/20">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-6 text-center">
                  <ScrambleText
                    text="no_matching_tools"
                    chars={jpchars}
                    className="text-white/20 text-xs tracking-[0.3em]"
                    autoPlay
                  />
                </div>
              ) : (
                <div className="py-2">
{filtered.map((tool, i) => (
                      <button
                        key={tool.href}
                        onClick={() => navigate(tool.href)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                          i === selectedIndex
                            ? "bg-white/10 text-white"
                            : "text-white/50 hover:text-white/70"
                        }`}
                      >
                        <PaletteIcon kind={tool.icon} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs uppercase tracking-wider truncate">
                            {tool.label}
                          </div>
                          {tool.description && (
                            <div className="text-[10px] text-white/30 tracking-widest truncate">
                              {tool.description}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] uppercase tracking-widest shrink-0 flex items-center gap-1.5">
                          {pins.includes(tool.href) && (
                            <svg className="h-2.5 w-2.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )}
                          {tool.category}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="absolute bottom-0 right-0 p-1 opacity-10 pointer-events-none">
              <div className="text-[8px] font-mono">v1.0.0_CMD</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}