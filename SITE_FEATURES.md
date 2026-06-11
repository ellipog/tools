# Site Feature Ideas — runen

> A curated list of site-level features and improvements (not new tools) for runen.no.

---

## 1. Light Mode Toggle

**Type:** UI / Theme
**Effort:** Medium

The current aesthetic is locked to dark mode (`#000000` / `#050505` backgrounds). A light-mode variant would broaden usability for daytime environments while retaining the industrial brutalist character.

**Implementation notes:**
- Use a `<ThemeProvider>` at the layout level
- Persist preference in `localStorage` with a `<CrtToggle>`-style toggle
- Map current CSS values to light counterparts: `bg-black` → `bg-white`, `text-white` → `text-black`, `border-white/10` → `border-black/10`
- CRTToggle should remain independent — CRT scanlines look good on light too
- Consider a third "system" option that reads `prefers-color-scheme`

---

## 2. PWA / Offline Support

**Type:** Infrastructure / UX
**Effort:** High

All tools are fully client-side with no external API dependencies (except HuggingFace ML models for background removal). This makes the site an ideal candidate for progressive web app features.

**Implementation notes:**
- Use `next-pwa` or `@serwist/next` (Next.js 16 compatible) for service worker generation
- Register a service worker that precaches the app shell and all core tool bundles
- Cache strategy: `CacheFirst` for tool JS/CSS, `NetworkFirst` for model files (background removal)
- Add a `manifest.json` with app name "runen", icons, and `display: standalone`
- Show an install prompt banner for returning visitors (with `beforeinstallprompt` event)
- Offline indicator in the navbar when connectivity drops

---

## 3. Tool Chaining / Pipeline

**Type:** UX / Cross-tool
**Effort:** High

Allow users to pipe the output of one tool directly into another. For example: upload an image → resize it → convert to ASCII art → download the result — all without manual file roundtrips.

**Implementation notes:**
- Add a "Send to..." button to each tool's export area
- Maintain a lightweight global state store (`lib/pipeline-store.ts`) that holds the current pipeline data
- Each tool can declare what input/output types it supports (e.g., `{ in: 'image', out: 'text' }`)
- Show a pipeline breadcrumb in the navbar when active
- Compatible tools light up in the sidebar; incompatible ones are dimmed
- Pipeline can be cleared with a "Start over" button

---

## 4. Save/Restore Tool State

**Type:** UX / Persistence
**Effort:** Medium

Currently, refreshing the page resets all tool inputs and configuration. Persisting state across sessions would prevent accidental data loss.

**Implementation notes:**
- Each tool page calls `useToolState(key)` that wraps `useState` + `localStorage` serialization
- Serialize the complete input/output/configuration state as JSON under a `tool:${route}` localStorage key
- On mount, check for saved state and restore with a brief "Restored from last session" toast
- Provide a "Clear state" button per tool and a "Clear all saved data" in settings
- Avoid saving large binary blobs (images, audio) — only store metadata like filename + data URI for small files, else just filename hints

---

## 5. Shareable Output Links

**Type:** UX / Sharing
**Effort:** Medium

Encode the current tool's configuration and input/output into the URL hash so users can bookmark or share specific results.

**Implementation notes:**
- Use `URLSearchParams` / hash fragment to store a compressed representation of tool state
- For text outputs (diff, regex, JSON), store the text directly (gzipped + base64 if large)
- For binary outputs (images, audio), store a reference or use a data URI (practical limit: ~2MB)
- On page load, check for URL hash parameters and auto-restore state
- Add a "Copy sharable link" button alongside the existing ShareButton
- Show a warning if the encoded data exceeds a reasonable size

---

## 6. Mobile-Responsive Layout

**Type:** UI / Responsive
**Effort:** Medium

The current 12-column grid with sidebar controls (`lg:col-span-4`) and main area (`lg:col-span-8`) may not translate well to mobile.

**Implementation notes:**
- On screens < 768px: collapse the controls sidebar into a collapsible drawer (slide up from bottom or a hamburger toggle)
- On screens < 1024px: stack controls above output rather than side-by-side
- Increase touch target sizes for all controls (min 44px)
- Replace horizontal scroll areas with swipeable containers
- Ensure FileDropZone works with touch events (drag-and-drop on mobile requires `onTouchEnd` fallback)
- Test all tools on actual mobile devices

---

## 7. Batch Processing

**Type:** Feature / Multi-file
**Effort:** High

Allow users to process multiple files simultaneously — bulk image conversion, bulk resize, bulk hash generation, etc.

**Implementation notes:**
- Modify FileDropZone to accept multiple files and show a queue
- Run processing in parallel using `Promise.all` with concurrency limit (to avoid browser tab crash)
- Show a progress bar per file and overall progress
- Output a zip archive (using existing jszip dependency) with all results
- Not all tools support batch mode — mark compatible tools with a batch badge
- For tools where batch doesn't make sense (regex tester, diff), disable multi-file drop

---

## 8. Recent Files Panel

**Type:** UX / Persistence
**Effort:** Low-Medium

A sidebar or dropdown showing recently uploaded/processed files across sessions, allowing quick re-upload.

**Implementation notes:**
- Store file metadata (filename, size, type, timestamp, data URI or small files) in localStorage up to a configurable limit (e.g., 10 files, 50MB total)
- Show as a list in a "Recent" flyout panel accessible from the navbar
- Each entry shows filename, file type icon, timestamp, and a "Reuse" button
- "Reuse" restores the file into the current tool's dropzone
- Provide "Clear history" action

---

## 9. Keyboard Shortcuts Cheat Sheet

**Type:** UX / Productivity
**Effort:** Low

A discoverable overlay listing all available keyboard shortcuts for the current tool and globally.

**Implementation notes:**
- Trigger with `?` key (universal shortcut convention) or via navbar icon
- Overlay lists shortcuts grouped by scope: Global, Tool-specific
- Global shortcuts: `Cmd+K` (command palette), `?` (this), `Escape` (close modals), `C` (CRT toggle), `P` (pin tool)
- Tool-specific: registered by each tool page via a `useShortcuts()` hook
- Styled consistently with the brutalist theme — monospace font, minimal borders

---

## 10. Tool Comparison Mode

**Type:** UX / Productivity
**Effort:** High

Open two instances of the same tool side-by-side for comparison — useful for JSON formatter (compare formatted vs minified), diff tool (compare two inputs), or ASCII art (compare color vs monochrome).

**Implementation notes:**
- Add a "Split view" toggle to compatible tools
- Render two independent instances of the tool component, each with its own state
- Use CSS grid `grid-cols-2` with a resizable divider (draggable handle)
- Sync the scroll position of both panes when appropriate
- Not all tools benefit from comparison — gate behind a `supportsComparison: boolean` property

---

## 11. Undo/Redo History

**Type:** UX / Productivity
**Effort:** Medium

Maintain an undo/redo stack for editing tools (pixel art, image resizer/cropper, ASCII art configuration) to allow non-destructive experimentation.

**Implementation notes:**
- Wrap tool state management in a `useHistory()` hook that maintains a stack of previous states
- Stack limit: ~50 entries to avoid memory issues
- `Ctrl+Z` / `Ctrl+Shift+Z` for undo/redo
- Visual indicator showing current position in history (e.g., "Step 3 of 12")
- Clear history on tool reset or file change
- Only needed for tools that have destructive editing — skip for passive tools (hash, metadata)

---

## 12. Homepage Redesign

**Type:** UI / Landing
**Effort:** Medium

The current homepage is minimal. A redesign would improve discoverability of tools and communicate the site's personality immediately.

**Implementation notes:**
- Hero section: "a digital swiss army knife" tagline with scramble text animation
- Tool grid grouped by category (images, text, files, utils) with category headers
- Each tool card shows: name, short description, icon, and a "Recently used" badge if applicable
- Search bar at the top (already have Cmd+K, but a visible one helps new visitors)
- Pinned/favorite tools section at the very top
- Feature request button visible in the footer
- CRT toggle in the top-right corner
- Lazy-load offscreen tool cards for performance

---

## 13. Sound Effects Toggle

**Type:** UX / Atmosphere
**Effort:** Low

Optional retro UI sound effects — clicks, beeps, and whirs — that match the CRT industrial aesthetic.

**Implementation notes:**
- Generate sounds programmatically with the Web Audio API (no audio file downloads needed)
- Sounds: button click (short click), toggle switch (click-click), export complete (ascending tone), error (descending buzz), file drop (thud)
- Toggle in navbar alongside CRT toggle with a speaker icon
- Disabled by default; on first enable, show a brief demo
- Store preference in localStorage
- Use a global `SoundProvider` context with a `play(type)` method

---

## 14. Theme Customization

**Type:** UI / Personalization
**Effort:** Medium

Let users fine-tune the aesthetic beyond just dark/light — accent colors, CRT intensity, scanline opacity, font size.

**Implementation notes:**
- Settings panel accessible from navbar (gear icon or via command palette)
- Adjustable parameters:
  - Accent color (default: white, options: a curated palette of 8-10 colors)
  - CRT scanline opacity (0-100% slider)
  - CRT flicker intensity (none, subtle, full)
  - Font size scale (90%, 100%, 110%, 125%)
  - Border style (solid, dashed, double, none)
- Store all preferences in a single `localStorage` key as a JSON object
- Apply as CSS custom properties on `:root` or `<html>` element
- Provide "Reset to defaults" button
- Export/import theme as JSON

---

## 15. Export History Log

**Type:** UX / Persistence
**Effort:** Low

A sidebar panel or modal that logs every export/download the user has performed in the current session, with re-download capability.

**Implementation notes:**
- Each export action pushes an entry to an in-memory array + `sessionStorage`: `{ id, tool, filename, format, timestamp, blob }`
- Show the log in a slide-out panel (clock icon in navbar)
- Entries show tool name, filename, format badge, timestamp, and file size
- Click re-downloads the original blob
- "Clear log" button clears sessionStorage
- Limit to ~25 entries to avoid memory bloat; older entries roll off
- Blobs are held in memory only during session — no localStorage for binary data

---

## 16. Contextual Help / Tooltips

**Type:** UX / Onboarding
**Effort:** Low-Medium

Explain what each control, slider, and toggle does with short tooltips or inline help text.

**Implementation notes:**
- Use the existing `title` attribute as a fallback, but implement a proper tooltip component for richer content
- Each tool can define help text per control via a `help` property
- Tooltip appears on hover (desktop) or tap (mobile), with a 300ms delay
- Content is concise: 1-2 sentences max
- Optionally, a "Help mode" toggle that makes all tooltips persistent
- Keyboard: `Shift+H` to toggle help mode

---

## 17. Performance Mode

**Type:** UX / Accessibility
**Effort:** Low

A toggle that disables animations, CRT effects, and other visual flourishes for a snappier experience, especially useful on low-power devices or for users who prefer simplicity.

**Implementation notes:**
- Single toggle in navbar: bolt icon
- When enabled:
  - Disable Framer Motion animations (`motion.div` → `div`)
  - Remove CRT overlay entirely
  - Disable scramble text animation
  - Remove any CSS transitions
  - Skip parallax or hover effects
- Store preference in localStorage
- Can be combined with any theme/CRT setting (overrides them)

---

## 18. Customizable Tool Grid

**Type:** UX / Personalization
**Effort:** Medium-High

Allow users to reorder, hide, and group tools on the homepage according to their preferences.

**Implementation notes:**
- Drag-and-drop reordering of tool cards on the homepage (using `@dnd-kit/core` or similar)
- "Hide tool" option on each card (unhide via a "Hidden tools" section at the bottom)
- Create custom groups/labels (e.g., "My favorites", "Work tools", "Fun")
- Store layout configuration in localStorage as a serialized tree
- "Reset layout" button in settings

---

## 19. Multi-Tab / Session Support

**Type:** UX / Productivity
**Effort:** High

Allow running multiple tools simultaneously within the same browser tab, similar to browser tabs within the app.

**Implementation notes:**
- Tab bar at the top of the content area, below the navbar
- Each tab corresponds to an open tool with its own state
- Tabs are draggable to reorder
- A "+" button opens a tool selector modal (filtered list of all tools)
- Close tab with an `×` button
- Store open tabs and their states in `sessionStorage`
- Limit to 5-8 concurrent tabs to avoid performance degradation
- Tab bar shows a favicon-like icon + tool name (truncated)

---

## 20. Onboarding Tour

**Type:** UX / First-time
**Effort:** Medium

A guided tour for first-time visitors that highlights key features: command palette, CRT toggle, pin system, drag-and-drop, and how to naviage tools.

**Implementation notes:**
- Check `localStorage` for `onboardingComplete` flag
- If not set, show a series of tooltip-style popovers (3-5 steps)
- Steps highlight: Navbar breadcrumb, Command Palette (Cmd+K), CRT toggle, a specific tool page, Pin Star
- Use a simple stepper with "Next" / "Skip all" buttons
- Overlay background to focus attention on the highlighted element
- Can be re-triggered from settings

---

## 21. Per-Tool Quick Settings

**Type:** UX / Efficiency
**Effort:** Low

Save and load named presets/ configurations per tool (e.g., "JPEG @ 80% quality" for the converter, "Email regex" for regex tester, "APA book citation" for references).

**Implementation notes:**
- Add a "Presets" button to each tool's sidebar
- "Save current config as preset..." dialog with name input
- Preset list shows saved presets with load/delete actions
- Store as JSON in `localStorage` under `presets:${route}`
- Ship a few built-in presets per tool as defaults
- Presets are independent of input data — only capture control settings

---

## 22. Image Gallery / Library

**Type:** Feature / Content
**Effort:** Medium

A persistent library of uploaded and generated images, accessible across all image tools. Users can upload once and use the same image in multiple tools.

**Implementation notes:**
- Gallery panel accessible from any image tool
- Thumbnails in a scrollable grid (with lazy loading)
- Click an image to load it into the current tool's dropzone
- Actions: delete, rename, download
- Store images as data URIs in `IndexedDB` (more space than localStorage)
- Show total storage used with a warning when approaching limits (~50MB to 100MB)

---

## 23. User-Defined Pipelines / Workflows

**Type:** Feature / Automation
**Effort:** Very High

Let users create, save, and run multi-step workflows that chain several tools together with defined parameters — e.g., "Upload image → Resize to 800px → Convert to ASCII → Download text."

**Implementation notes:**
- Visual pipeline builder: nodes (tools) connected by edges (data flow)
- Each node has configurable parameters (shown as a mini version of the tool's controls)
- Pipeline steps run sequentially, with progress indicators
- Save/load pipelines from localStorage
- Share pipelines as JSON export/import
- This is a significant feature — consider as a Phase 2 after tool chaining (feature #3) is stable

---

## 24. Accessibility (a11y) Audit & Improvements

**Type:** Infrastructure / Quality
**Effort:** Medium

Ensure the site meets WCAG 2.1 AA standards for screen readers, keyboard navigation, color contrast, and reduced motion.

**Implementation notes:**
- Run automated audit with axe-core or Lighthouse
- Fix issues:
  - Add `aria-label` / `aria-describedby` to all controls
  - Ensure proper heading hierarchy (`h1` → `h6`)
  - Add `role` attributes to interactive elements
  - Ensure all form controls have associated labels
  - Add skip-to-content link
  - Ensure keyboard focus indicators are visible (focus ring)
- Test with actual screen readers (NVDA, VoiceOver)
- Respect `prefers-reduced-motion` — disable all animations
- Respect `prefers-color-scheme` for theme detection
- Add `lang` attribute and page titles

---

## 25. Analytics Dashboard (Privacy-First)

**Type:** Admin / Insight
**Effort:** Low-Medium

A lightweight, privacy-respecting analytics system to understand which tools are most used, without sending data to third parties.

**Implementation notes:**
- No Google Analytics or third-party trackers
- Send lightweight pageview + tool interaction events to a server endpoint (`/api/analytics`)
- Events are anonymous: tool route, action type (view/use/export), no IP, no user agent, no cookies
- Store in a local file or simple database on the server
- Admin dashboard (behind a simple auth gate, or just local-only) showing:
  - Total pageviews per tool (bar chart)
  - Export count per tool
  - Session duration estimates
  - Most popular tool combos (which tool is visited after which)
- Clearly document the privacy policy: no tracking, no cookies, no personal data

---

## 26. Comparison with Prior Art

**Type:** UX / Utility
**Effort:** Low

When viewing any tool's output, show a side-by-side "before and after" or "input vs output" comparison, especially useful for converters, compressors, and ASCII art.

**Implementation notes:**
- For tools with visual outputs: split view with original on left, result on right
- For tools with text outputs: show input vs output with diff-style highlighting
- Slider control to drag between before/after (like a scrubber)
- Only show when there is a meaningful comparison to make
- Toggle on/off

---

## 27. API / Embed Mode

**Type:** Infrastructure / Developer
**Effort:** High

Expose certain tools as simple GET/POST API endpoints or embeddable widgets for other sites.

**Implementation notes:**
- Start with the most algorithmic tools: JSON formatter, hash generator, regex tester, diff
- API endpoints under `/api/v1/tools/:toolName`
- Support both GET (with query params) and POST (with body)
- Return JSON results
- Rate limiting to prevent abuse
- Simple API key system or just open access with rate limits
- Document API in a `/docs` section
- Embed mode: `https://runen.no/embed/:toolName` as a lightweight iframe-friendly page

---

## 28. Notification System

**Type:** UX / Feedback
**Effort:** Low

A unified toast/notification system for success, error, and info messages, replacing ad-hoc alerts and inline messages.

**Implementation notes:**
- Global `<ToastContainer>` component at the layout level
- `useToast()` hook with methods: `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`
- Position: top-right (or bottom-center on mobile)
- Auto-dismiss: success/info after 3s, error persists until dismissed
- Stacked notifications (max 3 visible)
- Styled consistently with the brutalist theme: bordered, monospace
- Accessible: uses `role="alert"` and `aria-live="polite"`

---

## 29. File Preview Before Processing

**Type:** UX / Feedback
**Effort:** Low-Medium

After dropping a file but before the tool processes it, show a preview with file details (name, size, type, dimensions for images, duration for audio) and a confirm button.

**Implementation notes:**
- Intercept the file in FileDropZone before passing to the tool
- Show a modal or inline preview card with file info and a thumbnail (for images)
- "Cancel" and "Process" buttons
- Useful for converters, metadata, hash, compressor — so users confirm they selected the right file
- Make it skippable for power users who prefer direct processing

---

## 30. Collaborative / Share Sessions

**Type:** UX / Multi-user
**Effort:** Very High

Allow users to share a live session link so others can see and interact with the same tool state in real time.

**Implementation notes:**
- Use WebRTC (or a lightweight WebSocket server) for peer-to-peer state sync
- Generate a shareable session ID/URL
- State changes (file upload, config change, output) sync to other participants
- Participants see cursor indicators and a participant list
- Chat panel for discussing the output
- Large files sync as a reference rather than transferring the full blob (upload once, share reference)
- This is a major feature — consider feasibility and necessity carefully