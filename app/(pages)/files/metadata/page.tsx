"use client";

import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";
import * as exifr from "exifr";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface BasicMeta {
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
  modified: string;
}

interface ImageMeta {
  width?: number;
  height?: number;
  make?: string;
  model?: string;
  dateTaken?: string;
  iso?: number;
  focalLength?: number;
  fNumber?: number;
  exposureTime?: string;
  gps?: { latitude: number; longitude: number } | null;
}

interface AudioMeta {
  duration: number;
  sampleRate?: number;
  channels?: number;
}

interface VideoMeta {
  width: number;
  height: number;
  duration: number;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MetadataPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [file, setFile] = useState<File | null>(null);
  const [basic, setBasic] = useState<BasicMeta | null>(null);
  const [image, setImage] = useState<ImageMeta | null>(null);
  const [audio, setAudio] = useState<AudioMeta | null>(null);
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const reset = () => {
    setFile(null);
    setBasic(null);
    setImage(null);
    setAudio(null);
    setVideo(null);
    setError(null);
  };

  const handleUpload = async (f: File) => {
    reset();
    setFile(f);
    setLoading(true);

    const basicMeta: BasicMeta = {
      name: f.name,
      size: formatFileSize(f.size),
      sizeBytes: f.size,
      type: f.type || "unknown",
      modified: formatDate(new Date(f.lastModified)),
    };
    setBasic(basicMeta);

    try {
      if (f.type.startsWith("image/")) {
        const exifData = await exifr.parse(f, {
          pick: ["Make", "Model", "DateTimeOriginal", "ISO", "FocalLength", "FNumber", "ExposureTime", "GPSLatitude", "GPSLongitude"],
        });
                const img = new Image();
        const imgUrl = URL.createObjectURL(f);
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = imgUrl;
        });
        URL.revokeObjectURL(imgUrl);

        setImage({
          width: img.naturalWidth,
          height: img.naturalHeight,
          make: exifData?.Make,
          model: exifData?.Model,
          dateTaken: exifData?.DateTimeOriginal ? formatDate(new Date(exifData.DateTimeOriginal)) : undefined,
          iso: exifData?.ISO,
          focalLength: exifData?.FocalLength,
          fNumber: exifData?.FNumber,
          exposureTime: exifData?.ExposureTime,
          gps: exifData?.GPSLatitude && exifData?.GPSLongitude
            ? { latitude: exifData.GPSLatitude, longitude: exifData.GPSLongitude }
            : null,
        });
      }

      if (f.type.startsWith("audio/")) {
        const url = URL.createObjectURL(f);
        const audio = new Audio();
        audioRef.current = audio;
        const dur = await new Promise<number>((resolve, reject) => {
          audio.onloadedmetadata = () => resolve(audio.duration);
          audio.onerror = () => reject(new Error("Could not read audio metadata"));
          audio.src = url;
        });
        URL.revokeObjectURL(url);
        setAudio({ duration: dur });
      }

      if (f.type.startsWith("video/")) {
        const url = URL.createObjectURL(f);
        const vid = document.createElement("video");
        videoRef.current = vid;
        const meta = await new Promise<VideoMeta>((resolve, reject) => {
          vid.onloadedmetadata = () => resolve({
            width: vid.videoWidth,
            height: vid.videoHeight,
            duration: vid.duration,
          });
          vid.onerror = () => reject(new Error("Could not read video metadata"));
          vid.src = url;
        });
        URL.revokeObjectURL(url);
        setVideo(meta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read metadata");
    } finally {
      setLoading(false);
    }
  };

  const isImage = file?.type.startsWith("image/");
  const isAudio = file?.type.startsWith("audio/");
  const isVideo = file?.type.startsWith("video/");

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleUpload}>
        <Navbar title="metadata" jp="ファイル情報" category="files" href="/files/metadata" />
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
              {/* 01. SOURCE */}
              <section className="space-y-4">
                <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                  01. source{" "}
                  <ScrambleText
                    text={"ソース"}
                    chars={jpchars}
                    timeOffset={100}
                    autoPlay
                    className="text-sm text-white/35"
                  />
                </div>
                <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                  <span className="text-xs text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">
                    {file ? basic?.name : "upload_file"}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </section>
            </motion.aside>

            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-8 flex flex-col bg-white/2 border border-white/5 min-h-[60vh] p-8"
            >
              {error && !loading && (
                <div className="text-red-400 text-xs tracking-widest uppercase mb-4">
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex-1 flex items-center justify-center">
                  <ScrambleText
                    text="reading…"
                    className="text-white/30 text-xs tracking-[0.5em] italic"
                  />
                </div>
              )}

              {basic && !loading && (
                <div className="w-full space-y-8">
                  {/* Basic info */}
                  <section>
                    <div className="text-[10px] tracking-widest uppercase text-white/50 mb-3 border-b border-white/10 pb-1">
                      basic
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                      {[
                        { label: "name", value: basic.name },
                        { label: "size", value: basic.size },
                        { label: "type", value: basic.type },
                        { label: "modified", value: basic.modified },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-white/30">{label}</span>
                          <span className="text-[12px] text-white/80 break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Image metadata */}
                  {image && (
                    <section>
                      <div className="text-[10px] tracking-widest uppercase text-white/50 mb-3 border-b border-white/10 pb-1">
                        image
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-white/30">dimensions</span>
                          <span className="text-[12px] text-white/80">{image.width} × {image.height} px</span>
                        </div>
                        {image.make && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-white/30">camera make</span>
                            <span className="text-[12px] text-white/80">{image.make}</span>
                          </div>
                        )}
                        {image.model && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-white/30">camera model</span>
                            <span className="text-[12px] text-white/80">{image.model}</span>
                          </div>
                        )}
                        {image.dateTaken && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-white/30">date taken</span>
                            <span className="text-[12px] text-white/80">{image.dateTaken}</span>
                          </div>
                        )}
                        {image.iso && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-white/30">iso</span>
                            <span className="text-[12px] text-white/80">{image.iso}</span>
                          </div>
                        )}
                        {image.fNumber && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-white/30">f-number</span>
                            <span className="text-[12px] text-white/80">f/{image.fNumber}</span>
                          </div>
                        )}
                        {image.focalLength && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-white/30">focal length</span>
                            <span className="text-[12px] text-white/80">{image.focalLength} mm</span>
                          </div>
                        )}
                        {image.exposureTime && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-white/30">exposure</span>
                            <span className="text-[12px] text-white/80">{image.exposureTime}s</span>
                          </div>
                        )}
                      </div>
                      {image.gps && (
                        <div className="mt-3">
                          <span className="text-[9px] uppercase tracking-widest text-white/30">gps</span>
                          <a
                            href={`https://www.google.com/maps?q=${image.gps.latitude},${image.gps.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[12px] text-white/80 hover:text-white underline underline-offset-2"
                          >
                            {image.gps.latitude.toFixed(6)}, {image.gps.longitude.toFixed(6)}
                          </a>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Audio metadata */}
                  {audio && (
                    <section>
                      <div className="text-[10px] tracking-widest uppercase text-white/50 mb-3 border-b border-white/10 pb-1">
                        audio
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-white/30">duration</span>
                          <span className="text-[12px] text-white/80">{formatDuration(audio.duration)}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Video metadata */}
                  {video && (
                    <section>
                      <div className="text-[10px] tracking-widest uppercase text-white/50 mb-3 border-b border-white/10 pb-1">
                        video
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-white/30">resolution</span>
                          <span className="text-[12px] text-white/80">{video.width} × {video.height} px</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-white/30">duration</span>
                          <span className="text-[12px] text-white/80">{formatDuration(video.duration)}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {!isImage && !isAudio && !isVideo && (
                    <div className="text-[10px] text-white/30 tracking-widest italic">
                      no extended metadata available for this file type
                    </div>
                  )}
                </div>
              )}

              {!basic && !loading && !error && (
                <div className="flex-1 flex items-center justify-center">
                  <ScrambleText
                    text="null_data_idle"
                    className="text-white/10 text-xs tracking-[0.5em] italic"
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