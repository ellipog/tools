# runen — Developer Tools Collection

A curated suite of client-side developer tools. Everything runs in your browser — no uploads to servers, no data leaves your machine.

**Site**: [runen.no](https://runen.no)
**Stack**: Next.js 16 · React 19 · Tailwind 4 · Framer Motion 12 · TypeScript 5

---

## Tools

### Images
| Tool | Description |
|------|-------------|
| Pixel Art | Grid-based pixel art editor |
| ASCII Art | Convert images to ASCII art |
| Background Remover | ML-powered background removal (client-side) |
| GIF Captions | Add text captions to animated GIFs |
| Image Resizer | Resize, crop, compress, and target file size |

### Text
| Tool | Description |
|------|-------------|
| APA 7 Citations | Generate APA 7 reference entries |
| JSON Formatter | Format, minify, and convert JSON ↔ YAML |
| Regex Tester | Test regex patterns with built-in presets |
| Diff Tool | Side-by-side, unified, and inline diff views |

### Files
| Tool | Description |
|------|-------------|
| File Converter | Convert between image, audio, document, and data formats |
| File Compressor | Create and extract ZIP archives |
| Hash Generator | Compute file hashes (MD5, SHA-1, SHA-256, etc.) |
| Metadata Extractor | Read EXIF and other file metadata |
| Hex Viewer | Inspect raw file bytes in hex |

### Utilities
| Tool | Description |
|------|-------------|
| Time Zone Converter | Visual timeline with overlap finder |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Other package managers

```bash
yarn dev     # yarn
pnpm dev     # pnpm
bun dev      # bun
```

---

## Build

```bash
npm run build
```

Produces a static export in `out/`.

---

## Project Structure

```
app/          — Next.js App Router pages and API routes
components/   — Shared UI components
hooks/        — Custom React hooks
lib/          — Utility functions and clients
public/       — Static assets
types/        — TypeScript type definitions
```

---

## License

Private — all rights reserved.