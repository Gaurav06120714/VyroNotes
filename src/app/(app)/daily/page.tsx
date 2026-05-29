"use client";

/**
 * Daily Notes page  —  /daily
 *
 * Features
 * ────────
 * • Opens (or auto-creates) today's daily note on mount.
 * • Prev / Next day navigation with keyboard support (← →).
 * • Calendar strip — shows the last 14 days; days that already have
 *   a daily note show an accent dot.  Clicking any day navigates to it.
 * • Full-featured inline editor: title read-only, content editable,
 *   autosave via useAutosave, live word-count / reading-time in footer.
 * • "Open in editor" button navigates to /notes/[id] for the full editor.
 */

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link                       from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Save,
  BookOpen,
  CheckSquare,
  Star,
  AlignLeft,
  Calendar,
} from "lucide-react";
import { useNotesStore }   from "@/store/notes.store";
import { useAutosave }     from "@/hooks/useAutosave";
import { wordCount, readingTime, cn } from "@/lib/utils";
import { stagger, staggerItem, fadeUp, fadeUpTransition } from "@/lib/animations";
import type { Note } from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns a Date representing midnight local time for `date`. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "May 29, 2026" */
function fmtLong(d: Date): string {
  return d.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** "Thu" */
function fmtWeekday(d: Date): string {
  return d.toLocaleString("en-US", { weekday: "short" });
}

/** "29" */
function fmtDayNum(d: Date): string {
  return String(d.getDate());
}

/** "May" */
function fmtMonthShort(d: Date): string {
  return d.toLocaleString("en-US", { month: "short" });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

// ── CalendarStrip ──────────────────────────────────────────────────────────────

interface CalendarStripProps {
  activeDate:   Date;
  onSelectDate: (d: Date) => void;
  noteSet:      Set<string>; // set of YYYY-MM-DD keys that have daily notes
}

function CalendarStrip({ activeDate, onSelectDate, noteSet }: CalendarStripProps) {
  // Build last 14 days (oldest → newest)
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      return d;
    });
  }, []);

  const stripRef = useRef<HTMLDivElement>(null);

  // Scroll active day into view on mount / change
  useEffect(() => {
    const el = stripRef.current?.querySelector("[data-active='true']");
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [activeDate]);

  return (
    <div
      ref={stripRef}
      className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5"
    >
      {days.map((d) => {
        const key     = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const active  = isSameDay(d, activeDate);
        const hasNote = noteSet.has(key);
        const today   = isSameDay(d, new Date());

        return (
          <button
            key={key}
            data-active={active}
            onClick={() => onSelectDate(d)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl shrink-0 transition-colors min-w-[46px]",
              active
                ? "text-white"
                : "text-text-secondary hover:bg-bg-elevated"
            )}
            style={
              active
                ? { background: "var(--accent)" }
                : today
                ? { background: "var(--bg-elevated)", border: "1px solid var(--accent)" }
                : undefined
            }
          >
            <span className="text-[10px] font-medium opacity-80 leading-none">
              {fmtWeekday(d)}
            </span>
            <span className="text-[15px] font-bold leading-none tabular-nums">
              {fmtDayNum(d)}
            </span>
            <span className="text-[9px] opacity-60 leading-none">
              {fmtMonthShort(d)}
            </span>
            {/* Dot for existing note */}
            <span
              className="w-1 h-1 rounded-full mt-0.5 transition-opacity"
              style={{
                background: active ? "rgba(255,255,255,0.7)" : "var(--accent)",
                opacity:    hasNote ? 1 : 0,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

// ── Section stats row ──────────────────────────────────────────────────────────

function SectionStats({ content }: { content: string }) {
  const words   = useMemo(() => wordCount(content),   [content]);
  const minutes = useMemo(() => readingTime(content), [content]);

  // Count completed vs total checkbox tasks
  const totalTasks     = (content.match(/- \[[ x]\]/g) || []).length;
  const completedTasks = (content.match(/- \[x\]/g) || []).length;

  return (
    <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
      <span className="flex items-center gap-1">
        <AlignLeft className="w-3 h-3" />
        {words} words · {minutes} min read
      </span>
      {totalTasks > 0 && (
        <span className="flex items-center gap-1">
          <CheckSquare className="w-3 h-3" />
          {completedTasks}/{totalTasks} tasks
        </span>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DailyPage() {
  const notes      = useNotesStore((s) => s.notes);
  const updateNote = useNotesStore((s) => s.updateNote);

  const [activeDate, setActiveDate] = useState<Date>(() => startOfDay(new Date()));
  const [note,       setNote]       = useState<Note | null>(null);
  const [content,    setContent]    = useState("");

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // ── Load (or create) the daily note whenever activeDate changes ────────────
  // Access store actions directly (stable references — no re-render on change).
  useEffect(() => {
    const { getDailyNote } = useNotesStore.getState();
    const n = getDailyNote(activeDate);
    setNote(n);
    setContent(n.content);
  }, [activeDate]);

  // ── Autosave ───────────────────────────────────────────────────────────────
  const status = useAutosave(
    { content },
    (v) => {
      if (note) updateNote(note.id, { content: v.content });
    },
    1200
  );

  // ── Build set of days that have a daily note (for CalendarStrip dots) ─────
  const noteSet = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    for (const n of notes) {
      if (n.trashed || !n.tags.includes("daily")) continue;
      // Extract date from title "Daily Note — Month Day, Year"
      const m = n.title.match(/Daily Note — (.+)/);
      if (!m) continue;
      const parsed = new Date(m[1]);
      if (isNaN(parsed.getTime())) continue;
      const k = `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,"0")}-${String(parsed.getDate()).padStart(2,"0")}`;
      set.add(k);
    }
    return set;
  }, [notes]);

  // ── Day navigation ─────────────────────────────────────────────────────────
  const goToPrev = useCallback(() => {
    setActiveDate((d) => {
      const prev = new Date(d);
      prev.setDate(d.getDate() - 1);
      return prev;
    });
  }, []);

  const goToNext = useCallback(() => {
    setActiveDate((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      return next;
    });
  }, []);

  const isToday  = isSameDay(activeDate, new Date());
  const isFuture = activeDate > startOfDay(new Date());

  // Keyboard ← → navigation (only when not focused in textarea)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((document.activeElement as HTMLElement | null)?.tagName === "TEXTAREA") return;
      if ((document.activeElement as HTMLElement | null)?.tagName === "INPUT")    return;
      if (e.key === "ArrowLeft")  goToPrev();
      if (e.key === "ArrowRight" && !isFuture) goToNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToPrev, goToNext, isFuture]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="max-w-3xl mx-auto flex flex-col gap-5"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} transition={fadeUpTransition}>
        <div className="flex items-center gap-2 mb-0.5">
          <CalendarDays className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} />
          <h1
            className="text-[20px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Daily Notes
          </h1>
        </div>
        <p className="text-[13px] pl-7" style={{ color: "var(--text-tertiary)" }}>
          One note per day — auto-organised, always ready.
        </p>
      </motion.div>

      {/* ── Calendar strip + day controls ─────────────────────────────────── */}
      <motion.div
        variants={staggerItem}
        className="rounded-xl p-3"
        style={{
          background: "var(--bg-surface)",
          border:     "1px solid var(--border)",
        }}
      >
        {/* Strip */}
        <CalendarStrip
          activeDate={activeDate}
          onSelectDate={(d) => setActiveDate(startOfDay(d))}
          noteSet={noteSet}
        />

        {/* Nav row */}
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={goToPrev}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-[12px] transition-colors hover:bg-bg-elevated"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Previous day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          <div className="flex items-center gap-2">
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {fmtLong(activeDate)}
            </span>
            {isToday && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "var(--accent-soft)",
                  color:      "var(--accent)",
                  border:     "1px solid rgba(124,109,250,0.18)",
                }}
              >
                Today
              </span>
            )}
          </div>

          <button
            onClick={goToNext}
            disabled={isFuture}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-md text-[12px] transition-colors",
              isFuture
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-bg-elevated"
            )}
            style={{ color: "var(--text-secondary)" }}
            aria-label="Next day"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* ── Editor card ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {note && (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {note.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Save status */}
                <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {status === "saving" ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="w-3 h-3" style={{ color: "var(--success, #22c55e)" }} /> Saved</>
                  )}
                </span>

                {/* Open in full editor */}
                <Link
                  href={`/notes/${note.id}`}
                  className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] transition-colors hover:bg-bg-elevated"
                  style={{ color: "var(--text-secondary)" }}
                  title="Open in full editor"
                >
                  <ExternalLink className="w-3 h-3" />
                  Full editor
                </Link>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full outline-none resize-none bg-transparent editor-area placeholder:text-text-tertiary"
              style={{
                padding:    "16px 20px",
                minHeight:  "60vh",
                color:      "var(--text-primary)",
                fontSize:   "13px",
                lineHeight: "1.75",
              }}
              placeholder="Start writing…"
              spellCheck
            />

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <SectionStats content={content} />

              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                <BookOpen className="w-3 h-3" />
                <span>← → to navigate days</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick-tip banner (only when note was just created / empty) ─────── */}
      {note && note.content.trim() === content.trim() && content.includes("🎯 Focus") && (
        <motion.div
          variants={staggerItem}
          className="flex items-start gap-3 px-4 py-3 rounded-xl text-[12px]"
          style={{
            background: "rgba(124,109,250,0.06)",
            border:     "1px solid rgba(124,109,250,0.15)",
          }}
        >
          <Star className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--text-secondary)" }}>
            This is your daily note for <strong style={{ color: "var(--text-primary)" }}>{fmtLong(activeDate)}</strong>.
            Fill in your focus, tasks, and reflections. It auto-saves as you type.{" "}
            <Link href={`/notes/${note.id}`} className="underline" style={{ color: "var(--accent)" }}>
              Open in the full editor
            </Link>{" "}
            for markdown preview, backlinks, and AI tools.
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
