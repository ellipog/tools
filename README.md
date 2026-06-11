<!-- ============================================================ -->
<!-- AI AGENT INSTRUCTIONS — DO NOT REMOVE                      -->
<!-- ============================================================ -->
<!--
  READ THIS FIRST if you are an AI assistant working on this codebase.

  ## How to use this checklist

  1. Before starting any task, read this checklist to understand what
     already exists and what is planned.
  2. NEVER build something that is already marked [x].
  3. When you complete an item, mark it [x] and optionally note the date.
  4. For new tool pages, follow the established pattern:
     - "use client" + Framer Motion + ScrambleText + Navbar + FileDropZone
     - 12-column grid: sidebar (lg:col-span-3/4) + main (lg:col-span-8/9)
     - Numbered section headers: "01. SOURCE", "02. CONFIG", "03. EXPORT"
     - Idle/null state with descriptive placeholder text
     - Register in app/page.tsx under the appropriate category group
  5. Read FEATURE_PLANS.md for detailed implementation specs of planned tools.
  6. Read SITE_FEATURES.md for detailed implementation notes on site features.
  7. Read style.md for design system conventions.
  8. Read AGENTS.md for Next.js version-specific rules.
  9. Read CLAUDE.md for additional project conventions.
-->

# runen — Feature Checklist

> **Project**: [runen.no](https://runen.no) — Industrial brutalist collection of client-side developer tools.
> **Stack**: Next.js 16 · React 19 · Tailwind 4 · Framer Motion 12 · TypeScript 5

---

## ✅ Existing Tools (complete)

### Images

- [x] `/images/pixelart` — Pixel Art editor
- [x] `/images/ascii` — ASCII Art generator
- [x] `/images/remove-bg` — Background Remover (ML)
- [x] `/images/gif-captions` — GIF Caption adder
- [x] `/images/resizer` — Image Resizer (resize, crop, compress, target file size)

### Text

- [x] `/text/references` — APA 7 Citation generator
- [x] `/text/json-formatter` — JSON Format/Minify/YAML converter
- [x] `/text/regex-tester` — Regex Tester with presets
- [x] `/text/diff` — Diff Tool (side-by-side, unified, inline)

### Files

- [x] `/files/converter` — File Converter (image/audio/data/document formats)
- [x] `/files/compressor` — File Compressor (ZIP)
- [x] `/files/hash` — Hash Generator
- [x] `/files/metadata` — File Metadata extractor (EXIF)
- [x] `/files/hex-viewer` — Hex Viewer

### Utils

- [x] `/utils/timezones` — Time Zone Converter (visual timeline, overlap finder)

---

## ⬜ Planned Tools (from FEATURE_PLANS.md)

- [ ] `/images/video-ascii` — ASCII Video Player (webcam/video → real-time ASCII)
- [ ] `/files/sound-visualizer` — Sound Visualizer (waveform, frequency bars, spectrogram, circle wave)
- [ ] `/files/media-download` — Media Downloader / Link Metadata Extractor

---

## ⬜ Site Features (from SITE_FEATURES.md)

- [x] **01. Light Mode Toggle** — Dark/light theme with localStorage persistence
- [x] **02. PWA / Offline Support** — Service worker, manifest, install prompt, offline indicator
- [ ] **03. Tool Chaining / Pipeline** — Pipe output of one tool into another
- [ ] **04. Save/Restore Tool State** — Persist inputs/config across sessions
- [ ] **05. Shareable Output Links** — Encode tool state in URL hash
- [ ] **06. Mobile-Responsive Layout** — Collapsible drawers, touch targets
- [ ] **07. Batch Processing** — Process multiple files in parallel
- [ ] **08. Recent Files Panel** — Quick re-upload from session history
- [ ] **09. Keyboard Shortcuts Cheat Sheet** — `?` overlay with shortcuts
- [ ] **10. Tool Comparison Mode** — Side-by-side instance comparison
- [ ] **11. Undo/Redo History** — Non-destructive editing stack
- [ ] **12. Homepage Redesign** — Curated grid, search, pinned favorites
- [ ] **13. Sound Effects Toggle** — Retro UI audio feedback (Web Audio API)
- [x] **14. Theme Customization** — Accent colors, CRT intensity, font size
- [ ] **15. Export History Log** — Session export log with re-download
- [ ] **16. Contextual Help / Tooltips** — Inline explanations for controls
- [ ] **17. Performance Mode** — Disable animations/CRT for speed
- [ ] **18. Customizable Tool Grid** — Drag-and-drop reorder, hide tools
- [ ] **19. Multi-Tab / Session Support** — Run multiple tools simultaneously
- [ ] **20. Onboarding Tour** — First-visit guided tour
- [ ] **21. Per-Tool Quick Settings / Presets** — Named config presets
- [ ] **22. Image Gallery / Library** — Cross-tool image library (IndexedDB)
- [ ] **23. User-Defined Pipelines / Workflows** — Multi-step automation
- [ ] **24. Accessibility (a11y) Audit** — WCAG 2.1 AA compliance
- [ ] **25. Analytics Dashboard** — Privacy-first usage insights
- [ ] **26. Before/After Comparison** — Input vs output side-by-side
- [ ] **27. API / Embed Mode** — REST endpoints + embeddable widgets
- [ ] **28. Notification System** — Unified toast notifications
- [ ] **29. File Preview Before Processing** — Confirm dialog with file info
- [ ] **30. Collaborative / Share Sessions** — Real-time multi-user sessions

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
