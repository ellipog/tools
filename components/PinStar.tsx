"use client";

import { useState, useEffect, useCallback } from "react";

const PINS_KEY = "aaenz:pins";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-3 w-3 ${filled ? "text-yellow-400" : "text-white/40"}`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PinStar({ href }: { href: string }) {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PINS_KEY);
      if (raw) setPinned(JSON.parse(raw).includes(href));
    } catch {
      // ignore corrupt data
    }
  }, [href]);

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPinned((prev) => {
        const next = !prev;
        try {
          const raw = localStorage.getItem(PINS_KEY);
          const arr = raw ? JSON.parse(raw) : [];
          const updated = next
            ? [...arr, href]
            : arr.filter((p: string) => p !== href);
          localStorage.setItem(PINS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [href],
  );

  return (
    <button
      onClick={toggle}
      className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer inline-flex items-center"
      aria-label={pinned ? `Unpin ${href}` : `Pin ${href}`}
    >
      <StarIcon filled={pinned} />
    </button>
  );
}