# runen — Feature Plans

Comprehensive implementation plans for 6 new tools, based on the existing codebase architecture (Next.js 16, React 19, Tailwind 4, Framer Motion 12, TypeScript 5, industrial brutalist aesthetic).

---

## Table of Contents

1. [ASCII Video Player](#1-ascii-video-player)
2. [Sound Visualizer](#2-sound-visualizer)
3. [Image Resizer (Target File Size)](#3-image-resizer-target-file-size)
4. [Diff Tool](#4-diff-tool)
5. [Time Zone Converter](#5-time-zone-converter)
6. [Media Downloader](#6-media-downloader)

---

## 1. ASCII Video Player

| Field | Value |
|---|---|
| **Category** | `images` |
| **Route** | `/images/video-ascii` |
| **Navbar** | `title="video-ascii" jp="ビデオアスキー" category="images"` |
| **Icon** | `"layers"` (or new `"video"`) |
| **Dependencies** | None (Canvas API only) |
| **Complexity** | Medium-High |

### Concept

Upload a video or activate your webcam and watch it rendered in real-time as ASCII art. Every frame is converted using the same luminance-to-character mapping as the existing ASCII Art tool.

### Frame Pipeline

```
Upload/Webcam → <video> element (hidden)
     ↓
requestAnimationFrame loop (configurable 5–30 FPS throttle)
     ↓
Offscreen <canvas> → drawImage(video, 0, 0, charWidth, charHeight)
     ↓
ctx.getImageData() → RGBA pixel buffer
     ↓
Per-pixel: BT.709 luminance → charSet index
     ↓
<pre> output (text mode) or <canvas> (colored mode)
```

### Reuse from ASCII Tool

Extract core conversion logic into `lib/ascii-engine.ts` (shared between `/ascii` and `/video-ascii`):

```typescript
// lib/ascii-engine.ts
export interface AsciiOptions {
  width: number;           // character columns
  charSet: string;         // ordered darkest→lightest
  invert: boolean;
  contrast: number;        // -100 to 100
  brightness: number;      // -100 to 100
  colored: boolean;
}

export interface AsciiFrame {
  text: string;            // raw ASCII string with \n
  grid: AsciiChar[][];     // per-char { char, r, g, b, a } for colored mode
}

export function imageToAscii(image: HTMLImageElement | ImageData, opts: AsciiOptions): AsciiFrame;
export function renderColoredPreview(grid: AsciiChar[][], ctx: CanvasRenderingContext2D, cellW: number, cellH: number): void;
```

### Controls

| Control | Type | Detail |
|---|---|---|
| Source | File input + Webcam toggle | `.mp4`, `.webm`, `.mov`, or `getUserMedia` |
| Character set | Select | Same 5: standard, japanese, math, minimal, binary |
| Width | Slider 40–200 | Character columns |
| Invert | Toggle | Reverse char order |
| Contrast/Brightness | Slider | Same as ASCII tool |
| Frame rate | Slider 5–30 FPS | Lower = better performance |
| Colored mode | Toggle | Per-char color rendering on canvas |
| Play/Pause | Button | Controls video playback |
| Record GIF | Button | Captures N seconds → GIF via `gif.js` |

### Webcam Mode

```typescript
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;
video.play();
// Feed into same frame pipeline
// Offer "Record 5s" button → buffers frames → exports as GIF
```

### Performance Strategy

- Skip processing when tab is inactive (`document.hidden`)
- Auto-reduce width if FPS drops below target
- Use `createImageBitmap(video)` for GPU-backed frame extraction when available
- Only re-render `<pre>` when output text actually changes (diff check)
- `IntersectionObserver` to pause when scrolled off-screen

### Files

| Action | Path |
|---|---|
| **Create** | `app/(pages)/images/video-ascii/page.tsx` (~600 lines) |
| **Create** | `lib/ascii-engine.ts` (~80 lines extracted + shared) |
| **Modify** | `app/page.tsx` — register in `images` group |
| **Modify** | `components/CommandPalette.tsx` — add icon if new |

---

## 2. Sound Visualizer

| Field | Value |
|---|---|
| **Category** | `files` |
| **Route** | `/files/sound-visualizer` |
| **Navbar** | `title="sound-visualizer" jp="サウンドビジュアライザー" category="files"` |
| **Icon** | `"shuffle"` (or new `"wave"`) |
| **Dependencies** | None (Web Audio API + Canvas) |
| **Complexity** | Medium |

### Concept

Upload an audio file and generate beautiful visualizations — waveform, frequency bars, spectrograms, or radial patterns. Export as PNG (static) or GIF (animated).

### Audio Pipeline

```
File upload → AudioContext.decodeAudioData() → AudioBuffer
     ↓
Time domain: buffer.getChannelData(0)     Frequency domain: AnalyserNode.getByteFrequencyData()
     ↓
Canvas rendering in selected visualization mode
     ↓
Export: PNG (static) or GIF (animated via gif.js worker)
```

### Visualization Modes

| Mode | Description | Data Source |
|---|---|---|
| **Waveform** | Connected amplitude line over time | Raw sample data, decimated to canvas width |
| **Frequency Bars** | Vertical bar chart (equalizer) | FFT byte data, 64–256 bins |
| **Spectrogram** | 2D heatmap: time (X) × frequency (Y) × amplitude (color) | Stacked FFT slices over time |
| **Circle Wave** | Polar/radial waveform | Same as waveform, mapped to polar coords |

### Controls

| Control | Type | Detail |
|---|---|---|
| Source | FileDropZone | `.mp3`, `.wav`, `.flac`, `.ogg`, `.m4a`, `.opus` |
| Mode | Select | Waveform / Frequency Bars / Spectrogram / Circle Wave |
| Color scheme | Select | Monochrome / Cyan gradient / Heatmap / Plasma |
| Time range | Range slider | Select portion of audio (full or subsection) |
| Resolution | Width input (400–4000px) | Output image width |
| Animated GIF | Toggle + FPS slider | Duration set automatically to audio length |
| Background | Toggle | Black (default) or transparent |

### Audio Player Sync

Reuse `AudioPlayer` component below the visualization. When playing, show a vertical playhead cursor sweeping across the visualization in sync with `audio.currentTime`.

### Export

- Static modes → PNG via `canvas.toBlob()`
- Animated GIF → `gif.js` worker (reuse existing `/public/workers/gif.worker.js` infrastructure)
- `ShareButton` for copy/download

### Files

| Action | Path |
|---|---|
| **Create** | `app/(pages)/files/sound-visualizer/page.tsx` (~500 lines) |
| **Create** | `lib/visualizers/waveform.ts` — waveform rendering |
| **Create** | `lib/visualizers/frequency.ts` — frequency bar rendering |
| **Create** | `lib/visualizers/spectrogram.ts` — spectrogram rendering |
| **Create** | `lib/visualizers/circle.ts` — radial waveform rendering |
| **Create** | `lib/visualizers/index.ts` — barrel export + shared types |
| **Modify** | `app/page.tsx` — register in `files` group |
| **Modify** | `components/CommandPalette.tsx` — add icon if needed |

### Architecture Note: Visualization Engine

Each visualizer module exports a consistent interface:

```typescript
// lib/visualizers/index.ts
export interface VisualizerOptions {
  width: number;
  height: number;
  colors: string[];       // palette gradient stops
  background: "black" | "transparent";
}

export interface VisualizerResult {
  render(ctx: CanvasRenderingContext2D): void;
}

// Per-module exports:
export function renderWaveform(buffer: AudioBuffer, opts: VisualizerOptions): VisualizerResult;
export function renderFrequencyBars(buffer: AudioBuffer, opts: VisualizerOptions): VisualizerResult;
export function renderSpectrogram(buffer: AudioBuffer, opts: VisualizerOptions): VisualizerResult;
export function renderCircleWave(buffer: AudioBuffer, opts: VisualizerOptions): VisualizerResult;
```

---

## 3. Image Resizer (Target File Size)

| Field | Value |
|---|---|
| **Category** | `images` |
| **Route** | `/images/resizer` |
| **Navbar** | `title="resizer" jp="リサイザー" category="images"` |
| **Icon** | `"photo"` or new `"crop"` |
| **Dependencies** | None (Canvas API only) |
| **Complexity** | Medium |

### Concept

Resize, crop, and compress images. The headline feature: **Target File Size** — specify a max file size in KB, and the tool automatically iterates quality and dimensions to hit it.

### Controls (Sidebar)

| Section | Controls |
|---|---|
| 01. SOURCE | File upload, current file info (name, dimensions, size formatted) |
| 02. RESIZE | Width/Height number inputs, aspect ratio lock toggle, preset buttons (1920, 1280, 800, 400, original), unit selector (px / %) |
| 03. CROP | Aspect ratio presets (Free / 1:1 / 4:3 / 16:9 / 3:2), "Enter crop mode" toggle, reset button |
| 04. COMPRESS | Format selector (JPEG / PNG / WebP), quality slider 1–100, live size estimate |
| 05. TARGET SIZE | Enable toggle, target input (KB/MB), "Auto-optimize" action button |
| 06. EXPORT | Download button with format + current estimated size |

### Target File Size Algorithm

```
function optimizeToTargetSize(
  imageData: ImageData,
  targetBytes: number,
  format: "jpeg" | "webp",
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  // Phase 1: Binary search on quality (0–100)
  let lo = 1, hi = 100;
  let bestBlob: Blob | null = null;

  for (let iter = 0; iter < 12; iter++) {
    const mid = Math.floor((lo + hi) / 2);
    const blob = await encodeImage(imageData, format, mid, maxWidth, maxHeight);
    if (blob.size <= targetBytes) {
      bestBlob = blob;
      lo = mid + 1;        // try higher quality
    } else {
      hi = mid - 1;        // too big, lower quality
    }
  }

  // Phase 2: If still too big at quality=1, scale down dimensions
  if (!bestBlob || bestBlob.size > targetBytes) {
    let scale = 0.9;
    while (scale > 0.1) {
      const w = Math.floor(maxWidth * scale);
      const h = Math.floor(maxHeight * scale);
      const blob = await encodeImage(imageData, format, 1, w, h);
      if (blob.size <= targetBytes) { bestBlob = blob; break; }
      scale -= 0.1;
    }
  }

  return bestBlob!;
}
```

- `encodeImage` uses `canvas.toBlob()` — all client-side, instant
- Show live estimate as user adjusts quality slider ("~185 KB")
- Progress indicator during multi-iteration optimization
- Fallback: if target is physically impossible (e.g., minimum JPEG is still larger), show "Minimum achievable: ~X KB"

### Crop Mode UX

When crop mode is active:
- Main preview overlay: semi-transparent mask + draggable/resizable rectangle
- Mouse drag to select region, corner/edge handles to resize
- Constrain to selected aspect ratio
- "Apply crop" button commits the crop and updates the preview
- "Reset" to undo

### Preview Area (Main)

Side-by-side or overlay comparison:
- **Split view**: Original left, result right (when content fits)
- **Slider mode**: Single image with a vertical drag slider revealing original vs result
- Stats bar below: `Original: 2.4MB (1920×1080) → Result: 186KB (1280×720) — 92% reduction`

### Reuse from `lib/converters/image.ts`

- Format encoding (`toBlob` with `image/jpeg`, `image/webp`, `image/png`)
- Resize with aspect ratio preservation
- Filter options (grayscale, sepia, invert) — optional add-on

### Files

| Action | Path |
|---|---|
| **Create** | `app/(pages)/images/resizer/page.tsx` (~550 lines) |
| **Modify** | `app/page.tsx` — register in `images` group |
| **Modify** | `components/CommandPalette.tsx` — add icon if new |

---

## 4. Diff Tool

| Field | Value |
|---|---|
| **Category** | `text` |
| **Route** | `/text/diff` |
| **Navbar** | `title="diff" jp="差分" category="text"` |
| **Icon** | `"list"` or new `"diff"` |
| **Dependencies** | `diff` + `@types/diff` (npm) |
| **Complexity** | Medium |

### Concept

Side-by-side and unified text comparison with word/line-level diffing. Paste or upload two texts and see exactly what changed.

### Diff Algorithm

Use the [`diff`](https://github.com/kpdecker/jsdiff) npm package (Myers' algorithm):

```typescript
import { diffLines, diffWords, diffChars, type Change } from "diff";

// Line-level:
const changes = diffLines(oldText, newText);

// Word-level:
const changes = diffWords(oldText, newText);

// Character-level:
const changes = diffChars(oldText, newText);
```

Each `Change` object: `{ value: string, added?: boolean, removed?: boolean, count?: number }`

### View Modes

| Mode | Description | Implementation |
|---|---|---|
| **Side-by-Side** | Two aligned panels, old left / new right. Added lines highlighted, removed lines shown with strikethrough. | Split `changes` into aligned pairs; render in two scroll-synced `<div>` columns |
| **Unified** | Single column with `+`/`-` prefix (git-style) | Flatten changes into one list, prefix each line, color-code |
| **Inline** | Word-level highlighting within lines | For each changed line, run `diffWords()` and highlight added/removed words inline |

### Controls

| Control | Type | Detail |
|---|---|---|
| Input A | Textarea or file upload | Paste or drag `.txt`/`.js`/`.ts`/`.md` |
| Input B | Textarea or file upload | Same as above |
| Swap | Button | Swap A and B |
| Diff mode | Select | Side-by-side / Unified / Inline |
| Granularity | Select | Line / Word / Character |
| Ignore whitespace | Toggle | Trim trailing/leading whitespace before diffing |
| Word wrap | Toggle | Wrap long lines vs horizontal scroll |
| Case sensitive | Toggle | Default on |
| Export as patch | Button | Download unified diff as `.patch` file |
| Copy | ShareButton | Copy unified diff to clipboard |

### UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ 00. INPUTS                                               │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ INPUT A          │  │ INPUT B          │  [SWAP]      │
│  │ (textarea)       │  │ (textarea)       │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                          │
│ 01. CONFIG   [mode ▼] [granularity ▼] [ ] ignore ws     │
│                                                          │
│ 02. DIFF OUTPUT                                           │
│  ┌────────────┬────────────┐                             │
│  │ OLD        │ NEW        │  ← synced scroll           │
│  │ - line 1   │ + line 1   │                             │
│  │ - line 2   │   line 2   │                             │
│  │   line 3   │   line 3   │                             │
│  │ - line 4   │ + new line │                             │
│  └────────────┴────────────┘                             │
│                                                          │
│ Lines: 10 added · 3 removed · 2 changed · 85% similar   │
│ [Download .patch] [Copy diff]                            │
└──────────────────────────────────────────────────────────┘
```

### Color Scheme (brutalist)

```css
/* Added */
.bg-diff-add { background: rgba(255, 255, 255, 0.08); }
.text-diff-add { color: rgba(200, 255, 200, 0.9); }

/* Removed */
.bg-diff-rem { background: rgba(255, 255, 255, 0.04); }
.text-diff-rem { color: rgba(255, 180, 180, 0.9); }

/* Changed (inline word-level) */
.bg-diff-change { background: rgba(255, 255, 200, 0.1); }
```

### Edge Cases

- Large files: cap at 5000 lines, show warning if exceeded, chunk display
- Binary content detection: if uploaded file appears binary, show warning
- Empty input: show "Paste or upload text in both panels"
- Identical files: show "No differences found" with green indicator
- Mismatched line counts: normal — diff algorithm handles it

### Files

| Action | Path |
|---|---|
| **Create** | `app/(pages)/text/diff/page.tsx` (~500 lines) |
| **Create** | `lib/diff-engine.ts` — wraps `diff` with formatting, ignore-whitespace options |
| **Modify** | `app/page.tsx` — register in `text` group |
| **Modify** | `package.json` — add `diff` + `@types/diff` |
| **Modify** | `components/CommandPalette.tsx` — add icon if needed |

---

## 5. Time Zone Converter

| Field | Value |
|---|---|
| **Category** | `text` |
| **Route** | `/text/timezones` |
| **Navbar** | `title="timezones" jp="タイムゾーン" category="text"` |
| **Icon** | New `"clock"` |
| **Dependencies** | None (native `Intl` APIs only) |
| **Complexity** | Medium-High |

### Concept

A visual time zone converter with overlapping hour finding. Add time zones, pick a time, and see all converted times displayed on horizontal 24-hour timeline bars. The overlap finder highlights common business hours across all selected zones.

### Core Logic (No External Libraries)

```typescript
// Get all IANA timezone IDs
const allZones = Intl.supportedValuesOf("timeZone");  // ~400+ entries

// Get offset at a given date
function getOffset(tz: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const offsetPart = parts.find(p => p.type === "timeZoneName");
  return parseOffset(offsetPart?.value ?? "UTC");
}

// Format time in a timezone
function formatTime(tz: string, date: Date, hour12: boolean): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  }).format(date);
}

// Sunrise/sunset approximation (based on latitude from timezone database)
function getDayPeriod(tz: string, date: Date): { sunrise: number, sunset: number } {
  // Approximate from offset: assumption 6am–6pm local = day
  const offset = getOffset(tz, date);
  return { sunrise: 6 - offset, sunset: 18 - offset };
}
```

### UI Layout

**Sidebar:**
| Section | Controls |
|---|---|
| 01. ZONES | Zone list with reorder (drag handle), add zone search + dropdown, remove button per zone, shortcut presets (NYC/LDN/TKY/SFO/SYD) |
| 02. TIME | Date picker, time input (HH:MM), "Now" button, 12h/24h toggle |
| 03. OVERLAY | "Find overlap" button, business hours range (default 9:00–17:00), result display ("14:00–18:00 UTC overlaps all 4 zones") |
| 04. PRESETS | Save current zone set to localStorage, load saved sets |

**Main (Timeline):**
```
Zone 1: [New York (UTC-4)]  ████░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒░░░░░████
                                                          ↑ cursor
Zone 2: [London (UTC+1)]    ░░░░████░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒░░░░
                                                          ↑ cursor
Zone 3: [Tokyo (UTC+9)]     ░░░░░░░░░░████░░░░░░░▒▒▒▒▒▒▒▒▒▒
                                                          ↑ cursor

09:00    12:00    15:00    18:00    21:00    00:00    03:00    06:00
```

- Each bar is 24 hours wide (timeline at bottom)
- Dark sections = night (approximate), bright sections = day
- Vertical cursor line = selected time (draggable)
- Hover on any bar → tooltip with exact time + full timezone name
- Overlap mode: highlight the intersection of business hours across all bars

### Overlap Finder

```typescript
interface OverlapResult {
  startHour: number;      // UTC hour
  endHour: number;        // UTC hour
  zones: string[];        // timezone IDs
}

function findOverlap(
  zones: string[],
  date: Date,
  businessStart: number,  // e.g., 9 (local hour)
  businessEnd: number     // e.g., 17 (local hour)
): OverlapResult[] {
  // For each zone, calculate UTC range of business hours
  // Find intersection of all ranges
  // Return sorted list of overlap windows
}
```

### Persistence

```typescript
const STORAGE_KEY = "runen:timezone-presets";

interface Preset {
  name: string;
  zones: string[];
}

function loadPresets(): Preset[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
}

function savePreset(name: string, zones: string[]): void {
  const presets = loadPresets();
  presets.push({ name, zones });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
```

### Edge Cases

- 30-min / 45-min offset zones (Nepal UTC+5:45, Chatham UTC+12:45)
- DST transitions: show "DST" badge on affected zones + current offset
- Dates crossing midnight: display date change clearly on timeline
- Antarctica/time zones without DST: handled correctly by `Intl`
- Timezone database stale: browser keeps it updated automatically

### Files

| Action | Path |
|---|---|
| **Create** | `app/(pages)/text/timezones/page.tsx` (~450 lines) |
| **Create** | `lib/timezone-engine.ts` — offset calc, formatting, overlap logic |
| **Modify** | `app/page.tsx` — register in `text` group |
| **Modify** | `components/CommandPalette.tsx` — add `"clock"` icon case |

---

## 6. Media Downloader

| Field | Value |
|---|---|
| **Category** | `files` |
| **Route** | `/files/media-download` |
| **Navbar** | `title="media-download" jp="メディアダウンロード" category="files"` |
| **Icon** | New `"download"` |
| **Dependencies** | None for Phase 1; yt-dlp + ffmpeg for Phase 2 |
| **Complexity** | Very High (full) / Medium (Phase 1 only) |

### ⚠️ Important Caveats

This is the most complex feature by far and requires a fundamentally different architecture than the existing tools:

| Challenge | Detail |
|---|---|
| **No client-side solution** | YouTube, Spotify, etc. do not expose download APIs to browsers |
| **Server-side required** | Need a backend process (yt-dlp, spotdl) or third-party API |
| **Legal risk** | Downloading copyrighted content may violate platform ToS |
| **Reliability** | Platforms actively block scrapers — maintenance burden |
| **Resource usage** | Video transcoding is CPU/disk-intensive on the server |
| **File size** | Videos can be multiple GB |

### Recommended: Phase 1 — Link Metadata Extractor (stable, immediately useful)

Reuse and extend the existing `scrape.ts` server action to build a rich link preview tool:

```
Paste URL → Server action fetches page
     ↓
Parse: Open Graph tags, JSON-LD, Twitter Cards, oEmbed (if available)
     ↓
Display: title, description, thumbnail, platform icon, duration, quality
     ↓
Actions: "Open in YouTube" / "Open in Spotify" (external links)
         "Copy clean link" (strip tracking params)
         "Download thumbnail" (saves preview image)
```

**Platform Detection:**
```typescript
type Platform = "youtube" | "spotify" | "twitter" | "instagram" | "tiktok" | "soundcloud" | "vimeo" | "generic";

function detectPlatform(url: string): Platform {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/spotify\.com/.test(url)) return "spotify";
  if (/twitter\.com|x\.com/.test(url)) return "twitter";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/soundcloud\.com/.test(url)) return "soundcloud";
  if (/vimeo\.com/.test(url)) return "vimeo";
  return "generic";
}
```

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ PASTE LINK                                   │
│ [_________________________________] [FETCH]  │
│                                              │
│ HISTORY (last 10, localStorage)              │
│ • https://youtube.com/watch?v=...  [re-fetch]│
│ • https://open.spotify.com/track/...         │
│                                              │
│ ──── RESULT ────                             │
│ ┌──────────┐                                 │
│ │ THUMBNAIL │  🎬 YouTube                    │
│ │   img     │  "How to Build a...            │
│ │           │  Channel: TechWithTim          │
│ └──────────┘  Duration: 12:34                │
│               Uploaded: 2026-03-15           │
│                                              │
│ [Open in YouTube] [Copy clean link]          │
│ [Download thumbnail]                         │
└─────────────────────────────────────────────┘
```

### Phase 2 — Proxy Download (requires server infrastructure)

Add a server-side API route that proxies downloads:

```typescript
// app/api/download-media/route.ts
export async function POST(request: Request) {
  const { url, format } = await request.json();
  const platform = detectPlatform(url);

  // Option A: Spawn yt-dlp (requires binary on server)
  const { stdout } = await exec(`yt-dlp -f bestaudio/bestvideo -o - "${url}"`);

  // Option B: Use a third-party API (requires API key)
  const response = await fetch(`https://api.somedownloadservice.com/download?url=${url}`);

  // Stream response back to client
  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

**Server Requirements:**
- `yt-dlp` binary installed (Python script, ~5MB)
- `ffmpeg` binary for format conversion/merging
- Adequate disk space for temp files, cleanup job
- Extended API timeout (Vercel Hobby has 10s limit — insufficient)
- Consider dedicated server or cloud function with longer timeout

### Alternative Approaches (Instead of Full Downloader)

| Alternative | Pro | Con |
|---|---|---|
| **Phase 1 only** (Metadata + clean link) | Zero infra, no legal concerns | No actual download |
| **Bulk Image Downloader** (paste image URLs → ZIP) | Solves real need, uses JSZip | Doesn't do video |
| **Web Page Archiver** (save page as single HTML) | Useful, client-side only | Complex HTML processing |
| **Third-party embed API** (e.g., oembed.com) | Standard protocol, free | Limited metadata, no download |

### Files

| Action | Path |
|---|---|
| **Create** | `app/(pages)/files/media-download/page.tsx` (~400 lines) |
| **Create** | `lib/media-parser.ts` — URL parsing, platform detection, history management |
| **Modify** | `app/actions/scrape.ts` — enhance existing scraper with richer metadata extraction |
| **Modify** | `app/page.tsx` — register in `files` group |
| **Modify** | `components/CommandPalette.tsx` — add `"download"` icon case |

---

## Implementation Order (Recommended)

| Priority | Feature | Why First |
|---|---|---|
| **1** | Image Resizer | Low complexity, immediate utility, no new deps, shares patterns with existing converter |
| **2** | Diff Tool | Medium complexity, very useful for dev users, one new dep (`diff`) |
| **3** | Sound Visualizer | Fun showcase, no new deps, reuse AudioPlayer + gif.js infra |
| **4** | Time Zone Converter | Medium-high complexity, no new deps, polished UX |
| **5** | ASCII Video Player | High complexity with performance tuning, builds on existing ASCII logic |
| **6** | Media Downloader | Phase 1 only; full version requires new server infra |

---

## Shared Implementation Notes

### All Tools Follow This Pattern

```typescript
"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import FileDropZone from "@/components/FileDropZone";
import { jpcharlist } from "@/public/data/charlists";

export default function ToolName() {
  const jpchars = useMemo(() => jpcharlist, []);
  // ... state + logic

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <FileDropZone onDrop={handleFileDrop}>
        <Navbar title="tool-name" jp="日本語" category="category" />
        <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
          <motion.header>
            {/* Badge/version */}
          </motion.header>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 space-y-10">
              {/* Sections: 01. SOURCE, 02. CONFIG, 03. OPTIONS */}
            </motion.aside>
            <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="lg:col-span-9 flex flex-col bg-white/5 border border-white/10 min-h-[70vh]">
              {/* Preview / Results / Idle state */}
            </motion.main>
          </div>
        </div>
      </FileDropZone>
    </div>
  );
}
```

### Homepage Registration

Each new tool must be added to `app/page.tsx`:

```typescript
const groups = [
  {
    title: "images",
    items: [
      // ... existing items
      { label: "video-ascii", href: "/images/video-ascii", description: "ビデオアスキー", icon: "layers" },
      { label: "resizer", href: "/images/resizer", description: "リサイザー", icon: "photo" },
    ],
  },
  {
    title: "text",
    items: [
      // ... existing items
      { label: "diff", href: "/text/diff", description: "差分", icon: "list" },
      { label: "timezones", href: "/text/timezones", description: "タイムゾーン", icon: "clock" },
    ],
  },
  {
    title: "files",
    items: [
      // ... existing items
      { label: "sound-visualizer", href: "/files/sound-visualizer", description: "サウンドビジュアライザー", icon: "shuffle" },
      { label: "media-download", href: "/files/media-download", description: "メディアダウンロード", icon: "download" },
    ],
  },
];
```

### Command Palette Icon Registration

If new icon names are introduced (e.g., `"clock"`, `"download"`, `"video"`), add corresponding SVG cases to the `PaletteIcon` component in `components/CommandPalette.tsx`.

### Design System Consistency

All tools follow the established conventions from `style.md`:
- **Typography**: Uppercase labels with `tracking-[0.3em]`, numbered section headers (`01. SOURCE`)
- **Colors**: Black backgrounds (`#000000` / `#050505`), white accents, `white/10` borders
- **Animations**: Framer Motion sidebar slide-in, main content fade-in
- **Components**: `ScrambleText` for Japanese labels, `FileDropZone` for drag-and-drop, `Navbar` for breadcrumbs
- **States**: Null/idle states show descriptive placeholder text (e.g., "null_data_idle")