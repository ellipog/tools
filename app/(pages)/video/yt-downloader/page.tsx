"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

type Quality = {
  id: string;
  label: string;
  desc: string;
};

function buildQualities(formats: any[]): Quality[] {
  const seen = new Set<string>();
  const result: Quality[] = [];

  const byHeight = [...formats]
    .filter((f) => f.vcodec && f.height)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const f of byHeight) {
    const key = `${f.height}p`;
    if (seen.has(key)) continue;
    seen.add(key);
    const isMuxed = f.acodec;
    result.push({
      id: f.id,
      label: key,
      desc: `${f.ext}${isMuxed ? "" : " + audio"} · ${formatSize(f.filesize)}`,
    });
  }

  if (!result.length) {
    const best = formats.find((f) => f.vcodec);
    if (best) {
      result.push({
        id: best.id,
        label: `${best.height || "?"}p`,
        desc: `${best.ext} · ${formatSize(best.filesize)}`,
      });
    }
  }

  result.push({
    id: "bestaudio[ext=m4a]/bestaudio",
    label: "audio only",
    desc: "m4a",
  });

  return result;
}

export default function YouTubeDownloader() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [selected, setSelected] = useState<string>("");

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    setQualities([]);
    setSelected("");
    try {
      const res = await fetch("/api/youtube-dl/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInfo(data);
      const qs = buildQualities(data.formats || []);
      setQualities(qs);
      if (qs.length > 1) setSelected(qs[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!info || !selected) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube-dl/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), format_id: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const blob = await res.blob();
      const q = qualities.find((q) => q.id === selected);
      const label = q?.label.replace(/\s+/g, "_") || "download";
      const ext = selected.startsWith("bestaudio") ? "m4a" : "mp4";
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${info.title.replace(/[<>:"/\\|?*]/g, "_")}_${label}.${ext}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="yt_downloader" jp="YTダウンローダー" category="video" href="/video/yt-downloader" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <button className="text-[10px] tracking-[0.3em] text-white/50 hover:text-white transition-colors uppercase border border-white/10 px-3 py-2 bg-white/5">
            v0.2
          </button>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. URL */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. url{" "}
                <ScrambleText
                  text={"URL"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-4 py-3 outline-none focus:border-white/40 placeholder:text-white/20 uppercase tracking-widest"
              />
            </section>

            {/* 02. FETCH */}
            <button
              onClick={handleFetch}
              disabled={!url.trim() || loading}
              className="w-full bg-white text-black uppercase text-xs tracking-[0.3em] font-bold py-4 hover:bg-white/90 transition-all disabled:opacity-30"
            >
              {loading ? "fetching…" : "fetch_info"}
            </button>

            {/* 03. QUALITY */}
            {qualities.length > 0 && (
              <section className="space-y-3">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  03. quality{" "}
                  <ScrambleText
                    text={"品質"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                {qualities.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelected(q.id)}
                    className="w-full flex items-center gap-4 group"
                  >
                    <div
                      className={`w-4 h-4 border transition-all shrink-0 ${
                        selected === q.id
                          ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] border-white"
                          : "border-white/20"
                      }`}
                    />
                    <span
                      className={`text-[10px] tracking-[0.15em] uppercase transition-colors ${
                        selected === q.id ? "text-white" : "text-white/30"
                      }`}
                    >
                      {q.label}
                    </span>
                    <span className="text-[9px] tracking-widest text-white/20 ml-auto">
                      {q.desc}
                    </span>
                  </button>
                ))}
              </section>
            )}

            {/* 04. DOWNLOAD */}
            {selected && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full bg-white text-black uppercase text-xs tracking-[0.3em] font-bold py-4 hover:bg-white/90 transition-all disabled:opacity-30"
              >
                {downloading ? "downloading…" : "download"}
              </button>
            )}
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            {error && (
              <div className="text-red-400 text-xs tracking-widest uppercase mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <ScrambleText
                  text="fetching…"
                  className="text-white/30 text-xs tracking-[0.5em] italic"
                />
              </div>
            ) : info ? (
              <div className="w-full space-y-6">
                {info.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={info.thumbnail}
                    alt={info.title}
                    className="w-full border border-white/10"
                  />
                )}
                <div className="space-y-3">
                  <div className="text-sm text-white tracking-wider leading-relaxed">
                    {info.title}
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] text-white/40 tracking-widest uppercase">
                    <span>{info.channel}</span>
                    <span>{formatDuration(info.duration)}</span>
                    <span>{formatNumber(info.viewCount)} views</span>
                    {info.likeCount != null && (
                      <span>{formatNumber(info.likeCount)} likes</span>
                    )}
                    <span>{info.uploadDate}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <ScrambleText
                  text="paste_url_and_fetch"
                  className="text-white/10 text-xs tracking-[0.5em] italic"
                />
              </div>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}