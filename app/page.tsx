"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import FeatureModal from "@/components/RequestFeature";
import CommandPalette from "@/components/CommandPalette";
import DisplayControl from "@/components/DisplayControl";

const PINS_KEY = "aaenz:pins";

  type ToolLink = {
  label: string;
  href: string;
  description?: string;
  icon: "code" | "photo" | "mail" | "braces" | "search" | "hash" | "hex" | "archive" | "shuffle" | "layers" | "eraser" | "book" | "list" | "clock" | "wave" | "camera" | "dice" | "circle" | "coin" | "heart";
  tags?: string[];
};

function LinkIcon({ kind }: { kind: ToolLink["icon"] }) {
  const common = "h-3.5 w-3.5 shrink-0 opacity-70";
  switch (kind) {
    case "photo":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 10.5h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="m21 16-5.5-5.5L6 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "code":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 18 3 12l6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "mail":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m22 6-10 7L2 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "braces":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 4 4 12l5 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 4l5 8-5 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="10.5"
            cy="10.5"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M20 20l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "hash":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9h12M6 15h12M10 3l-2 18M16 3l-2 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "hex":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <polygon
            points="12 2 20 6 20 18 12 22 4 18 4 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 10.5l1.5-1.5L13 10.5M10 13.5l1.5 1.5L13 13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "archive":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 5h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M5 5v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 9v7M9 13l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "shuffle":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 4 4 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 4h12v12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 20H4V8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "layers":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 8l8-4 8 4-8 4-8-4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M4 12l8 4 8-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M4 16l8 4 8-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "eraser":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M16 4a2.12 2.12 0 0 1 3 3L7 19l-3-3L16 4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6 16l2 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 20h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "book":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4h5a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H3V4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M21 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6V4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "list":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 7h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 12h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 17h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "clock":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 7v5l3 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "wave":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 12a6 6 0 0 1 6 0 6 6 0 0 0 6 0 6 6 0 0 1 6 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M3 8a6 6 0 0 1 6 0 6 6 0 0 0 6 0 6 6 0 0 1 6 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      );
    case "camera":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M17 7 15 4H9L7 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );
    case "dice":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="8" cy="8" r="1" fill="currentColor" />
          <circle cx="16" cy="8" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="8" cy="16" r="1" fill="currentColor" />
          <circle cx="16" cy="16" r="1" fill="currentColor" />
        </svg>
      );
    case "circle":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "coin":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "heart":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}

function StarIcon({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={`h-3 w-3 ${filled ? "text-yellow-400" : "text-white/40"} ${className}`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={filled ? "currentColor" : "currentColor"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pins, setPins] = useState<string[]>([]);
  const [platformHint, setPlatformHint] = useState("ctrl+k");
  const inputRef = useRef<HTMLInputElement>(null);

  const jpchars = useMemo(() => jpcharlist, []);

  useEffect(() => {
    try {
      const rawPins = localStorage.getItem(PINS_KEY);
      if (rawPins) setPins(JSON.parse(rawPins));
    } catch {
      // ignore corrupt data
    }
    try {
      setPlatformHint(
        navigator.platform?.includes("Mac") ? "cmd+k" : "ctrl+k",
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (
        e.key === " " &&
        document.activeElement !== inputRef.current &&
        !paletteOpen
      ) {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (
        e.key === "/" &&
        document.activeElement !== inputRef.current &&
        !paletteOpen
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen]);

  const togglePin = useCallback((href: string) => {
    setPins((prev) => {
      const next = prev.includes(href)
        ? prev.filter((p) => p !== href)
        : [...prev, href];
      localStorage.setItem(PINS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const groups = useMemo(() => {
    return [
      {
        title: "images",
        items: [
          {
            label: "pixel-art",
            href: "/images/pixelart",
            description: "ドット絵",
            icon: "photo",
            tags: ["pixel", "art", "sprite", "canvas", "dot", "ドット", "ドット絵", "drawing", "editor", "pixelated", "grid"],
          },
          {
            label: "ascii",
            href: "/images/ascii",
            description: "アスキー",
            icon: "code",
            tags: ["ascii", "art", "text", "conversion", "character", "アスキーアート", "convert", "ansi", "font"],
          },
          {
            label: "bg-remover",
            href: "/images/remove-bg",
            description: "背景削除",
            icon: "eraser",
            tags: ["background", "remove", "transparent", "image", "processing", "removebg", "erase", "delete", "ai"],
          },
          {
            label: "sound-visualizer",
            href: "/images/sound-visualizer",
            description: "サウンドビジュアライザー",
            icon: "wave",
            tags: ["audio", "waveform", "music", "visualization", "sound", "visualizer", "audio visualizer", "bars", "frequency", "spectrum", "振幅"],
          },
          {
            label: "resizer",
            href: "/images/resizer",
            description: "リサイザー",
            icon: "photo",
            tags: ["resize", "scale", "dimensions", "size", "width", "height", "image", "crop", "thumbnail", "resize image"],
          },
          {
            label: "photo-booth",
            href: "/images/photo-booth",
            description: "フォトブース",
            icon: "camera",
            tags: ["photo", "webcam", "camera", "filters", "selfie", "effects", "vintage", "glitch", "photo booth", "snap", "capture", "mirror", "pixelate", "comic", "thermal", "xray", "neon", "emboss", "grayscale"],
          },
        ] satisfies ToolLink[],
      },
      {
        title: "video",
        items: [
          {
            label: "yt-downloader",
            href: "/video/yt-downloader",
            description: "YTダウンローダー",
            icon: "photo",
            tags: ["youtube", "download", "video", "audio", "mp4", "m4a", "yt", "downloader", "youtube downloader", "media", "save"],
          },
          {
            label: "gif-captions",
            href: "/video/gif-captions",
            description: "GIF字幕",
            icon: "layers",
            tags: ["youtube", "download", "video", "audio", "mp4", "m4a", "yt", "downloader", "youtube downloader", "media", "save"],
          },
        ] satisfies ToolLink[],
      },
      {
        title: "text",
        items: [
          {
            label: "references",
            href: "/text/references",
            description: "引用",
            icon: "book",
            tags: ["citation", "sources", "bibliography", "reference", "引用", "cite", "apa", "mla", "format", "生成"],
          },
          {
            label: "json-formatter",
            href: "/text/json-formatter",
            description: "JSON整形",
            icon: "braces",
            tags: ["json", "format", "beautify", "prettify", "validate", "pretty", "formatter", "json viewer", "tree", "editor", "minify", "parse", "JSON Editor"],
          },
          {
            label: "regex-tester",
            href: "/text/regex-tester",
            description: "正規表現",
            icon: "search",
            tags: ["regex", "regular expression", "pattern", "matching", "正規表現", "tester", "replace", "find", "regexp", "regex101"],
          },
          {
            label: "diff",
            href: "/text/diff",
            description: "差分",
            icon: "list",
            tags: ["diff", "compare", "difference", "merge", "差分", "comparison", "patch", "unified", "side by side"],
          },
          {
            label: "cursed-text",
            href: "/text/cursed-text",
            description: "呪文テキスト",
            icon: "code",
            tags: ["zalgo", "cursed", "text", "corrupt", "unicode", "glitch", "weird", "font", "fancy", "morse", "spoiler", "upside down", "cursed text", "corrupted", "discord", "discord text", "markdown", "formatting", "regional indicator", "emoji letters", "fullwidth", "bubble", "fraktur", "double struck", "script", "small caps", "strikethrough"],
          },
          {
            label: "typing-speed",
            href: "/text/typing-speed",
            description: "タイピング速度",
            icon: "clock",
            tags: ["typing", "speed", "wpm", "test", "typing test", "keyboard", "practice", "words", "typing speed", "wpm test", "accuracy"],
          },
        ] satisfies ToolLink[],
      },
      {
        title: "utils",
        items: [
          {
            label: "timezones",
            href: "/utils/timezones",
            description: "タイムゾーン",
            icon: "clock",
            tags: ["timezone", "time", "zone", "clock", "world", "utc", "time zone", "gmt", "offset", "converter", "timezone converter", "dst"],
          },
          {
            label: "qr-code",
            href: "/utils/qr-code",
            description: "QRコード",
            icon: "search",
            tags: ["qr", "qrcode", "qr code", "barcode", "scan", "generate", "code", "url", "link", "encode"],
          },
          {
            label: "unit-converter",
            href: "/utils/unit-converter",
            description: "単位変換",
            icon: "shuffle",
            tags: ["unit", "convert", "converter", "length", "weight", "temperature", "volume", "speed", "data", "time", "area", "pressure", "energy", "conversion", "metric", "imperial"],
          },
          {
            label: "age-calculator",
            href: "/utils/age-calculator",
            description: "年齢計算",
            icon: "clock",
            tags: ["age", "calculator", "birthday", "birth", "age calculator", "zodiac", "years", "days alive", "countdown"],
          },
          {
            label: "bmi-calculator",
            href: "/utils/bmi-calculator",
            description: "BMI計算",
            icon: "hash",
            tags: ["bmi", "calculator", "health", "weight", "height", "body mass index", "fitness", "healthy range"],
          },
          {
            label: "random-picker",
            href: "/utils/random-picker",
            description: "ランダム選択",
            icon: "shuffle",
            tags: ["random", "picker", "choose", "decision", "lottery", "raffle", "draw", "select", "giveaway", "randomizer", "wheel", "spin", "roulette", "decision wheel", "spinning wheel", "random picker", "pick a winner"],
          },
          {
            label: "password-generator",
            href: "/utils/password-generator",
            description: "パスワード生成",
            icon: "hash",
            tags: ["password", "generator", "random", "secure", "crypto", "pass", "パスワード", "生成", "セキュリティ", "auth"],
          },
        ] satisfies ToolLink[],
      },
      {
        title: "files",
        items: [
          {
            label: "converter",
            href: "/files/converter",
            description: "ファイル変換",
            icon: "shuffle",
            tags: ["convert", "file", "format", "transform", "conversion", "convert file", "video", "audio", "image converter", "media"],
          },
          {
            label: "compressor",
            href: "/files/compressor",
            description: "ファイル圧縮",
            icon: "archive",
            tags: ["compress", "zip", "archive", "reduce", "gzip", "compression", "圧縮", "compress file", "minify", "compress image", "pdf"],
          },
          {
            label: "hash",
            href: "/files/hash",
            description: "ハッシュ生成",
            icon: "hash",
            tags: ["hash", "checksum", "md5", "sha", "sha256", "sha1", "crypto", "hash generator", "encrypt", "hash file", "verify", "integrity"],
          },
          {
            label: "metadata",
            href: "/files/metadata",
            description: "ファイル情報",
            icon: "list",
            tags: ["metadata", "exif", "info", "information", "properties", "file info", "exif viewer", "details", "file details", "edit"],
          },
          {
            label: "hex-viewer",
            href: "/files/hex-viewer",
            description: "16進表示",
            icon: "hex",
            tags: ["hex", "hexadecimal", "bytes", "binary", "viewer", "16進", "hex editor", "dump", "hexdump", "raw", "data"],
          },
        ] satisfies ToolLink[],
      },
      {
        title: "fun",
        items: [
          {
            label: "bored-button",
            href: "/fun/bored-button",
            description: "退屈しのぎ",
            icon: "dice",
            tags: ["bored", "fun", "random", "activity", "suggestion", "idea", "bored button", "entertainment", "distraction", "creative", "challenge"],
          },
          {
            label: "magic-8ball",
            href: "/fun/magic-8ball",
            description: "マジック８ボール",
            icon: "circle",
            tags: ["8ball", "magic", "fortune", "predict", "yes no", "oracle", "ball", "decision", "fun", "game", "ask", "question", "8 ball", "magic 8 ball"],
          },
          {
            label: "matcher",
            href: "/fun/matcher",
            description: "相性診断",
            icon: "heart",
            tags: ["match", "compatibility", "love", "calculator", "romance", "friendship", "rivalry", "business", "relationship", "pair", "couple", "相性", "診断", "マッチング"],
          },
          {
            label: "coin-flip",
            href: "/fun/coin-flip",
            description: "コインフリップ",
            icon: "coin",
            tags: ["coin", "flip", "heads", "tails", "random", "luck", "decision", "coin flip", "coin toss", "flip a coin"],
          },
        ] satisfies ToolLink[],
      },
    ];
  }, []);

  const allTools = useMemo(() => {
    return groups.flatMap((g) =>
      g.items.map((item) => ({ ...item, category: g.title })),
    );
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = groups;
    if (selectedCategory) {
      base = base.filter((g) => g.title === selectedCategory);
    }
    if (!q) return base;
    return base
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => {
          const hay =
            `${it.label} ${it.description ?? ""} ${it.href} ${(it.tags ?? []).join(" ")}`.toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query, selectedCategory]);

  function ToolItem({ item }: { item: ToolLink & { category?: string } }) {
    return (
      <li className="hover:bg-white/[0.03] -mx-2 px-2 py-0.5 rounded-sm transition-colors">
        <Link
          href={item.href}
          className="group inline-flex items-baseline gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <span className="translate-y-px">
            <LinkIcon kind={item.icon} />
          </span>
          <span className="text-lg leading-none">
            {item.label}
          </span>
          {item.description ? (
            <ScrambleText
              text={item.description}
              chars={jpchars}
              timeOffset={100}
              autoPlay={true}
              className="text-sm text-white/35 group-hover:text-white/45 transition-colors"
            />
          ) : null}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePin(item.href);
            }}
            className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label={
              pins.includes(item.href)
                ? `Unpin ${item.label}`
                : `Pin ${item.label}`
            }
          >
            <StarIcon filled={pins.includes(item.href)} className="-mt-0.5" />
          </button>
        </Link>
      </li>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="home" jp="ホーム" category="" />
      <div className="h-screen bg-black text-white flex flex-col">
        <div className="w-full px-6 py-12">
          <div className="flex flex-col items-center gap-2 pb-6">
            <label className="flex items-center gap-2 text-md text-white/70">
              <svg className="h-3.5 w-3.5 shrink-0 opacity-40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                placeholder={`search ${allTools.length} tools… — ${platformHint}`}
                className="border-b border-white/10 w-64 sm:w-80 bg-transparent text-white/80 placeholder:text-white/50 outline-none text-center"
              />
            </label>
          </div>

          <div className="flex justify-center gap-2 pb-6 text-xs tracking-[0.22em] uppercase">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`transition-colors cursor-pointer ${!selectedCategory ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
            >* all</button>
            {groups.map((g) => (
              <button
                key={g.title}
                onClick={() => setSelectedCategory(selectedCategory === g.title ? null : g.title)}
                className={`transition-colors cursor-pointer flex items-center gap-2 ${selectedCategory === g.title ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                <span className="text-white/15 pointer-events-none">/</span>
                {g.title}
              </button>
            ))}
          </div>

          <div className="mt-2 pl-5 h-[calc(100vh-320px)] overflow-y-hidden overflow-x-auto custom-scrollbar">
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-10 h-full [column-fill:auto]">
              {filteredGroups.map((group) => (
                <section
                  key={group.title}
                  aria-label={group.title}
                  className="mb-10 break-inside-avoid-column"
                >
                  <div className="text-xs text-white/45 tracking-[0.22em] uppercase">
                    {group.title}
                  </div>
                  <ul className="mt-3 space-y-2.5">
                    {group.items.map((item) => (
                      <ToolItem key={item.href} item={item} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {filteredGroups.length === 0 && (
              <div className="mt-10 text-sm text-white/45 text-center">
                {query ? (
                  <>
                    <p>no matches for "<span className="text-white/60">{query}</span>"</p>
                    <button
                      onClick={() => { setQuery(""); setSelectedCategory(null); }}
                      className="mt-2 text-white/50 hover:text-white underline cursor-pointer"
                    >clear filters</button>
                  </>
                ) : (
                  <>
                    <p>no tools in this category</p>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="mt-2 text-white/50 hover:text-white underline cursor-pointer"
                    >show all</button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="fixed bottom-10 pl-5">
            <DisplayControl />
          </div>
        </div>
      </div>
      <div
        className="fixed bottom-9 right-14 text-sm gap-2 flex items-center cursor-pointer"
        onClick={() => setShowFeatureRequest(true)}
      >
        <div className="flex items-center gap-2">
          <LinkIcon kind="mail" />
          <span className="tracking-wider">REQUEST_FEATURE</span>
        </div>
        <ScrambleText
          text="機能のリクエスト"
          chars={jpchars}
          timeOffset={100}
          className="text-xs text-white/35 group-hover:text-white/45 transition-colors"
        />
      </div>
      <FeatureModal
        isOpen={showFeatureRequest}
        onClose={() => setShowFeatureRequest(false)}
      />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        tools={allTools}
        pins={pins}
      />
    </div>
  );
}
