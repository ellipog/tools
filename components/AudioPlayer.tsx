"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  src: string;
  fileName?: string;
}

export default function AudioPlayer({ src, fileName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { if (!seeking) setCurrent(audio.currentTime); };
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [src, seeking]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrent(val);
  };

  const handleSeekEnd = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = current;
    setSeeking(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = val;
      if (val === 0) {
        setMuted(true);
      } else {
        setMuted(false);
      }
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.volume = prevVolume || 0.5;
      setVolume(prevVolume || 0.5);
      setMuted(false);
    } else {
      setPrevVolume(volume);
      audio.volume = 0;
      setVolume(0);
      setMuted(true);
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const volIcon = () => {
    if (muted || volume === 0) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/70 group-hover:fill-white transition-colors">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5z" />
          <path d="M16.5 8.5l1-1 5 5-1 1z" />
          <path d="M21.5 8.5l-1-1-5 5 1 1z" />
        </svg>
      );
    }
    if (volume < 0.5) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/70 group-hover:fill-white transition-colors">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5z" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/70 group-hover:fill-white transition-colors">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5zm4 0A8.5 8.5 0 0 0 17 5.5v2.5a6 6 0 0 1 0 10v2.5a8.5 8.5 0 0 0 3.5-6.5z" />
      </svg>
    );
  };

  const progressPercent = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="w-full border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      {fileName && (
        <div className="text-[10px] uppercase tracking-widest text-white/50 truncate">
          {fileName}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="shrink-0 w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-white/5 transition-all group rounded-sm"
        >
          {playing ? (
            <svg viewBox="0 0 16 16" className="w-4 h-4 fill-white/70 group-hover:fill-white transition-colors">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="w-4 h-4 fill-white/70 group-hover:fill-white transition-colors">
              <path d="M4 2v12l10-6L4 2z" />
            </svg>
          )}
        </button>

        <div className="flex-1 relative h-5 flex items-center group/progress">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onInput={(e) => { setSeeking(true); setCurrent(Number((e.target as HTMLInputElement).value)); }}
            onChange={handleSeek}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="progress-slider"
          />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-white/30 pointer-events-none rounded-full"
            style={{ width: "100%" }}
          >
            <div
              className="h-full bg-white group-hover/progress:bg-blue-400 transition-colors rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 font-mono tabular-nums min-w-[80px] text-right">
          {fmt(current)} / {fmt(duration)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="shrink-0 w-6 h-6 flex items-center justify-center hover:bg-white/5 transition-all group rounded-sm"
        >
          {volIcon()}
        </button>
        <div className="flex-1 max-w-[100px] relative h-4 flex items-center group/vol">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-white/20 pointer-events-none rounded-full"
            style={{ width: "100%" }}
          >
            <div
              className="h-full bg-white/60 group-hover/vol:bg-blue-400 transition-colors rounded-full"
              style={{ width: `${muted ? 0 : volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
