"use client";

import { useEffect, useMemo, useRef } from "react";
// @ts-ignore
import ScrambleTextLib from "scramble-text";

export type ScrambleTextProps = {
  text: string;
  className?: string;
  chars?: string[];
  timeOffset?: number;
  autoPlay?: boolean;
  onDone?: () => void;
};

export default function ScrambleText({
  text,
  className,
  chars,
  timeOffset,
  autoPlay = true,
  onDone,
}: ScrambleTextProps) {
  const elRef = useRef<HTMLSpanElement | null>(null);
  const instanceRef = useRef<ScrambleTextLib | null>(null);
  // onDone is often an inline closure: keep it in a ref so a new callback
  // identity doesn't tear down and restart the animation every render.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const charsKey = useMemo(() => (chars ? chars.join("") : ""), [chars]);
  const charsMemo = useMemo(() => chars, [charsKey]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    el.textContent = text;

    instanceRef.current?.stop();
    instanceRef.current = new ScrambleTextLib(el, {
      timeOffset,
      chars: charsMemo,
      callback: () => onDoneRef.current?.(),
    });

    if (autoPlay) {
      instanceRef.current.start().play();
    }

    return () => {
      instanceRef.current?.stop();
      instanceRef.current = null;
    };
    // charsKey ensures we recreate when chars array content changes
  }, [text, timeOffset, autoPlay, charsKey, charsMemo]);

  return <span ref={elRef} className={className} />;
}
