"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "aaenz:settings";

export type BorderStyle = "solid" | "dashed" | "double" | "none";

export interface ThemeSettings {
  accentColor: string;
  backgroundColor: string;
  crtScanlineOpacity: number;
  fontSizeScale: number;
  borderStyle: BorderStyle;
  theme: "dark" | "light";
}

export const ACCENT_PALETTE = [
  "#FFFFFF",
  "#000000",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#F0A500",
  "#A8E6CF",
  "#FF8C94",
] as const;

export const BACKGROUND_PALETTE = [
  "#000000",
  "#050505",
  "#0A0A0A",
  "#111111",
  "#1a1a1a",
  "#FFFFFF",
  "#F5F5F5",
  "#1a1a2e",
  "#1e1e2f",
  "#2d1b1b",
] as const;

export const DEFAULT_SETTINGS: ThemeSettings = {
  accentColor: "#FFFFFF",
  backgroundColor: "#000000",
  crtScanlineOpacity: 6,
  fontSizeScale: 100,
  borderStyle: "solid",
  theme: "dark",
};

interface Preset {
  name: string;
  settings: ThemeSettings;
}

export const PRESETS: Preset[] = [
  {
    name: "Default",
    settings: DEFAULT_SETTINGS,
  },
  {
    name: "Light",
    settings: { ...DEFAULT_SETTINGS, backgroundColor: "#FFFFFF", accentColor: "#000000", theme: "light" },
  },
  {
    name: "Crimson",
    settings: { ...DEFAULT_SETTINGS, accentColor: "#FF6B6B", crtScanlineOpacity: 12 },
  },
  {
    name: "Teal",
    settings: { ...DEFAULT_SETTINGS, accentColor: "#4ECDC4", backgroundColor: "#0A0A0A", crtScanlineOpacity: 4 },
  },
  {
    name: "Ocean",
    settings: { ...DEFAULT_SETTINGS, accentColor: "#45B7D1", backgroundColor: "#050505" },
  },
  ];

const FONT_PERCENT: Record<number, string> = {
  90: "90%",
  100: "100%",
  110: "110%",
  125: "125%",
};

function applySettings(settings: ThemeSettings) {
  const root = document.documentElement;
  const isLight = settings.theme === "light";

  root.classList.toggle("light", isLight);
  localStorage.setItem("aaenz:theme", isLight ? "light" : "dark");

  if (settings.theme === "dark") {
    root.style.setProperty("--color-white", settings.accentColor);
    root.style.setProperty("--color-black", settings.backgroundColor);
  } else {
    root.style.removeProperty("--color-white");
    root.style.removeProperty("--color-black");
  }

  root.style.setProperty(
    "--crt-scanline-opacity",
    String(settings.crtScanlineOpacity / 100),
  );

  root.style.fontSize = FONT_PERCENT[settings.fontSizeScale] || "100%";

  root.style.setProperty("--tw-border-style", settings.borderStyle);
  root.style.setProperty("--border-style", settings.borderStyle);
}

interface SettingsContextValue {
  settings: ThemeSettings;
  update: (partial: Partial<ThemeSettings>) => void;
  reset: () => void;
  applyPreset: (preset: ThemeSettings) => void;
  exportJson: () => string;
  importJson: (json: string) => boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  reset: () => {},
  applyPreset: () => {},
  exportJson: () => "{}",
  importJson: () => false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ThemeSettings>;
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        applySettings(merged);
        return;
      }
    } catch {
      // corrupt data — use defaults
    }
    applySettings(DEFAULT_SETTINGS);
  }, []);

  const update = useCallback((partial: Partial<ThemeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applySettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    applySettings(DEFAULT_SETTINGS);
  }, []);

  const applyPreset = useCallback((preset: ThemeSettings) => {
    setSettings(preset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
    applySettings(preset);
  }, []);

  const exportJson = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importJson = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as Partial<ThemeSettings>;
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      setSettings(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      applySettings(merged);
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, reset, applyPreset, exportJson, importJson }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);