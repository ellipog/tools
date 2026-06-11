"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings, ACCENT_PALETTE, BACKGROUND_PALETTE, PRESETS, type BorderStyle } from "./SettingsProvider";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, update, reset, applyPreset, exportJson, importJson } = useSettings();
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState(false);

  const fontOptions = [90, 100, 110, 125];

  const borderOptions: { value: BorderStyle; label: string }[] = [
    { value: "solid", label: "SOLID" },
    { value: "dashed", label: "DASH" },
    { value: "double", label: "DBL" },
    { value: "none", label: "OFF" },
  ];

  const handleImport = () => {
    if (importJson(importText)) {
      setImportText("");
      setImportError(false);
    } else {
      setImportError(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0A0A0A] border border-white/10 shadow-2xl mx-4"
          >
            <div className="h-1 w-full bg-white/20" />

            <div className="p-6 space-y-6">
              <header className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[12px] tracking-[0.3em] uppercase text-white/40 font-bold">
                  Theme_Config
                </span>
                <button
                  onClick={onClose}
                  className="text-white/20 hover:text-white transition-colors text-sm cursor-pointer"
                >
                  ✕
                </button>
              </header>

              {/* Presets */}
              <section>
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 block mb-2">
                  00. Presets
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESETS.map((preset) => {
                    const isActive =
                      settings.accentColor === preset.settings.accentColor &&
                      settings.backgroundColor === preset.settings.backgroundColor &&
                      settings.crtScanlineOpacity === preset.settings.crtScanlineOpacity &&
                      settings.fontSizeScale === preset.settings.fontSizeScale &&
                      settings.borderStyle === preset.settings.borderStyle;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset.settings)}
                        className={`px-3 py-1 text-[10px] tracking-[0.2em] uppercase cursor-pointer transition-all ${
                          isActive
                            ? "bg-white text-black"
                            : "bg-transparent text-white/40 border border-white/20 hover:border-white/50"
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Accent Color */}
              <section>
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 block mb-2">
                  01. Accent
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ACCENT_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => update({ accentColor: color })}
                      className={`w-6 h-6 border cursor-pointer transition-all ${
                        settings.accentColor === color
                          ? "border-white scale-110"
                          : "border-white/20 hover:border-white/50"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </section>

              {/* Background Color */}
              <section>
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 block mb-2">
                  02. Background
                </label>
                <div className="flex gap-2 flex-wrap">
                  {BACKGROUND_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => update({ backgroundColor: color })}
                      className={`w-6 h-6 border cursor-pointer transition-all ${
                        settings.backgroundColor === color
                          ? "border-white scale-110"
                          : "border-white/20 hover:border-white/50"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </section>

              {/* Scanline Opacity */}
              <section>
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 block mb-2">
                  03. Scanline Opacity — {settings.crtScanlineOpacity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.crtScanlineOpacity}
                  onChange={(e) => update({ crtScanlineOpacity: Number(e.target.value) })}
                  className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer"
                />
              </section>

              {/* Font Size */}
              <section>
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 block mb-2">
                  04. Font Size — {settings.fontSizeScale}%
                </label>
                <div className="flex gap-2">
                  {fontOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => update({ fontSizeScale: size as 90 | 100 | 110 | 125 })}
                      className={`px-3 py-1 text-[10px] tracking-[0.2em] uppercase cursor-pointer transition-all ${
                        settings.fontSizeScale === size
                          ? "bg-white text-black"
                          : "bg-transparent text-white/40 border border-white/20 hover:border-white/50"
                      }`}
                    >
                      {size}%
                    </button>
                  ))}
                </div>
              </section>

              {/* Border Style */}
              <section>
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 block mb-2">
                  05. Border Style
                </label>
                <div className="flex gap-2">
                  {borderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update({ borderStyle: opt.value })}
                      className={`px-3 py-1 text-[10px] tracking-[0.2em] uppercase cursor-pointer transition-all ${
                        settings.borderStyle === opt.value
                          ? "bg-white text-black"
                          : "bg-transparent text-white/40 border border-white/20 hover:border-white/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Actions */}
              <section className="border-t border-white/5 pt-4 space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-1 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase bg-white/10 text-white/60 hover:bg-white/20 cursor-pointer transition-all"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(exportJson()); }}
                    className="flex-1 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase bg-white/10 text-white/60 hover:bg-white/20 cursor-pointer transition-all"
                  >
                    Export
                  </button>
                </div>

                <div className="flex gap-2 items-end">
                  <input
                    value={importText}
                    onChange={(e) => { setImportText(e.target.value); setImportError(false); }}
                    placeholder="Paste JSON..."
                    className={`flex-1 bg-white/5 border p-1.5 text-[10px] text-white/70 outline-none transition-all ${
                      importError ? "border-red-500/50" : "border-white/10 focus:border-white/40"
                    }`}
                  />
                  <button
                    onClick={handleImport}
                    disabled={!importText}
                    className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-20 cursor-pointer transition-all"
                  >
                    Import
                  </button>
                </div>
              </section>
            </div>

            <div className="absolute bottom-0 right-0 p-1 opacity-10 pointer-events-none">
              <div className="text-[8px] font-mono">v1.0.0_TC</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}