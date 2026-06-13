"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import ShareButton from "@/components/ShareButton";
import { jpcharlist } from "@/public/data/charlists";
import { attributePng } from "@/lib/attribution";

const ASCII_SETS = {
  standard:
    "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  japanese: "鬱驫驚義微編継後春海草点化及千万入力トニコノハ。 ",
  math: "∬∭∮∯∰±∞∑∏√∛∜∝∟∠∡∢∣∦∧∨∩∪∫∬∭∮∯∰∱∲∳∴∵∶∷∸∹∺∻∼∽∾∿≀≁≂≃≄≅≆≇≈≉≊≋≌≍≎≏≐≑≒≓≔≕≖≗≘≙≚≛≜≝≞≟≠≡≢≣≤≥≦≧≨≩≪≫≬≭≮≯≰≱≲≳≴≵≶≷≸≹≺≻≼≽≾≿⊀⊁⊂⊃⊄⊅⊆⊇⊈⊉⊊⊋⊌⊍⊎⊏⊐⊑⊒⊓⊔⊕⊖⊗⊘⊙⊚⊛⊜⊝⊞⊟⊠⊡⊢⊣⊤⊥⊦⊧⊨⊩⊪⊫⊬⊭⊮⊯⊰⊱⊲⊳⊴⊵⊶⊷⊸⊹⊺⊻⊼⊽⊾⊿⋀⋁⋂⋃⋄⋅⋆⋇⋈⋉⋊⋋⋌⋍⋎⋏⋐⋑⋒⋓⋔⋕⋖⋗⋘⋙⋚⋛⋜⋝⋞⋟⋠⋡⋢⋣⋤⋥⋦⋧⋨⋩⋪⋫⋬⋭ ",
  minimal: "█▓▒░ ",
  binary: "10 ",
};

export default function AsciiArtGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [ascii, setAscii] = useState<string>("");

  const [targetWidth, setTargetWidth] = useState<number>(120);
  const [widthInput, setWidthInput] = useState<string>("120");
  const [contrast, setContrast] = useState<number>(1.2);
  const [brightness, setBrightness] = useState<number>(0);
  const [selectedSet, setSelectedSet] =
    useState<keyof typeof ASCII_SETS>("standard");
  const [invert, setInvert] = useState<boolean>(false);
  const [kaomoji, setKaomoji] = useState("");
  const [isColored, setIsColored] = useState(false);
  const colorPreviewRef = useRef<HTMLCanvasElement>(null);
  const asciiGridRef = useRef<
    { char: string; r: number; g: number; b: number; a: number }[][]
  >([]);

  const kaomojiList = [
    "⊂(￣▽￣)⊃",
    "d(^▽^ )b",
    "(つ✧ω✧)つ",
    "ミ(ノ￣^￣)ノ",
    "ヽ(ˇ∀ˇ)人(ˇ∀ˇ)ノ",
    "o(>< )o",
    "(づ￣ ³￣)づ",
    "<(￣︶￣)>",
    "(っ˘ڡ˘ς)",
    "v( ‘∀’ )v",
    "(；⌣̀_⌣́)",
    "(੭ˊᵕˋ)੭",
    "ᕦ(ò_óˇ)ᕤ",
    "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
    "o(≧▽≦)o",
    "(っ´ω`c)",
    "~(˘▽˘~)",
    "(〃￣ω￣〃ゞ",
    "(づ◡﹏◡)づ",
    "σ(￣▽￣)?",
  ];

  const jpchars = useMemo(() => jpcharlist, []);

  useEffect(() => {
    if (image) {
      const initialWidth = Math.min(150, image.width);
      setTargetWidth(initialWidth);
      setWidthInput(initialWidth.toString());
    }
  }, [image]);

  const handleWidthChange = (val: string) => {
    setWidthInput(val);
    const numericVal = parseInt(val, 10);
    if (!isNaN(numericVal) && numericVal > 0) {
      setTargetWidth(Math.min(numericVal, 1000));
    }
  };

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleFileDrop = useCallback((file: File) => {
    processFile(file);
  }, [processFile]);

  const generateAscii = useCallback(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const verticalComp = selectedSet === "japanese" ? 0.28 : 0.55;
    const w = targetWidth;
    const h = Math.max(
      1,
      Math.floor(image.height * (w / image.width) * verticalComp),
    );

    canvas.width = w;
    canvas.height = h;

    ctx.filter = `brightness(${100 + brightness}%) contrast(${contrast * 100}%)`;
    ctx.drawImage(image, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;

    let charSet = ASCII_SETS[selectedSet];
    if (invert) charSet = charSet.split("").reverse().join("");

    let result = "";
    const grid: {
      char: string;
      r: number;
      g: number;
      b: number;
      a: number;
    }[][] = [];

    for (let y = 0; y < h; y++) {
      const row: {
        char: string;
        r: number;
        g: number;
        b: number;
        a: number;
      }[] = [];
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = d[i],
          g = d[i + 1],
          b = d[i + 2],
          a = d[i + 3];

        if (a < 50) {
          row.push({ char: " ", r, g, b, a });
          result += "  ";
        } else {
          const brightnessVal = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const charIndex = Math.floor(
            (brightnessVal / 255) * (charSet.length - 1),
          );
          const char = charSet[charIndex];
          row.push({ char, r, g, b, a });
          result += char;
        }
      }
      result += "\n";
      grid.push(row);
    }
    setAscii(result);
    asciiGridRef.current = grid;
  }, [image, targetWidth, contrast, brightness, selectedSet, invert]);

  const renderColoredPreview = useCallback(() => {
    const grid = asciiGridRef.current;
    if (!colorPreviewRef.current || grid.length === 0) return;

    const canvas = colorPreviewRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const h = grid.length;
    const w = grid[0].length;

    const fontSize = 10;
    const fontName = '"Nosutaru-dotMPlusH-10-Regular", monospace';
    ctx.font = `${fontSize}px ${fontName}`;
    ctx.textBaseline = "top";
    const charWidth = ctx.measureText("@").width;
    const lineHeight = fontSize * 0.7;

    canvas.width = Math.ceil(w * charWidth);
    canvas.height = Math.ceil(h * lineHeight);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = grid[y][x];
        if (cell.char !== " " && cell.a >= 50) {
          ctx.fillStyle = `rgb(${cell.r},${cell.g},${cell.b})`;
          ctx.fillText(cell.char, x * charWidth, y * lineHeight);
        }
      }
    }
  }, []);

  const downloadPng = useCallback(
    (withBackground: boolean) => {
      const grid = asciiGridRef.current;
      if (!image || grid.length === 0) return;

      const h = grid.length;
      const w = grid[0].length;

      const scale = 2;
      const fontSize = 10 * scale;
      const fontName = '"Nosutaru-dotMPlusH-10-Regular", monospace';
      const exportCanvas = document.createElement("canvas");
      const exportCtx = exportCanvas.getContext("2d");
      if (!exportCtx) return;

      exportCtx.font = `${fontSize}px ${fontName}`;
      exportCtx.textBaseline = "top";
      const charWidth = exportCtx.measureText("@").width;
      const lineHeight = fontSize * 0.7;

      exportCanvas.width = Math.ceil(w * charWidth);
      exportCanvas.height = Math.ceil(h * lineHeight);

      if (withBackground) {
        exportCtx.fillStyle = "#000000";
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const cell = grid[y][x];
          if (cell.char !== " " && cell.a >= 50) {
            exportCtx.fillStyle = isColored
              ? `rgb(${cell.r},${cell.g},${cell.b})`
              : "#FFFFFF";
            exportCtx.fillText(cell.char, x * charWidth, y * lineHeight);
          }
        }
      }

      exportCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const attributed = await attributePng(blob);
        const url = URL.createObjectURL(attributed);
        const a = document.createElement("a");
        a.href = url;
        a.download = withBackground
          ? "ascii-art.png"
          : "ascii-art-transparent.png";
        a.click();
        URL.revokeObjectURL(url);
      });
    },
    [image, isColored],
  );

  useEffect(() => {
    generateAscii();
  }, [generateAscii]);

  useEffect(() => {
    if (isColored) {
      renderColoredPreview();
    }
  }, [ascii, isColored, renderColoredPreview]);

  useEffect(() => {
    setKaomoji(kaomojiList[Math.floor(Math.random() * kaomojiList.length)]);
  }, []);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleFileDrop}>
      <Navbar title="ascii" jp="アスキー" category="images" href="/images/ascii" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <button className="text-[10px] tracking-[0.3em] text-white/50 hover:text-white transition-colors uppercase border border-white/10 px-3 py-2 bg-white/5">
            {kaomoji}
          </button>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* SIDEBAR */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-10"
          >
            {/* 01. SOURCE */}
            <section>
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. source{" "}
                <ScrambleText
                  text={"源泉"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                <span className="text-xs text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">
                  upload_image
                </span>
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </section>

            {/* 02. CONFIG */}
            <section className="space-y-6">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-6">
                02. config{" "}
                <ScrambleText
                  text={"設定"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[12px] text-white/40 uppercase tracking-widest font-mono">
                    <span>Width</span>
                    <div className="flex items-center">
                      <span>{targetWidth} px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="1000"
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer hover:bg-white/20 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[12px] text-white/40 uppercase tracking-widest font-mono">
                    <span>Contrast</span>
                    <span>{Math.round(contrast * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={contrast}
                    onChange={(e) => setContrast(parseFloat(e.target.value))}
                    className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer hover:bg-white/20 transition-all"
                  />
                </div>

                <button
                  onClick={() => setInvert(!invert)}
                  className="flex items-center gap-4 group"
                >
                  <div
                    className={`w-4 h-4 border border-white/20 transition-all ${invert ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-transparent"}`}
                  />
                  <span
                    className={`text-[10px] tracking-widest uppercase transition-colors ${invert ? "text-white" : "text-white/30"}`}
                  >
                    invert_engine
                  </span>
                </button>

                <button
                  onClick={() => setIsColored(!isColored)}
                  className="flex items-center gap-4 group"
                >
                  <div
                    className={`w-4 h-4 border border-white/20 transition-all ${isColored ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-transparent"}`}
                  />
                  <span
                    className={`text-[10px] tracking-widest uppercase transition-colors ${isColored ? "text-white" : "text-white/30"}`}
                  >
                    colored_mode
                  </span>
                </button>
              </div>
            </section>

            {/* 03. CHARSET */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. charset{" "}
                <ScrambleText
                  text={"文字"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.keys(ASCII_SETS).map((set) => (
                  <button
                    key={set}
                    onClick={() =>
                      setSelectedSet(set as keyof typeof ASCII_SETS)
                    }
                    className={`text-[10px] py-3 px-4 border tracking-[0.2em] uppercase transition-all text-center ${
                      selectedSet === set
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {set}
                  </button>
                ))}
              </div>
            </section>
          </motion.aside>

          {/* MAIN PREVIEW */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-10 flex flex-col bg-white/5 border border-white/10 min-h-[70vh] relative overflow-hidden"
          >
            <canvas ref={canvasRef} className="hidden" />

            {image ? (
              <>
                <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-black">
                  {isColored ? (
                    <canvas
                      ref={colorPreviewRef}
                      className="block w-fit h-fit"
                    />
                  ) : (
                    <pre
                      className="font-mono text-[8px] sm:text-[10px] leading-[0.7] tracking-[-0.05em] text-white"
                      style={{
                        whiteSpace: "pre",
                        fontVariantLigatures: "none",
                      }}
                    >
                      {ascii}
                    </pre>
                  )}
                </div>
                  <div className="border-t border-white/10 p-6 flex justify-between items-center bg-zinc-950">
                  <div className="flex gap-8 items-center">
                    <span className="text-[11px] text-white/40 font-mono uppercase tracking-widest">
                      DIM: {targetWidth}W
                    </span>
                    <span className="text-[11px] text-white/40 font-mono uppercase tracking-widest">
                      CHARS: {ascii.length.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => downloadPng(true)}
                      className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                        <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M21 15l-4-4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 16l4-4 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>png_bg</span>
                    </button>
                    <button
                      onClick={() => downloadPng(false)}
                      className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                        <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M21 15l-4-4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 16l4-4 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>png_transparent</span>
                    </button>
                    <ShareButton data={ascii} filename="ascii-art.txt" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <ScrambleText
                  text="system_idle_waiting_for_source"
                  className="text-white/10 text-xs tracking-[0.5em] uppercase font-mono"
                />
              </div>
            )}
          </motion.main>
        </div>
      </div>
      </FileDropZone>
    </div>
  );
}
