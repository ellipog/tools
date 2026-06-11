"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import FeatureModal from "@/components/RequestFeature";
import CommandPalette from "@/components/CommandPalette";

const PINS_KEY = "aaenz:pins";

type ToolLink = {
  label: string;
  href: string;
  description?: string;
  icon: "code" | "photo" | "mail" | "braces" | "search" | "hash" | "hex" | "archive" | "shuffle" | "layers" | "eraser" | "book" | "list" | "clock";
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
          },
          {
            label: "ascii",
            href: "/images/ascii",
            description: "アスキー",
            icon: "code",
          },
          {
            label: "bg-remover",
            href: "/images/remove-bg",
            description: "背景削除",
            icon: "eraser",
          },
          {
            label: "gif-captions",
            href: "/images/gif-captions",
            description: "GIF字幕",
            icon: "layers",
          },
          {
            label: "resizer",
            href: "/images/resizer",
            description: "リサイザー",
            icon: "photo",
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
          },
          {
            label: "json-formatter",
            href: "/text/json-formatter",
            description: "JSON整形",
            icon: "braces",
          },
          {
            label: "regex-tester",
            href: "/text/regex-tester",
            description: "正規表現",
            icon: "search",
          },
          {
            label: "diff",
            href: "/text/diff",
            description: "差分",
            icon: "list",
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
          },
          {
            label: "compressor",
            href: "/files/compressor",
            description: "ファイル圧縮",
            icon: "archive",
          },
          {
            label: "hash",
            href: "/files/hash",
            description: "ハッシュ生成",
            icon: "hash",
          },
          {
            label: "metadata",
            href: "/files/metadata",
            description: "ファイル情報",
            icon: "list",
          },
          {
            label: "hex-viewer",
            href: "/files/hex-viewer",
            description: "16進表示",
            icon: "hex",
          },
        ] satisfies ToolLink[],
      },
    ] as const;
  }, []);

  const allTools = useMemo(() => {
    return groups.flatMap((g) =>
      g.items.map((item) => ({ ...item, category: g.title })),
    );
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => {
          const hay =
            `${it.label} ${it.description ?? ""} ${it.href}`.toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  return (
    <div className="min-h-screen">
      <Navbar title="home" jp="ホーム" category="" />
      <div className="h-screen bg-black text-white flex flex-col">
        <div className="w-full px-6 py-12">
          <div className="flex w-full justify-end gap-6 pb-4">
            <label className="flex items-center gap-2 text-md text-white/70 pr-8">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                placeholder="search…"
                className="border-b border-white/10 w-44 sm:w-56 bg-transparent text-white/80 placeholder:text-white/50 outline-none text-right"
              />
              <span className="text-[8px] tracking-[0.3em] text-white/20 uppercase shrink-0">
                {platformHint}
              </span>
            </label>
          </div>

          <div className="mt-6 pl-5 h-[calc(100vh-250px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-10 [column-fill:auto]">
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
                      <li key={item.href}>
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
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {filteredGroups.length === 0 && (
              <div className="mt-10 text-sm text-white/45 text-center">
                no matches found
              </div>
            )}
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
