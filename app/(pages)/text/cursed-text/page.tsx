"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import ShareButton from "@/components/ShareButton";
import { jpcharlist } from "@/public/data/charlists";

// ──────────────────────────────
// ZALGO
// ──────────────────────────────
const ZALGO_CHARS = "̴̵̶̷̸̡̢̧̨̛̖̗̘̙̜̝̞̟̠̣̤̥̦̩̪̫̬̭̮̯̰̱̲̳̹̺̻̼͇͈͉͍͎̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̽̾̿̀́͂̓̈́͆͊͋͌̕̚ͅ͏͓͔͕͖͙͚͐͑͒͗͛ͣͤͥͦͧͨͩͪͫͬͭͮͯ͘͜͟͢͝͞͠͡";

function applyZalgo(text: string, intensity: number): string {
  if (!text) return text;
  return text
    .split("")
    .map((char) => {
      if (char.trim() === "" || char === "\n" || char === "\r") return char;
      const count = Math.floor(Math.random() * intensity) + 1;
      return (
        char +
        Array.from({ length: count }, () =>
          ZALGO_CHARS[Math.floor(Math.random() * ZALGO_CHARS.length)]
        ).join("")
      );
    })
    .join("");
}

// ──────────────────────────────
// REGIONAL INDICATOR
// ──────────────────────────────
function applyRegional(text: string): string {
  return text.replace(/[A-Za-z]/g, (char) =>
    String.fromCodePoint(0x1f1e6 + char.toUpperCase().charCodeAt(0) - 65)
  );
}

// ──────────────────────────────
// FULLWIDTH
// ──────────────────────────────
function applyFullwidth(text: string): string {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0x21 && code <= 0x7e) {
        return String.fromCharCode(code + 0xfee0);
      }
      return char;
    })
    .join("");
}

// ──────────────────────────────
// BUBBLE / CIRCLED
// ──────────────────────────────
function applyBubble(text: string): string {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0x41 && code <= 0x5a)
        return String.fromCharCode(0x24b6 + code - 0x41);
      if (code >= 0x61 && code <= 0x7a)
        return String.fromCharCode(0x24d0 + code - 0x61);
      if (code >= 0x30 && code <= 0x39)
        return String.fromCharCode(0x2460 + code - 0x30);
      return char;
    })
    .join("");
}

// ──────────────────────────────
// FRAKTUR
// ──────────────────────────────
const FRAKTUR_UPPER = "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ";
const FRAKTUR_LOWER = "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷";

function applyFraktur(text: string): string {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90)
        return FRAKTUR_UPPER[code - 65] || char;
      if (code >= 97 && code <= 122)
        return FRAKTUR_LOWER[code - 97] || char;
      return char;
    })
    .join("");
}

// ──────────────────────────────
// DOUBLE STRUCK
// ──────────────────────────────
const DOUBLE_UPPER = "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ";
const DOUBLE_LOWER = "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫";

function applyDouble(text: string): string {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90)
        return DOUBLE_UPPER[code - 65] || char;
      if (code >= 97 && code <= 122)
        return DOUBLE_LOWER[code - 97] || char;
      return char;
    })
    .join("");
}

// ──────────────────────────────
// SCRIPT
// ──────────────────────────────
const SCRIPT_UPPER = "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵";
const SCRIPT_LOWER = "𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏";

function applyScript(text: string): string {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90)
        return SCRIPT_UPPER[code - 65] || char;
      if (code >= 97 && code <= 122)
        return SCRIPT_LOWER[code - 97] || char;
      return char;
    })
    .join("");
}

// ──────────────────────────────
// UPSIDE DOWN
// ──────────────────────────────
const UPSIDE_DOWN_MAP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ɓ", h: "ɥ",
  i: "ı", j: "ɾ", k: "ʞ", l: "ʃ", m: "ɯ", n: "u", o: "o", p: "d",
  q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x",
  y: "ʎ", z: "z",
  A: "∀", B: "𐐒", C: "Ↄ", D: "◖", E: "Ǝ", F: "Ⅎ", G: "⅁",
  H: "H", I: "I", J: "ſ", K: "⋊", L: "⅂", M: "W", N: "N",
  O: "O", P: "Ԁ", Q: "Ό", R: "ᴚ", S: "S", T: "⊥", U: "∩",
  V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z",
  "0": "0", "1": "⇂", "2": "↊", "3": "↋", "4": "ᔭ",
  "5": "S", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  ".": "˙", ",": "'", "?": "¿", "!": "¡", '"': "„",
  "'": ",", "(": ")", ")": "(", "[": "]", "]": "[",
  "{": "}", "}": "{", "<": ">", ">": "<", "&": "⅋",
  "_": "‾", ";": "؛",
};

function applyUpsideDown(text: string): string {
  return text
    .split("")
    .map((char) => UPSIDE_DOWN_MAP[char] || char)
    .join("");
}

// ──────────────────────────────
// STRIKETHROUGH
// ──────────────────────────────
function applyStrikethrough(text: string): string {
  return text
    .split("")
    .map((char) => {
      if (char.trim() === "" || char === "\n" || char === "\r") return char;
      return char + "\u0336";
    })
    .join("");
}

// ──────────────────────────────
// SMALL CAPS
// ──────────────────────────────
const SMALL_CAPS_MAP: Record<string, string> = {
  A: "ᴀ", B: "ʙ", C: "ᴄ", D: "ᴅ", E: "ᴇ", F: "ꜰ", G: "ɢ",
  H: "ʜ", I: "ɪ", J: "ᴊ", K: "ᴋ", L: "ʟ", M: "ᴍ", N: "ɴ",
  O: "ᴏ", P: "ᴘ", Q: "Q", R: "ʀ", S: "ꜱ", T: "ᴛ", U: "ᴜ",
  V: "ᴠ", W: "ᴡ", X: "X", Y: "ʏ", Z: "ᴢ",
};

function applySmallCaps(text: string): string {
  return text
    .split("")
    .map((char) => {
      const upper = char.toUpperCase();
      return SMALL_CAPS_MAP[upper] || char;
    })
    .join("");
}

// ──────────────────────────────
// SPOILER
// ──────────────────────────────
function applySpoiler(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => `||${word}||`)
        .join(" ")
    )
    .join("\n");
}

// ──────────────────────────────
// MORSE CODE
// ──────────────────────────────
const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
  V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
};

function applyMorse(text: string): string {
  return text
    .toUpperCase()
    .split("\n")
    .map((line) =>
      line
        .split(/\s+/)
        .filter(Boolean)
        .map((word) =>
          word
            .split("")
            .map((char) => MORSE_MAP[char] || char)
            .join(" ")
        )
        .join(" / ")
    )
    .join("\n");
}

// ──────────────────────────────
// MODE DEFINITIONS
// ──────────────────────────────
type ModeDef = {
  id: string;
  label: string;
  jp: string;
  hasIntensity: boolean;
  apply: (text: string, intensity: number) => string;
};

const MODES: ModeDef[] = [
  { id: "zalgo", label: "zalgo", jp: "ザルゴ", hasIntensity: true, apply: (t, i) => applyZalgo(t, i) },
  { id: "regional", label: "regional", jp: "地域指標", hasIntensity: false, apply: (t) => applyRegional(t) },
  { id: "fullwidth", label: "fullwidth", jp: "全角", hasIntensity: false, apply: (t) => applyFullwidth(t) },
  { id: "bubble", label: "bubble", jp: "バブル", hasIntensity: false, apply: (t) => applyBubble(t) },
  { id: "fraktur", label: "fraktur", jp: "フラクトゥール", hasIntensity: false, apply: (t) => applyFraktur(t) },
  { id: "double", label: "double_struck", jp: "黒板太字", hasIntensity: false, apply: (t) => applyDouble(t) },
  { id: "script", label: "script", jp: "筆記体", hasIntensity: false, apply: (t) => applyScript(t) },
  { id: "upside-down", label: "upside_down", jp: "逆さま", hasIntensity: false, apply: (t) => applyUpsideDown(t) },
  { id: "strikethrough", label: "strikethrough", jp: "取り消し線", hasIntensity: false, apply: (t) => applyStrikethrough(t) },
  { id: "small-caps", label: "small_caps", jp: "小型大文字", hasIntensity: false, apply: (t) => applySmallCaps(t) },
  { id: "spoiler", label: "spoiler", jp: "スポイラー", hasIntensity: false, apply: (t) => applySpoiler(t) },
  { id: "morse", label: "morse", jp: "モールス", hasIntensity: false, apply: (t) => applyMorse(t) },
];

// ──────────────────────────────
// COMPONENT
// ──────────────────────────────
export default function CursedTextPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [copyLabel, setCopyLabel] = useState("copy");

  const activeModeDef = useMemo(
    () => MODES.find((m) => m.id === activeMode) ?? null,
    [activeMode]
  );

  const output = useMemo(() => {
    if (!activeModeDef || !input) return "";
    return activeModeDef.apply(input, intensity);
  }, [input, activeModeDef, intensity]);

  const stats = useMemo(() => {
    if (!input || !output) return null;
    const origBytes = new Blob([input]).size;
    const outBytes = new Blob([output]).size;
    const delta = outBytes - origBytes;
    return {
      chars: `${input.length} → ${output.length}`,
      bytes: `${origBytes.toLocaleString()} → ${outBytes.toLocaleString()} B`,
      delta: delta >= 0 ? `+${delta.toLocaleString()} B` : `${delta.toLocaleString()} B`,
    };
  }, [input, output]);

  const handleModeClick = useCallback((id: string) => {
    setActiveMode((prev) => (prev === id ? null : id));
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyLabel("copied");
    setTimeout(() => setCopyLabel("copy"), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output || !activeMode) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cursed_${activeMode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, activeMode]);

  const handleClear = useCallback(() => {
    setInput("");
    setActiveMode(null);
  }, []);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="cursed-text" jp="呪文テキスト" category="text" href="/text/cursed-text" />

      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <button className="text-[10px] tracking-[0.3em] text-white/50 hover:text-white transition-colors uppercase border border-white/10 px-3 py-2 bg-white/5">
            v0.1
          </button>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* ─── SIDEBAR ─── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. INPUT */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. input{" "}
                <ScrambleText
                  text="入力"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="type something to curse…"
                rows={6}
                className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-4 py-3 outline-none focus:border-white/40 placeholder:text-white/20 uppercase tracking-widest resize-none"
              />
              {input && (
                <div className="text-[10px] text-white/40 tracking-widest uppercase">
                  {input.length} chars
                </div>
              )}
            </section>

            {/* 02. MODE */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. mode{" "}
                <ScrambleText
                  text="モード"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeClick(mode.id)}
                    className={`text-[10px] px-2 py-1.5 border tracking-[0.1em] transition-all ${
                      activeMode === mode.id
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 03. INTENSITY (zalgo only) */}
            {activeModeDef?.hasIntensity && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  03. intensity{" "}
                  <ScrambleText
                    text="強度"
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-white/60 font-mono w-4 text-right">
                    {intensity}
                  </span>
                </div>
                <div className="text-[9px] tracking-widest uppercase text-white/30 text-center">
                  may the curse be with you
                </div>
              </motion.section>
            )}

            {/* 04. STATS */}
            {stats && activeModeDef && (
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  04. stats{" "}
                  <ScrambleText
                    text="統計"
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] tracking-widest uppercase">
                  <div className="border border-white/10 p-2">
                    <div className="text-white/30">chars</div>
                    <div className="text-white/80">{stats.chars}</div>
                  </div>
                  <div className="border border-white/10 p-2">
                    <div className="text-white/30">bytes</div>
                    <div className="text-white/80">{stats.bytes}</div>
                  </div>
                  <div className="border border-white/10 p-2 col-span-2">
                    <div className="text-white/30">delta</div>
                    <div className="text-white/80">{stats.delta}</div>
                  </div>
                </div>
              </section>
            )}

            {/* 05. ACTIONS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                05. actions{" "}
                <ScrambleText
                  text="操作"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="flex-1 border border-white/10 p-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  {copyLabel}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="flex-1 border border-white/10 p-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  download
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 border border-white/10 p-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-all"
                >
                  clear
                </button>
              </div>
              {output && activeMode && (
                <div className="flex justify-end">
                  <ShareButton data={output} filename={`cursed_${activeMode}.txt`} />
                </div>
              )}
            </section>
          </motion.aside>

          {/* ─── MAIN PANE ─── */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            {/* INPUT */}
            <div className="bg-white/[0.02] border border-white/5 min-h-[25vh]">
              <div className="text-[10px] text-white/20 uppercase tracking-[0.4em] px-4 pt-3 pb-1">
                <ScrambleText text="input" />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="type something to curse…"
                spellCheck={false}
                className="w-full h-full min-h-[20vh] bg-transparent text-white/80 font-mono text-[13px] p-4 outline-none resize-y placeholder:text-white/15 selection:bg-white selection:text-black"
              />
            </div>

            {/* OUTPUT */}
            <div className="bg-[#050505] border border-white/5 min-h-[30vh] flex flex-col relative">
              <div className="absolute top-3 left-4 text-[10px] text-white/20 uppercase tracking-[0.4em] z-10">
                <ScrambleText
                  text={`output${activeMode ? ` :: ${activeMode}` : ""}`}
                />
              </div>
              <div className="absolute top-3 right-4 z-10">
                {output && activeMode && (
                  <ShareButton data={output} filename={`cursed_${activeMode}.txt`} />
                )}
              </div>

              <AnimatePresence mode="wait">
                {output && activeModeDef ? (
                  <motion.pre
                    key={`${activeMode}-${intensity}-${input.slice(0, 20)}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-mono text-[13px] p-4 pt-10 whitespace-pre-wrap break-all overflow-x-auto custom-scrollbar flex-1 selection:bg-white selection:text-black text-[#ff8888]"
                  >
                    {output}
                  </motion.pre>
                ) : !input ? (
                  <div className="flex-1 flex items-center justify-center">
                    <ScrambleText
                      text="type_something_to_curse"
                      className="text-white/10 text-xs tracking-[0.5em] italic"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <ScrambleText
                      text="select_a_mode"
                      className="text-white/10 text-xs tracking-[0.5em] italic"
                    />
                  </div>
                )}
              </AnimatePresence>

              {stats && activeModeDef && (
                <div className="text-[10px] text-white/20 uppercase tracking-[0.4em] px-4 py-2 border-t border-white/5">
                  <ScrambleText
                    text={`${stats.chars} ⋅ ${stats.bytes}`}
                  />
                </div>
              )}
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
