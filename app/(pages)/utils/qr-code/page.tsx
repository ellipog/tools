"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import CustomColorPicker from "@/components/ColorPicker";

const DOT_STYLES = [
  { key: "square", label: "square" },
  { key: "dots", label: "dots" },
  { key: "rounded", label: "rounded" },
  { key: "extra-rounded", label: "extra-rounded" },
  { key: "classy", label: "classy" },
  { key: "classy-rounded", label: "classy-rounded" },
] as const;

const ECC_LEVELS = [
  { key: "L", label: "L", desc: "7%" },
  { key: "M", label: "M", desc: "15%" },
  { key: "Q", label: "Q", desc: "25%" },
  { key: "H", label: "H", desc: "30%" },
] as const;

const SIZE_PRESETS = [128, 256, 384, 512, 1024];

function dataUrlToFile(dataUrl: string, filename: string): File | null {
  const arr = dataUrl.split(",");
  if (arr.length < 2) return null;
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type: mime });
}

export default function QRCodeGenerator() {
  const jpchars = useMemo(() => jpcharlist, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState("");
  const [ecc, setEcc] = useState<string>("M");
  const [size, setSize] = useState(512);
  const [sizeInput, setSizeInput] = useState("512");
  const [dotStyle, setDotStyle] = useState<string>("square");
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#000000");
  const [logoFile, setLogoFile] = useState<string>("");
  const [logoSize, setLogoSize] = useState(0.3);
  const [logoMargin, setLogoMargin] = useState(4);
  const [cornerStyle, setCornerStyle] = useState<string>("square");
  const [history, setHistory] = useLocalStorage<string[]>("runen:qr-history", []);
  const [moduleCount, setModuleCount] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!containerRef.current) return;
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (cancelled) return;
      const options: any = {
        width: size,
        height: size,
        data: data || " ",
        margin: 0,
        qrOptions: { errorCorrectionLevel: ecc },
        dotsOptions: { type: dotStyle, color: fgColor },
        backgroundOptions: { color: bgColor },
        cornersSquareOptions: { type: cornerStyle, color: fgColor },
        cornersDotOptions: { type: cornerStyle, color: fgColor },
        imageOptions: {
          imageSize: logoSize,
          margin: logoMargin,
          hideBackgroundDots: true,
        },
      };
      if (logoFile) options.image = logoFile;

      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling(options);
        qrRef.current.append(containerRef.current);
      } else {
        qrRef.current.update(options);
      }

      try {
        const raw = qrRef.current._qr;
        if (raw) setModuleCount(raw.getModuleCount());
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [data, ecc, size, dotStyle, fgColor, bgColor, logoFile, logoSize, logoMargin, cornerStyle]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoFile(ev.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const clearLogo = () => {
    setLogoFile("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async (ext: string) => {
    if (!qrRef.current || !data.trim()) return;
    setDownloading(true);
    try {
      await qrRef.current.download({ name: `qr_${data.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}`, extension: ext });
      if (!history.includes(data.trim())) {
        setHistory([data.trim(), ...history.slice(0, 9)]);
      }
    } catch (err) {
      console.error("download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const loadFromHistory = (entry: string) => {
    setData(entry);
  };

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="qr_code" jp="QRコード" category="utils" href="/utils/qr-code" />
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
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. CONTENT */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. content{" "}
                <ScrambleText text={"コンテンツ"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="text or URL to encode…"
                rows={4}
                className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-4 py-3 outline-none focus:border-white/40 placeholder:text-white/20 uppercase tracking-widest resize-none"
              />
              {data && (
                <div className="text-[10px] text-white/40 tracking-widest uppercase">
                  {data.length} chars {moduleCount > 0 && `· ${moduleCount}×${moduleCount} modules`}
                </div>
              )}
            </section>

            {/* 02. ERROR CORRECTION */}
            <section className="space-y-3">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. error_correction{" "}
                <ScrambleText text={"誤り訂正"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ECC_LEVELS.map((lvl) => (
                  <button
                    key={lvl.key}
                    onClick={() => setEcc(lvl.key)}
                    className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                      ecc === lvl.key
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {lvl.label} ({lvl.desc})
                  </button>
                ))}
              </div>
            </section>

            {/* 03. SIZE */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. size{" "}
                <ScrambleText text={"サイズ"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_PRESETS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSize(s); setSizeInput(String(s)); }}
                    className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                      size === s
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={sizeInput}
                onChange={(e) => {
                  setSizeInput(e.target.value);
                  const v = parseInt(e.target.value);
                  if (v >= 64 && v <= 2048) setSize(v);
                }}
                className="w-full bg-transparent border-b border-white/10 text-xs text-white/70 px-1 py-1 outline-none focus:border-white/40"
              />
            </section>

            {/* 04. DOT STYLE */}
            <section className="space-y-3">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                04. dot_style{" "}
                <ScrambleText text={"ドットスタイル"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DOT_STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setDotStyle(s.key)}
                    className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                      dotStyle === s.key
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 05. CORNER STYLE */}
            <section className="space-y-3">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                05. corner_style{" "}
                <ScrambleText text={"コーナースタイル"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["square", "dot", "extra-rounded"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCornerStyle(s)}
                    className={`text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all ${
                      cornerStyle === s
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            {/* 06. COLORS */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                06. colors{" "}
                <ScrambleText text={"カラー"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 shrink-0">
                    <CustomColorPicker color={fgColor} onChange={setFgColor} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] tracking-widest uppercase text-white/40">foreground</div>
                    <div className="text-[11px] font-mono text-white/60">{fgColor}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 shrink-0">
                    <CustomColorPicker color={bgColor} onChange={setBgColor} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] tracking-widest uppercase text-white/40">background</div>
                    <div className="text-[11px] font-mono text-white/60">{bgColor}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 07. LOGO */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                08. logo{" "}
                <ScrambleText text={"ロゴ"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                <span className="text-[10px] text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">
                  {logoFile ? "change_logo" : "upload_logo"}
                </span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              {logoFile && (
                <div className="space-y-3">
                  <button onClick={clearLogo} className="text-[9px] tracking-widest uppercase text-red-400 hover:text-red-300 transition-colors">
                    remove_logo
                  </button>
                  <div>
                    <div className="text-[9px] tracking-widest uppercase text-white/40 mb-1">logo_size</div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.6}
                      step={0.05}
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] tracking-widest uppercase text-white/40 mb-1">logo_margin</div>
                    <input
                      type="range"
                      min={0}
                      max={16}
                      value={logoMargin}
                      onChange={(e) => setLogoMargin(Number(e.target.value))}
                      className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 09. DOWNLOAD */}
            {data.trim() && (
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  09. download{" "}
                  <ScrambleText text={"ダウンロード"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["png", "svg", "jpeg", "webp"].map((ext) => (
                    <button
                      key={ext}
                      onClick={() => handleDownload(ext)}
                      disabled={downloading}
                      className="text-[10px] px-4 py-2 border tracking-[0.2em] uppercase transition-all border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5 disabled:opacity-20"
                    >
                      .{ext}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 10. HISTORY */}
            {history.length > 0 && (
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  10. history{" "}
                  <ScrambleText text={"履歴"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {history.map((entry, i) => (
                    <button
                      key={`${entry}-${i}`}
                      onClick={() => loadFromHistory(entry)}
                      className="block w-full text-left text-[9px] tracking-widest text-white/30 hover:text-white/70 transition-colors py-1 truncate border-b border-white/5 last:border-0"
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col items-center justify-center bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {data.trim() ? (
              <div className="flex flex-col items-center gap-6">
                <div
                  ref={containerRef}
                  style={{ maxWidth: "100%", overflow: "hidden" }}
                />
              </div>
            ) : (
              <ScrambleText
                text="enter_content_to_generate"
                className="text-white/10 text-xs tracking-[0.5em] italic"
              />
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}