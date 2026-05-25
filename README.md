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

Vyro Notes is what would happen if **Notion**, **Linear**, **Apple Notes**, and **ChatGPT** had a baby — designed specifically for how students actually study.

- ⚡ **One workspace for everything** — no more switching between 10 apps
- 🧠 **AI-powered everywhere** — context-aware summaries, quizzes, study planning
- 🎨 **Apple/Linear-quality UI** — muted palette, subtle motion, zero noise
- 🃏 **Real spaced repetition** — true SM-2 algorithm with 4-button confidence
- ⌨️ **Keyboard-first** — Cmd+K command palette, global shortcuts, slash commands
- 📱 **Native-feeling on mobile** — bottom nav, drawer sidebar, gesture-friendly
- ♿ **Accessible** — keyboard nav, ARIA, focus management, reduced-motion respected

---

## 🚀 Features

### 📝 Smart Notes (block-based editor)
- Markdown editor with **slash commands** (`/heading`, `/list`, `/todo`, `/code`, `/ai`)
- **Selection-aware AI toolbar** — Summarize, Explain, Make question, Translate
- **Backlinks panel** — `[[Note Title]]` syntax creates bi-directional links
- **Focus mode** — distraction-free full-width editing (F key)
- **Reading mode** — beautiful serif typography for review
- **Quick Capture** — `Cmd+Shift+N` opens instant note from anywhere
- Auto-save, word count, reading time, pin/archive/trash with restore
- Note templates (Cornell, Bullet journal, Study guide)

### 🃏 Flashcards — SM-2 Spaced Repetition
- **4-button confidence rating**: Again (red) / Hard (orange) / Good (green) / Easy (blue)
- True **SM-2 algorithm** (`lib/srs.ts`) with ease factor, interval, mastery progression
- **Mistake Review mode** — only cards rated Again/Hard in past 7 days
- **Rapid Fire mode** — 30-second drill, how many can you mark correct?
- Animated mastery rings, due-card tracking, review log
- Per-deck analytics with retention rate and session summaries

### 🎯 AI Quizzes (adaptive)
- Multiple choice with countdown timer
- **Adaptive difficulty** — 3 correct in a row triggers "harder mode"
- **AI explanations** on wrong answers (auto-shown)
- Score breakdown with per-question review
- AI-generated quizzes from any note

### 📋 Assignments (Kanban)
- Drag-and-drop board: To Do → In Progress → Review → Done
- `@dnd-kit` with smooth animations
- Priority badges, due dates, subject color-coding
- Filter by subject

### 📅 Calendar
- Monthly view with color-coded events
- Exams (red), assignments (orange), study sessions (blue)
- Add events from any day

### 🎓 Exam Survival Mode (1-Hour Before)
- **Calm UI** — dim accent, large readable text
- **Confidence sliders** per concept (weakest auto-prioritized)
- **Emergency Revision Timeline** (T-60 → T-40 → T-30 → T-20 → T-10 → T-0)
- **Breathing reminder** every 15 min
- High-yield concept surfacing with weight tags (high/medium/low)
- Quick-fire flashcards inline

### 📄 PDF Workspace (AI textbook)
- Two-pane reader: PDF preview + AI chat panel
- **4 tabs**: Chat / Highlights / Bookmarks / Formulas
- **Page citations** on every AI answer (click to jump)
- **Auto formula extraction** panel
- **Save as Note** — turn any AI answer into a linked note
- Suggested questions, highlight search

### 🍅 Pomodoro Timer
- Circular progress visualization
- Customizable focus/break intervals
- Link to current task or note
- Daily focus time tracking, session history

### 🤖 AI Assistant (contextual)
- **Floating chat bubble** on every app page
- **Page-aware suggestions** — on a note: "Summarize this note", on exam page: "Predict questions"
- Memory-aware responses (session-scoped)
- Quick prompts: study plan, daily goals, exam prep
- Full-page chat at `/ai-assistant`

### 📊 Dashboard (Command Center)
- **Time-aware greeting** with streak inline
- **AI Daily Goals** widget — 3 personalized tasks for today
- **12-week activity heatmap** (GitHub-style)
- **Sparkline trends** on each stat card
- **Smart exam alerts** (only when < 14 days)
- **Recommendations engine** — rules-based personalized cards
- Due-soon panel, focus session quick-start

### 🔥 Streak Tracking
- Daily activity = +1 streak
- 12-week heatmap visualization
- Current + longest streak in sidebar

### 🌗 Theme System
- Dark / light mode toggle (persisted)
- Subtle palette, grain texture, single soft blob

### ⚙️ Settings
- Profile, theme, notification prefs, shortcuts reference

### ⌨️ Command Palette (`Cmd+K`)
- Search across notes
- Navigate any page (`G then D`, `G then N`, etc.)
- Run actions (new note, start timer, toggle theme)
- Quick AI prompt entry

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` | Command palette |
| `Cmd+N` | New note |
| `Cmd+Shift+N` | Quick capture |
| `Cmd+/` | Toggle sidebar |
| `Cmd+?` | Shortcuts reference |
| `F` | Focus mode (in note editor) |
| `G then D` | Go to dashboard |
| `G then N` | Notes |
| `Esc` | Close modals |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 with custom design tokens |
| **Components** | shadcn/ui (Radix primitives) |
| **Animations** | Framer Motion v11 — natural easings, route transitions, stagger |
| **State** | Zustand v5 (11 stores) with `localStorage` persistence |
| **Icons** | lucide-react |
| **Toasts** | react-hot-toast |
| **Drag & Drop** | `@dnd-kit/core` + `@dnd-kit/sortable` |
| **Markdown** | react-markdown + remark-gfm |
| **Dates** | date-fns |
| **Spaced Repetition** | Custom SM-2 implementation (`lib/srs.ts`) |
| **Fonts** | Inter (sans), JetBrains Mono (mono) — via `next/font` |

---

## 🎨 Design System

### Color Palette — Calm, Mature, Apple/Linear-inspired

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#08080c` | Page background |
| `--bg-surface` | `#101015` | Cards |
| `--bg-elevated` | `#16161e` | Modals, inputs |
| `--bg-glass` | `rgba(16,16,21,0.72)` | Glass overlays |
| `--accent` | `#7c6dfa` | Muted purple primary |
| `--accent-soft` | `rgba(124,109,250,0.10)` | Soft tinted bg |
| `--text-primary` | `#f0f0f5` | Main text |
| `--text-secondary` | `#9999a8` | Secondary |
| `--text-tertiary` | `#5c5c6e` | Tertiary |
| `--border` | `rgba(255,255,255,0.06)` | Subtle 1px borders |
| `--success` | `#34c98e` | Green |
| `--warning` | `#f59e0b` | Orange |
| `--danger` | `#f04747` | Red |

### Radius scale
`--radius-sm: 8px` · `--radius-md: 12px` · `--radius-lg: 16px` · `--radius-xl: 20px`

### Typography scale (tight, refined)
`11 / 13 / 14 / 15 / 17 / 20 / 24 / 32 / 44px`

### CSS utilities
- `.glass` / `.glass-strong` — Backdrop blur with subtle borders
- `.card-v2` — Standard surface card (no gradients)
- `.btn-primary` / `.btn-ghost` — Solid color buttons with subtle shadow
- `.hover-lift` — `translateY(-1px)` on hover
- `.gradient-text` — Restrained 2-color gradient (purple → blue only)
- `.mesh-bg` — Single soft blob (used sparingly)
- `.shimmer` — Skeleton loader animation
- `.divider` — Subtle 1px separator

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
│   │       ├── dashboard/page.tsx      # Command center
│   │       ├── notes/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx       # Editor with slash/focus modes
│   │       ├── flashcards/page.tsx     # SM-2 + 4-btn rating
│   │       ├── quizzes/page.tsx        # Adaptive + AI explanations
│   │       ├── assignments/page.tsx    # Kanban
│   │       ├── calendar/page.tsx
│   │       ├── exams/page.tsx
│   │       ├── exam-mode/page.tsx      # Survival mode
│   │       ├── pdf-chat/page.tsx       # AI textbook workspace
│   │       ├── revision/page.tsx
│   │       ├── timer/page.tsx
│   │       ├── ai-assistant/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── ui/                         # shadcn primitives
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             # Drawer on mobile
│   │   │   ├── TopBar.tsx
│   │   │   ├── BottomNav.tsx           # Mobile bottom nav
│   │   │   ├── CommandPalette.tsx      # Cmd+K
│   │   │   ├── ShortcutsModal.tsx
│   │   │   ├── GlobalShortcuts.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── dashboard/
│   │   │   ├── Heatmap.tsx             # 12-week activity grid
│   │   │   └── Sparkline.tsx
│   │   ├── notes/
│   │   │   ├── SlashMenu.tsx           # /command menu
│   │   │   ├── SelectionToolbar.tsx    # AI selection actions
│   │   │   ├── BacklinksPanel.tsx      # [[wiki]] backlinks
│   │   │   └── QuickCapture.tsx        # Cmd+Shift+N
│   │   ├── ai/
│   │   │   └── FloatingAssistant.tsx   # Floating chat bubble
│   │   ├── streak/
│   │   │   └── StreakCard.tsx
│   │   └── ThemeBoot.tsx               # data-theme attribute injection
│   ├── store/                          # Zustand stores (11)
│   │   ├── auth.store.ts
│   │   ├── notes.store.ts
│   │   ├── flashcards.store.ts         # + SRS rateCard, review log
│   │   ├── quizzes.store.ts
│   │   ├── assignments.store.ts
│   │   ├── exams.store.ts
│   │   ├── timer.store.ts
│   │   ├── streak.store.ts
│   │   ├── chat.store.ts               # AI memory + context
│   │   ├── theme.store.ts
│   │   └── ui.store.ts
│   ├── lib/
│   │   ├── utils.ts                    # cn(), formatters
│   │   ├── types.ts                    # Shared TypeScript types
│   │   ├── dummy-data.ts               # Realistic seed data
│   │   ├── ai-mock.ts                  # Context-aware mock AI
│   │   ├── srs.ts                      # SM-2 spaced repetition
│   │   ├── animations.ts               # Reusable Framer variants
│   │   └── recommendations.ts          # Rules-based engine
│   └── hooks/
│       ├── useKeyboardShortcut.ts
│       ├── useAutosave.ts
│       └── useStreak.ts
├── public/
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts                      # allowedDevOrigins for LAN
├── tsconfig.json
└── package.json                        # pnpm.onlyBuiltDependencies set
```

---

## 🏗️ Architecture Highlights

### State Management
- **Zustand v5** with `persist` middleware to localStorage
- **Always use selectors** with primitives — never return `.filter()`/`.map()` results directly (causes React 19 infinite loops)
- Filter/map inside `useMemo` instead

```ts
// ❌ BAD — new array every render → infinite loop
const notes = useNotesStore((s) => s.notes.filter(n => !n.trashed));

// ✅ GOOD — select raw, memo derive
const allNotes = useNotesStore((s) => s.notes);
const notes = useMemo(() => allNotes.filter(n => !n.trashed), [allNotes]);
```

### Animations (Framer Motion v11)
- Centralized variants in `lib/animations.ts`
- Natural easing: `[0.22, 1, 0.36, 1]` (Apple-style cubic-bezier)
- Route transitions via `AnimatePresence mode="wait"` + `key={pathname}`
- `prefers-reduced-motion` respected globally

### Mobile-First
- Bottom nav (5 items) only on `md:hidden`
- Sidebar becomes drawer on mobile (smooth slide-in)
- `safe-area-inset-bottom` for notch devices
- 44px minimum touch targets

### Accessibility
- Skip-to-content link (visible on focus)
- Semantic landmarks (`<main role="main">`, `<nav>`, `<aside>`)
- ARIA labels on all icon-only buttons
- Visible focus rings on all interactive elements
- Keyboard shortcuts documented in-app (`Cmd+?`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm (recommended) or pnpm
- [Vyro Browser](https://github.com/Gaurav06120714/VyroBrowser) *(optional — auto-opens the app)*

---

### macOS

```bash
git clone https://github.com/Gaurav06120714/VyroNotes.git
cd VyroNotes
npm install

# Start dev server (opens in default browser)
npm run dev

# Start dev server + auto-open in Vyro Browser
npm run dev:vyro
```

Open **http://localhost:3001** in your browser, or let `dev:vyro` handle it automatically.

---

### Windows

```powershell
git clone https://github.com/Gaurav06120714/VyroNotes.git
cd VyroNotes
npm install

# Start dev server (opens in default browser)
npm run dev

# Start dev server + auto-open in Vyro Browser
npm run dev:vyro:win
```

Open **http://localhost:3001** in your browser, or let `dev:vyro:win` handle it automatically.

---

> 💡 **Vyro Browser** auto-connects if installed at `C:\Users\<you>\AppData\Local\Programs\Vyro\Vyro.exe` (Windows) or `/Applications/Vyro.app` (macOS). Falls back to default browser if not found.

### If you must use pnpm

The `package.json` includes `pnpm.onlyBuiltDependencies` for `sharp`, `unrs-resolver`, and `@tailwindcss/oxide` so future installs auto-approve. If you still hit the prompt, run:

```bash
pnpm approve-builds
# Press space on sharp, unrs-resolver, @tailwindcss/oxide → enter
```

### Other Commands

```bash
npm run build         # Production build (Turbopack)
npm run start         # Run production build
npm run lint          # ESLint
./node_modules/.bin/tsc --noEmit  # TypeScript check
```

---

## 📊 Routes (19)

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login`, `/register` | Auth |
| `/dashboard` | Command center with heatmap, AI goals, recs |
| `/notes` | Notes list with folders + tags |
| `/notes/[id]` | Markdown editor + slash menu + focus mode |
| `/flashcards` | SM-2 study with 4-button rating |
| `/quizzes` | Adaptive quizzes with AI explanations |
| `/assignments` | Kanban board |
| `/calendar` | Monthly view |
| `/exams` | Countdowns + prep |
| `/exam-mode` | 1-hour survival mode |
| `/pdf-chat` | AI textbook workspace |
| `/revision` | Quick revision sheets |
| `/timer` | Pomodoro |
| `/ai-assistant` | Full chat |
| `/settings` | Profile + theme + shortcuts |

---

## 🧪 Dummy Data

The app ships with realistic seed data persisted to localStorage:
- **12 notes** across Math, Physics, Chemistry, CS, History, Biology
- **6 folders** + **15 tags**
- **5 flashcard decks** (50+ cards with SRS state)
- **8 quizzes** with real MCQs
- **12 assignments** in various Kanban states
- **6 upcoming exams**
- **20 calendar events**
- **30 days of streak data**

Reset anytime by clearing localStorage.

---

## 🎯 Roadmap

### ✅ Production Ready (v1.0 — current)
- [x] Landing, auth, dashboard
- [x] Notes editor with slash commands + focus mode + backlinks + quick capture
- [x] Flashcards with full SM-2 SRS + 4-button confidence
- [x] Quizzes with adaptive difficulty + AI explanations
- [x] Kanban assignments (drag-drop)
- [x] Calendar with events
- [x] Exam Survival Mode (timeline, confidence sliders, breathing reminders)
- [x] PDF Workspace (4-tab AI textbook)
- [x] Pomodoro timer
- [x] Floating AI assistant (context-aware)
- [x] Command palette (Cmd+K) + quick capture (Cmd+Shift+N)
- [x] Dark/light theme toggle
- [x] 12-week activity heatmap
- [x] Mobile bottom nav + drawer sidebar
- [x] Skip-to-content + ARIA + reduced-motion
- [x] Zustand stores with localStorage persistence
- [x] Route transitions with Framer Motion v11

### 🔄 In Progress
- [ ] Real OpenAI/Claude API integration
- [ ] Supabase backend (auth, cloud sync)
- [ ] Real PDF parsing (pdf-parse)

### 🚀 Planned (v2)
- [ ] Collaborative study rooms (real-time editing)
- [ ] AI-generated study schedules
- [ ] Voice notes (Whisper API)
- [ ] Browser extension for clipping
- [ ] Calendar integrations (Google, Outlook)
- [ ] Notion import / export
- [ ] Mobile app (React Native / Expo)

---

## 💡 Key Wins

| Aspect | Before | After |
|---|---|---|
| **Design feel** | Template-like, neon | Apple/Linear quality, muted |
| **Gradients** | Everywhere (cards, icons, bg) | Restrained to hero CTA + text |
| **Flashcards** | Knew/Didn't know toggle | Full SM-2 SRS + 4-button |
| **Quizzes** | Static MCQ | Adaptive + AI explanations |
| **Dashboard** | Static stats | Heatmap + AI goals + recs |
| **Mobile** | Sidebar shrinks awkwardly | Native-feeling bottom nav |
| **Exam mode** | Tip cards | Survival mode + timeline + confidence |
| **PDF chat** | Plain Q&A | 4-tab workspace with citations |
| **AI** | Generic responses | Page-aware context |

---

## 🐛 Known Caveats

- **Use npm** — pnpm trips on strict build approval prompts (config exists but pnpm's flag parsing is finicky).
- **All data is local-only** — clearing localStorage wipes everything. Backend sync is roadmap.
- **AI is mocked** — deterministic responses based on intent matching. Plug in OpenAI/Claude API to make it real.
- **PDF parsing is mocked** — the workspace UI ships with a sample calculus chapter.

---

## 📄 License

MIT © Gaurav

---

## 🙏 Acknowledgments

- **Notion** — proving notes can be beautiful
- **Linear** — showing how fast UIs should feel
- **Apple Notes** — typography & restraint
- **shadcn/ui** — Radix-based primitives
- **lucide.dev** — icons that don't try too hard

---

**Built with ❤️ by [Gaurav](https://github.com/Gaurav06120714) — for students who care about how they think.**
