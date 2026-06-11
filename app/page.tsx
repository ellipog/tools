"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import FeatureModal from "@/components/RequestFeature";

type ToolLink = {
  label: string;
  href: string;
  description?: string;
  icon: "code" | "photo" | "mail" | "braces" | "search" | "hash" | "hex" | "archive" | "shuffle" | "layers" | "eraser" | "book" | "list";
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

export default function Home() {
  const [query, setQuery] = useState("");
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);

  const jpchars = useMemo(() => jpcharlist, []);

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
          <div className="flex w-full justify-end gap-6  pb-4">
            <label className="flex items-center gap-2 text-md text-white/70 pr-8">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                placeholder="search…"
                className="border-b border-white/10 w-44 sm:w-56 bg-transparent text-white/80 placeholder:text-white/50 outline-none text-right"
              />
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
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          {filteredGroups.length === 0 && (
            <div className="mt-10 text-sm text-white/45 text-center">
              no matches found
            </div>
          )}
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
    </div>
  );
}
