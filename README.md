# ✨ Vyro Notes

> **Your AI-Powered Study Sanctuary.**
>
> A production-grade AI productivity platform built for serious students — notes, flashcards, quizzes, assignments, exams, PDF workspaces, and a calm survival mode. One workspace. Apple/Linear-quality design. Real spaced repetition. Context-aware AI.

![Built For](https://img.shields.io/badge/Built_For-Students-7c6dfa?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-34c98e?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🌟 Why Vyro Notes?

Vyro Notes is what would happen if **Notion**, **Linear**, **Obsidian**, and **ChatGPT** had a baby — designed specifically for how students actually study.

- ⚡ **One workspace for everything** — no more switching between 10 apps
- 🧠 **AI-powered everywhere** — context-aware summaries, quizzes, study planning
- 🎨 **Apple/Linear-quality UI** — muted palette, subtle motion, zero noise
- 🃏 **Real spaced repetition** — true SM-2 algorithm with 4-button confidence
- 🔗 **Obsidian-style linking** — `[[wikilinks]]`, backlinks, graph view, daily notes
- 🗺️ **Visual thinking** — infinite canvas / mind map with zero dependencies
- ⌨️ **Keyboard-first** — Cmd+K command palette, global shortcuts, slash commands
- 📱 **Native-feeling on mobile** — bottom nav, drawer sidebar, gesture-friendly
- ♿ **Accessible** — keyboard nav, ARIA, focus management, reduced-motion respected

---

## 🚀 Features

### 📝 Smart Notes (Markdown editor)
- Markdown editor with **slash commands** (`/heading`, `/list`, `/todo`, `/code`, `/ai`)
- **`[[WikiLink]]` autocomplete** — type `[[` to fuzzy-search and link any note; auto-inserts `[[Title]]`
- **Selection-aware AI toolbar** — Summarize, Explain, Make question, Translate
- **Backlinks panel** — shows every note that links to the current one, with sentence snippets and folder breadcrumbs
- **Outgoing links panel** — all `[[wikilinks]]` in the current note, resolved to real notes
- **Properties panel** — slide-from-right inspector: created/updated dates, live word count, editable tags, folder picker, linked notes count, copy note ID
- **Focus mode** — distraction-free full-width editing (`F` key)
- **Reading mode** — beautiful serif typography for review
- **Quick Capture** — `Cmd+Shift+N` opens instant note from anywhere
- Auto-save, word count, reading time, pin/archive/trash with restore

### 🔗 Graph View (`/graph`)
Obsidian-style interactive knowledge graph.

- Force-directed layout using `react-force-graph-2d`
- Nodes sized by connection count (more links = bigger node)
- **Subject colour coding** — Math purple, CS orange, Physics blue, etc.
- **Glow halos** on connected nodes; dashed rings on orphans
- **HTML tooltip** on hover — title, subject, connections, last updated
- **Search** with match highlighting and hit count
- **Orphan toggle** — hide/show disconnected notes
- Zoom in / out / fit-to-screen controls
- Zoom-level label rendering (titles appear at > 2.5×)
- Responsive canvas via `ResizeObserver`
- Stat pills: total notes / connections / orphans

### 📅 Daily Notes (`/daily`)
Obsidian-style one-note-per-day journal.

- **Auto-creates** today's note on first visit — no setup needed
- Titles auto-formatted: `"Daily Note — May 29, 2026"`
- Pre-filled with four sections: **🎯 Focus / 📝 Notes / ✅ Tasks / 🔁 Review**
- Auto-tagged `daily`, auto-placed in **Daily Notes** folder (auto-created)
- **14-day calendar strip** — accent dot on days with an existing note; click any day to jump to it
- **Prev / Next navigation** with `←` / `→` keyboard shortcuts
- Future dates blocked
- Live **word count + task progress** (`2/3 tasks`) in footer
- Inline editor with **autosave** — no save button needed
- "Open in full editor" link for markdown preview, backlinks, and AI tools

### 🗺️ Canvas / Mind Map (`/canvas`)
Zero-external-library infinite canvas for visual thinking.

- **Three node types:**
  - 📌 **Note node** — linked to a real VyroNote, shows title + snippet + word count. Double-click or `↗` opens a slide-from-right **note drawer** (no navigation)
  - 💡 **Concept node** — coloured bubble with title and description. Double-click to edit inline
  - 🔤 **Text node** — bare floating label
- **Infinite pan** (drag background) and **smooth wheel zoom** toward cursor
- **SVG cubic-bezier edges** between nodes — click the midpoint `×` to delete
- **Edge drawing** — click the green link button on any node → crosshair mode → click target to connect
- **Live dashed preview** while drawing edges
- **PNG export** — renders current viewport at 2× scale (grid + edges + nodes)
- **`Del` / `⌫`** to delete selected node; **`Esc`** to deselect / cancel linking
- Full **localStorage persistence** via Zustand
- Note picker modal with fuzzy search

### 🃏 Flashcards — SM-2 Spaced Repetition
- **4-button confidence rating**: Again / Hard / Good / Easy
- True **SM-2 algorithm** (`lib/srs.ts`) with ease factor, interval, mastery progression
- **Mistake Review mode** — only cards rated Again/Hard in past 7 days
- **Rapid Fire mode** — 30-second drill
- Animated mastery rings, due-card tracking, review log

### 🎯 AI Quizzes (adaptive)
- Multiple choice with countdown timer
- **Adaptive difficulty** — 3 correct in a row triggers "harder mode"
- **AI explanations** on wrong answers
- Score breakdown with per-question review

### 📋 Assignments (Kanban)
- Drag-and-drop board: To Do → In Progress → Review → Done
- Priority badges, due dates, subject colour-coding

### 📅 Calendar
- Monthly view with colour-coded events (exams, assignments, study sessions)

### 🎓 Exam Survival Mode (1-Hour Before)
- **Calm UI**, **Confidence sliders**, **Emergency Revision Timeline**
- **Breathing reminder** every 15 min
- Quick-fire flashcards inline

### 📄 PDF Workspace (AI textbook)
- Two-pane reader: PDF preview + AI chat panel
- **4 tabs**: Chat / Highlights / Bookmarks / Formulas
- **Page citations** on every AI answer
- **Save as Note** — turn any AI answer into a linked note

### 🍅 Pomodoro Timer
- Circular progress, customizable intervals, daily focus tracking

### 🤖 AI Assistant (contextual)
- **Floating chat bubble** on every page
- **Page-aware suggestions** — on a note: "Summarize this note"; on exam page: "Predict questions"

### 📊 Dashboard
- **Time-aware greeting** with streak inline
- **AI Daily Goals** widget
- **12-week activity heatmap** (GitHub-style)
- **Sparkline trends**, smart exam alerts, recommendations engine

### ⌨️ Command Palette (`Cmd+K`)
- Search across notes, navigate any page, run actions

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` | Command palette |
| `Cmd+N` | New note |
| `Cmd+Shift+N` | Quick capture |
| `Cmd+/` | Toggle sidebar |
| `Cmd+?` | Shortcuts reference |
| `F` | Focus mode (note editor) |
| `G D` | Go to Dashboard |
| `G N` | Go to Notes |
| `G L` | Go to Daily Notes |
| `G G` | Go to Graph View |
| `G V` | Go to Canvas |
| `G F` | Go to Flashcards |
| `G Q` | Go to Quizzes |
| `G A` | Go to Assignments |
| `G C` | Go to Calendar |
| `← →` | Prev / next day (Daily Notes) |
| `Del / ⌫` | Delete selected canvas node |
| `Esc` | Close modals / deselect |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 with custom design tokens |
| **Animations** | Framer Motion v11 — natural easings, route transitions, stagger |
| **State** | Zustand v5 (12 stores) with `localStorage` persistence |
| **Graph** | react-force-graph-2d (Graph View only) |
| **Canvas** | Pure DOM + SVG — zero canvas libraries |
| **Icons** | lucide-react |
| **Toasts** | react-hot-toast |
| **Drag & Drop** | `@dnd-kit/core` + `@dnd-kit/sortable` |
| **Markdown** | react-markdown + remark-gfm |
| **Dates** | date-fns |
| **Spaced Repetition** | Custom SM-2 implementation (`lib/srs.ts`) |
| **Fonts** | Inter (sans), JetBrains Mono (mono) via `next/font` |

---

## 🎨 Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#08080c` | Page background |
| `--bg-surface` | `#101015` | Cards |
| `--bg-elevated` | `#16161e` | Modals, inputs |
| `--accent` | `#7c6dfa` | Muted purple primary |
| `--accent-soft` | `rgba(124,109,250,0.10)` | Soft tinted bg |
| `--text-primary` | `#f0f0f5` | Main text |
| `--text-secondary` | `#9999a8` | Secondary |
| `--text-tertiary` | `#5c5c6e` | Tertiary |
| `--border` | `rgba(255,255,255,0.06)` | Subtle 1px borders |
| `--success` | `#34c98e` | Green |
| `--danger` | `#f04747` | Red |

### CSS Utilities
- `.glass` / `.glass-strong` — Backdrop blur with subtle borders
- `.card-v2` — Standard surface card
- `.btn-primary` / `.btn-ghost` — Solid colour buttons
- `.no-scrollbar` — Hide scrollbar but keep scroll
- `.shimmer` — Skeleton loader animation

---

## 📁 Project Structure

```
VyroNotes/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout + fonts + Toaster
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css                 # Design tokens + utilities
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx              # Sidebar, TopBar, Floating AI, BottomNav
│   │       ├── dashboard/page.tsx
│   │       ├── notes/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx       # Editor + wikilinks + properties + backlinks
│   │       ├── graph/page.tsx          # ★ Knowledge graph
│   │       ├── daily/page.tsx          # ★ Daily notes with calendar strip
│   │       ├── canvas/page.tsx         # ★ Infinite canvas / mind map
│   │       ├── flashcards/page.tsx
│   │       ├── quizzes/page.tsx
│   │       ├── assignments/page.tsx
│   │       ├── calendar/page.tsx
│   │       ├── exams/page.tsx
│   │       ├── exam-mode/page.tsx
│   │       ├── pdf-chat/page.tsx
│   │       ├── revision/page.tsx
│   │       ├── timer/page.tsx
│   │       ├── ai-assistant/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── canvas/
│   │   │   └── CanvasBoard.tsx         # ★ Infinite canvas (DOM + SVG)
│   │   ├── graph/
│   │   │   └── GraphView.tsx           # ★ Force-directed graph
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── ShortcutsModal.tsx
│   │   │   ├── GlobalShortcuts.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── notes/
│   │   │   ├── SlashMenu.tsx
│   │   │   ├── SelectionToolbar.tsx
│   │   │   ├── BacklinksPanel.tsx      # ★ Backlinks + outgoing links
│   │   │   ├── WikiLinkPopover.tsx     # ★ [[wikilink]] autocomplete
│   │   │   ├── PropertiesPanel.tsx     # ★ Metadata inspector panel
│   │   │   └── QuickCapture.tsx
│   │   ├── ai/
│   │   │   └── FloatingAssistant.tsx
│   │   ├── dashboard/
│   │   │   ├── Heatmap.tsx
│   │   │   └── Sparkline.tsx
│   │   └── ThemeBoot.tsx
│   ├── store/
│   │   ├── notes.store.ts              # ★ + getDailyNote, getDailyTitle
│   │   ├── canvas.store.ts             # ★ Canvas nodes, edges, viewport
│   │   ├── flashcards.store.ts
│   │   ├── quizzes.store.ts
│   │   ├── assignments.store.ts
│   │   ├── exams.store.ts
│   │   ├── timer.store.ts
│   │   ├── streak.store.ts
│   │   ├── chat.store.ts
│   │   ├── theme.store.ts
│   │   ├── ui.store.ts
│   │   └── auth.store.ts
│   ├── lib/
│   │   ├── buildGraphData.ts           # ★ Wikilink parser + graph builder
│   │   ├── utils.ts
│   │   ├── types.ts
│   │   ├── dummy-data.ts
│   │   ├── ai-mock.ts
│   │   ├── srs.ts
│   │   ├── animations.ts
│   │   └── recommendations.ts
│   └── hooks/
│       ├── useKeyboardShortcut.ts
│       ├── useAutosave.ts
│       └── useStreak.ts
```

> Files marked ★ were added or significantly upgraded in v1.1.

---

## 🏗️ Architecture Highlights

### Zustand v5 Selector Pattern
```ts
// ❌ BAD — new array every render → infinite re-renders
const notes = useNotesStore((s) => s.notes.filter(n => !n.trashed));

// ✅ GOOD — select raw, derive in useMemo
const allNotes = useNotesStore((s) => s.notes);
const notes    = useMemo(() => allNotes.filter(n => !n.trashed), [allNotes]);
```

### WikiLink Architecture
All three systems share the same `[[Title]]` syntax and stay in sync:
- **Editor** — `WikiLinkPopover` inserts the link; `onContentChange` detects open `[[`
- **BacklinksPanel** — scans all notes for `[[currentTitle]]`, extracts sentence snippets
- **buildGraphData** — parses every note's content with `/\[\[(.+?)\]\]/g` to build edges
- **PropertiesPanel** — counts unique linked note IDs (backlinks + outgoing)
- **Graph View** — renders the edges as force-directed connections

### Canvas (Zero-Library) Architecture
| Concern | Implementation |
|---|---|
| Pan | CSS `translate(x,y)` on the node layer via pointer-capture drag |
| Zoom | CSS `scale(z)` with cursor-toward-zoom math on wheel |
| Node drag | Per-node `pointerdown` delta → `x/y` in store |
| Edges | `<path>` cubic Bézier in `<g>` that mirrors the viewport transform |
| Edge drawing | Click link button → crosshair + live dashed preview → click target |
| PNG export | Off-screen `<canvas>` redraws grid + Bézier edges + rounded-rect nodes at 2× |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### macOS / Linux

```bash
git clone https://github.com/Gaurav06120714/VyroNotes.git
cd VyroNotes
npm install
npm run dev
```

Open **http://localhost:3001**

### Windows

```powershell
git clone https://github.com/Gaurav06120714/VyroNotes.git
cd VyroNotes
npm install
npm run dev
```

Open **http://localhost:3001**

### Other Commands

```bash
npm run build                          # Production build
npm run start                          # Run production build
npm run lint                           # ESLint
npx tsc --noEmit                       # TypeScript check (0 errors)
```

---

## 📊 Routes (22)

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login`, `/register` | Auth |
| `/dashboard` | Command center |
| `/notes` | Notes list with folders + tags |
| `/notes/[id]` | Markdown editor + wikilinks + backlinks + properties |
| `/graph` | ★ Knowledge graph (force-directed) |
| `/daily` | ★ Daily notes with calendar strip |
| `/canvas` | ★ Infinite canvas / mind map |
| `/flashcards` | SM-2 study |
| `/quizzes` | Adaptive quizzes |
| `/assignments` | Kanban board |
| `/calendar` | Monthly view |
| `/exams` | Exam countdowns |
| `/exam-mode` | 1-hour survival mode |
| `/pdf-chat` | AI textbook workspace |
| `/revision` | Revision sheets |
| `/timer` | Pomodoro |
| `/ai-assistant` | Full AI chat |
| `/settings` | Profile + theme + shortcuts |

---

## 🧪 Dummy Data

Realistic seed data persisted to localStorage:
- **12 notes** across Math, Physics, Chemistry, CS, History, Biology (with `[[wikilinks]]` between them)
- **6 folders** including auto-created **Daily Notes**
- **5 flashcard decks** (50+ cards with SRS state)
- **8 quizzes** with real MCQs
- **12 assignments** in various Kanban states
- **6 upcoming exams**, **20 calendar events**, **30 days of streak data**

Reset anytime by clearing localStorage.

---

## 🎯 Roadmap

### ✅ Shipped (v1.0)
- [x] Full note editor with slash commands, focus mode, quick capture
- [x] SM-2 flashcards, adaptive quizzes, Kanban assignments
- [x] Exam Survival Mode, PDF workspace, Pomodoro timer
- [x] Floating AI assistant, command palette, heatmap dashboard
- [x] Dark/light theme, mobile bottom nav + drawer sidebar

### ✅ Shipped (v1.1)
- [x] **`[[WikiLink]]` autocomplete** in note editor
- [x] **Backlinks panel** with sentence snippets and folder breadcrumbs
- [x] **Properties panel** — metadata, tags, folder, note ID copy
- [x] **Graph View** — Obsidian-style force-directed knowledge graph
- [x] **Daily Notes** — auto-creating journal with calendar strip
- [x] **Canvas / Mind Map** — infinite pan/zoom, 3 node types, SVG edges, PNG export
- [x] Full keyboard shortcut coverage for all new routes

### 🔄 In Progress
- [ ] Real OpenAI/Claude API integration
- [ ] Supabase backend (auth, cloud sync)

### 🚀 Planned (v2)
- [ ] Canvas undo/redo
- [ ] Canvas node resize handles
- [ ] WikiLink broken-link highlighting (red underline on unresolved links)
- [ ] Daily Notes month-view calendar picker
- [ ] Graph View: click-to-select vs double-click-to-navigate
- [ ] Collaborative study rooms (real-time)
- [ ] Voice notes (Whisper API)
- [ ] Mobile app (React Native / Expo)

---

## 🐛 Known Caveats

- **All data is local-only** — clearing localStorage wipes everything. Backend sync is roadmap.
- **AI is mocked** — deterministic responses based on intent matching. Plug in OpenAI/Claude API to make it real.
- **PDF parsing is mocked** — the workspace UI ships with a sample calculus chapter.
- **Use npm** — pnpm trips on strict build approval prompts.

---

## 📄 License

MIT © Gaurav

---

**Built with ❤️ by [Gaurav](https://github.com/Gaurav06120714) — for students who care about how they think.**
