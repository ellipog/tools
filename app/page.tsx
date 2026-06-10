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
  icon: "globe" | "code" | "pen" | "photo" | "music" | "mail" | "bolt" | "swap";
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
    case "bolt":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pen":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 20h9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
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
    default:
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 21c4.971 0 9-4.029 9-9s-4.029-9-9-9-9 4.029-9 9 4.029 9 9 9Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M3 12h18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 3c2.8 2.6 4.5 5.9 4.5 9S14.8 18.4 12 21c-2.8-2.6-4.5-5.9-4.5-9S9.2 5.6 12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "swap":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 16 3 12l4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 8l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 12h18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
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
            icon: "pen",
          },
          {
            label: "gif-captions",
            href: "/images/gif-captions",
            description: "GIF字幕",
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
            icon: "pen",
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
            icon: "swap",
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
