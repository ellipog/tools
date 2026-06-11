"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import { generateAPA, ReferenceData, ReferenceMode } from "@/lib/apa-engine";
import { getUrlMetadata } from "@/app/actions/scrape";

type FetchStatus = "idle" | "fetching" | "success" | "error";

export default function APAGenerator() {
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [urlInput, setUrlInput] = useState("");
  const [copyLabel, setCopyLabel] = useState("copy_text");

  const [data, setData] = useState<ReferenceData>({
    authors: "",
    year: "",
    title: "",
    source: "",
    url: "",
    mode: "website",
  });

  const jpchars = useMemo(() => jpcharlist, []);
  const formatted = useMemo(() => generateAPA(data), [data]);

  const modes: { id: ReferenceMode; jp: string }[] = [
    { id: "website", jp: "ウェブ" },
    { id: "book", jp: "書籍" },
    { id: "journal", jp: "論文" },
    { id: "report", jp: "レポート" },
  ];

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAutoFetch = async () => {
    setErrorMessage(null); // Reset

    let validUrl;
    try {
      validUrl = new URL(urlInput);
    } catch (err) {
      setFetchStatus("error");
      setErrorMessage("Invalid URL format. Include http:// or https://");
      return;
    }

    setFetchStatus("fetching");

    const result = await getUrlMetadata(validUrl.href);

    if (result.success && result.data) {
      const safeData = {
        title: result.data.title || "",
        authors: result.data.authors || "",
        source: result.data.source || "",
        year: result.data.year || "",
        url: result.data.url,
      };

      setData((prevData) => ({
        ...prevData,
        ...safeData,
      }));

      setFetchStatus("success");
    } else {
      setFetchStatus("error");
      setErrorMessage(result.error || "Failed to extract metadata.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatted);
    setCopyLabel("copied_to_clipboard");
    setTimeout(() => setCopyLabel("copy_text"), 2000);
  };

  // Helper for typed input changes
  const updateData = (key: keyof ReferenceData, val: string) => {
    setData((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="references" jp="引用" category="text" href="/text/references" />

      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        {/* HEADER STATUS */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                fetchStatus === "fetching"
                  ? "bg-yellow-500 animate-pulse"
                  : fetchStatus === "success"
                    ? "bg-green-500"
                    : fetchStatus === "error"
                      ? "bg-red-500"
                      : "bg-white/20"
              }`}
            />
            {fetchStatus}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* SIDEBAR */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-12"
          >
            {/* 01. MODE SELECTOR */}
            <section className="space-y-6">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. mode{" "}
                <ScrambleText
                  text="種別"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updateData("mode", m.id)}
                    className={`border p-3 text-[10px] uppercase tracking-widest transition-all ${
                      data.mode === m.id
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {m.id}
                  </button>
                ))}
              </div>
            </section>

            {/* 02. INGESTION */}
            <section className="space-y-6">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. source{" "}
                <ScrambleText
                  text="源泉"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="Paste URL..."
                  value={urlInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUrlInput(e.target.value)
                  }
                />
                <button
                  onClick={handleAutoFetch}
                  className="bg-white text-black px-6 text-xs font-bold uppercase hover:bg-zinc-200 transition-colors"
                >
                  Fetch
                </button>
              </div>
              <AnimatePresence>
                {errorMessage && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[10px] text-red-400 tracking-tighter uppercase"
                  >
                    ! Error: {errorMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </section>

            {/* 03. MANUAL INPUTS */}
            <section className="space-y-8">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-6">
                03. manual{" "}
                <ScrambleText
                  text="手動入力"
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* AUTHORS */}
                <div className="flex flex-col gap-3">
                  <label className="text-[12px] uppercase text-white/40 tracking-widest">
                    Authors
                  </label>
                  <input
                    value={data.authors}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateData("authors", e.target.value)
                    }
                    className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all text-base"
                  />
                </div>
                {/* YEAR */}
                <div className="flex flex-col gap-3">
                  <label className="text-[12px] uppercase text-white/40 tracking-widest">
                    Year
                  </label>
                  <input
                    value={data.year}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateData("year", e.target.value)
                    }
                    className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all text-base"
                  />
                </div>
              </div>

              {/* TITLE */}
              <div className="flex flex-col gap-3">
                <label className="text-[12px] uppercase text-white/40 tracking-widest">
                  Title
                </label>
                <input
                  value={data.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData("title", e.target.value)
                  }
                  className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all text-base"
                />
              </div>

              {/* SOURCE / PUBLISHER */}
              <div className="flex flex-col gap-3">
                <label className="text-[12px] uppercase text-white/40 tracking-widest">
                  {data.mode === "book" ? "Publisher" : "Source / Site Name"}
                </label>
                <input
                  value={data.source}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData("source", e.target.value)
                  }
                  className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all text-base"
                />
              </div>

              {/* URL / DOI */}
              <div className="flex flex-col gap-3">
                <label className="text-[12px] uppercase text-white/40 tracking-widest">
                  Full URL / DOI
                </label>
                <input
                  value={data.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData("url", e.target.value)
                  }
                  className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                {/* Dynamic Field 1 */}
                {data.mode === "journal" && (
                  <>
                    <div className="flex flex-col gap-3">
                      <label className="text-[12px] uppercase text-white/40 tracking-widest">
                        Volume
                      </label>
                      <input
                        value={data.volume || ""}
                        onChange={(e) => updateData("volume", e.target.value)}
                        className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[12px] uppercase text-white/40 tracking-widest">
                        Issue
                      </label>
                      <input
                        value={data.issue || ""}
                        onChange={(e) => updateData("issue", e.target.value)}
                        className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                  </>
                )}

                {data.mode === "book" && (
                  <div className="flex flex-col gap-3">
                    <label className="text-[12px] uppercase text-white/40 tracking-widest">
                      Edition
                    </label>
                    <input
                      value={data.edition || ""}
                      onChange={(e) => updateData("edition", e.target.value)}
                      className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                )}

                {data.mode === "report" && (
                  <div className="flex flex-col gap-3">
                    <label className="text-[12px] uppercase text-white/40 tracking-widest">
                      Report #
                    </label>
                    <input
                      value={data.reportNum || ""}
                      onChange={(e) => updateData("reportNum", e.target.value)}
                      className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                )}
              </div>
            </section>
          </motion.aside>

          {/* OUTPUT AREA */}
          <div className="lg:col-span-8 bg-[#050505] p-12 flex flex-col justify-center relative min-h-[60vh] border border-white/5">
            <div className="absolute top-8 left-8 text-[13px] text-white/20 uppercase tracking-[0.4em]">
              <ScrambleText text={`Preview_Buffer :: ${data.mode}`} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={formatted}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto text-center space-y-12"
              >
                <p className="text-2xl sm:text-4xl text-white font-serif italic leading-relaxed selection:bg-white selection:text-black justify-center flex">
                  {formatted}
                </p>

                <button
                  onClick={copyToClipboard}
                  className="mx-auto group flex items-center gap-4 text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors"
                >
                  <span className="h-px w-8 bg-white/20 group-hover:w-12 group-hover:bg-white transition-all" />
                  {copyLabel}
                </button>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-8 right-8 flex gap-8 opacity-20 text-[13px] uppercase tracking-widest">
              <span>
                Standard: <ScrambleText text="APA_7" timeOffset={100} />
              </span>
              <span>
                Encoding: <ScrambleText text="UTF-8" timeOffset={100} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
