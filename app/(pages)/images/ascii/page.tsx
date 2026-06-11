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
import { jpcharlist } from "@/public/data/charlists";

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

    ctx.filter = `brightness(${100 + brightness}%) contrast(${contrast * 100}%) grayscale(100%)`;
    ctx.drawImage(image, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;

    let charSet = ASCII_SETS[selectedSet];
    if (invert) charSet = charSet.split("").reverse().join("");

    let result = "";
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i],
        g = d[i + 1],
        b = d[i + 2],
        a = d[i + 3];

      if (a < 50) {
        result += "  ";
      } else {
        const brightnessVal = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const charIndex = Math.floor(
          (brightnessVal / 255) * (charSet.length - 1),
        );
        result += charSet[charIndex];
      }
      if ((i / 4 + 1) % w === 0) result += "\n";
    }
    setAscii(result);
  }, [image, targetWidth, contrast, brightness, selectedSet, invert]);

  useEffect(() => {
    generateAscii();
  }, [generateAscii]);

  useEffect(() => {
    setKaomoji(kaomojiList[Math.floor(Math.random() * kaomojiList.length)]);
  }, []);

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleFileDrop}>
      <Navbar title="ascii" jp="アスキー" category="images" />
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
                  <pre
                    className="font-mono text-[8px] sm:text-[10px] leading-[0.7] tracking-[-0.05em] text-white"
                    style={{
                      whiteSpace: "pre",
                      fontVariantLigatures: "none",
                    }}
                  >
                    {ascii}
                  </pre>
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
                  <button
                    onClick={() => navigator.clipboard.writeText(ascii)}
                    className="text-[11px] uppercase tracking-widest border-b border-white/20 text-white/50 hover:text-white transition-all pb-1"
                  >
                    copy_data
                  </button>
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
