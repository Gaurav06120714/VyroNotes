"use client";

/**
 * WikiLinkPopover.tsx
 *
 * Obsidian-style [[wikilink]] autocomplete popover for the note textarea.
 *
 * Integration contract (mirrors SlashMenu exactly):
 *
 *   Parent detects `[[` in onContentChange, sets:
 *     wikiOpen={true}
 *     wikiQuery={text after `[[`}
 *     wikiPosition={top, left} relative to the editor wrapper
 *     wikiStart={index of the first `[` in raw content}
 *
 *   This component:
 *     - fuzzy-filters all non-trashed, non-archived notes by title
 *     - handles ArrowUp / ArrowDown / Enter / Escape internally
 *     - calls onPick(noteTitle) when an item is selected
 *     - calls onClose() on Escape or when results are empty
 *
 *   Parent on onPick(title):
 *     const before  = content.slice(0, wikiStart);
 *     const after   = content.slice(caretPos);        // everything after current cursor
 *     setContent(before + `[[${title}]]` + after);
 *     // then move cursor to end of inserted link
 *
 * Fuzzy search:
 *   Two-tier ranking:
 *     1. title.startsWith(query)  → tier 0  (sorted by title length asc)
 *     2. title.includes(query)    → tier 1  (sorted by title length asc)
 *   Both tiers are case-insensitive. Duplicate results are impossible because
 *   startsWith ⊂ includes — tier 1 is the set-difference.
 *   The matched portion of the title is highlighted with the accent colour.
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link2, StickyNote } from "lucide-react";
import { useNotesStore } from "@/store/notes.store";
import { subjectColor } from "@/lib/utils";
import type { Note } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WikiLinkPopoverProps {
  /** Whether the popover is currently open. */
  open: boolean;

  /**
   * The text typed after `[[`.
   * e.g. if content contains `[[Calc` the query is `"Calc"`.
   */
  query: string;

  /**
   * Position relative to the nearest `position:relative` ancestor
   * (the editor wrapper div). Both top and left in px.
   */
  position: { top: number; left: number };

  /**
   * Called when user selects a note title.
   * Parent is responsible for inserting `[[title]]` into content.
   */
  onPick: (title: string) => void;

  /** Called on Escape or when the filtered list becomes empty. */
  onClose: () => void;
}

// ── Fuzzy search ──────────────────────────────────────────────────────────────

interface SearchResult {
  note: Note;
  /** Index where the query starts in the lowercased title — used for highlight. */
  matchIndex: number;
  tier: 0 | 1;
}

function fuzzySearch(notes: Note[], query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    // No query → return first 8 notes sorted alphabetically
    return notes
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 8)
      .map((note) => ({ note, matchIndex: -1, tier: 1 }));
  }

  const tier0: SearchResult[] = [];
  const tier1: SearchResult[] = [];

  for (const note of notes) {
    const lower = note.title.toLowerCase();
    if (lower.startsWith(q)) {
      tier0.push({ note, matchIndex: 0, tier: 0 });
    } else {
      const idx = lower.indexOf(q);
      if (idx !== -1) {
        tier1.push({ note, matchIndex: idx, tier: 1 });
      }
    }
  }

  // Within each tier, shorter titles rank first (more precise match)
  const byLength = (a: SearchResult, b: SearchResult) =>
    a.note.title.length - b.note.title.length;

  return [...tier0.sort(byLength), ...tier1.sort(byLength)].slice(0, 10);
}

// ── Highlighted title ─────────────────────────────────────────────────────────

function HighlightedTitle({
  title,
  matchIndex,
  queryLen,
}: {
  title: string;
  matchIndex: number;
  queryLen: number;
}) {
  if (matchIndex < 0 || queryLen === 0) {
    return (
      <span className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
        {title}
      </span>
    );
  }

  const before  = title.slice(0, matchIndex);
  const matched = title.slice(matchIndex, matchIndex + queryLen);
  const after   = title.slice(matchIndex + queryLen);

  return (
    <span className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
      {before}
      <span
        style={{
          color: "var(--accent)",
          background: "var(--accent-soft)",
          borderRadius: 3,
          padding: "0 2px",
        }}
      >
        {matched}
      </span>
      {after}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WikiLinkPopover({
  open,
  query,
  position,
  onPick,
  onClose,
}: WikiLinkPopoverProps) {
  // ── Raw notes from store — never filter inside the selector (Zustand v5) ──
  const notes = useNotesStore((s) => s.notes);

  // Derive visible notes outside the selector
  const visibleNotes = useMemo(
    () => notes.filter((n) => !n.trashed && !n.archived),
    [notes]
  );

  // Fuzzy search results
  const results = useMemo(
    () => fuzzySearch(visibleNotes, query),
    [visibleNotes, query]
  );

  // Keyboard active index
  const [activeIndex, setActiveIndex] = useState(0);

  // Scrollable list ref — used to scroll active item into view
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Reset active index when query or results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  // Scroll active item into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Close when results dry up (and there's an active query)
  useEffect(() => {
    if (open && query.trim().length > 0 && results.length === 0) {
      onClose();
    }
  }, [open, query, results.length, onClose]);

  // Keyboard navigation — window listener mirrors SlashMenu pattern
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(results.length - 1, i + 1));
          break;

        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(0, i - 1));
          break;

        case "Enter": {
          const item = results[activeIndex];
          if (item) {
            e.preventDefault();
            e.stopPropagation();
            onPick(item.note.title);
          }
          break;
        }

        case "Escape":
          e.preventDefault();
          onClose();
          break;

        default:
          break;
      }
    };

    // useCapture:true so we intercept before the textarea's own keydown
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, results, activeIndex, onPick, onClose]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="absolute z-50 glass-strong rounded-xl overflow-hidden"
          style={{
            top: position.top,
            left: position.left,
            width: 280,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--border-strong)",
          }}
          // Prevent clicks inside the popover from blurring the textarea
          onMouseDown={(e) => e.preventDefault()}
          role="listbox"
          aria-label="Link to note"
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-3 pt-2.5 pb-1.5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Link2 className="w-3 h-3 shrink-0" style={{ color: "var(--accent)" }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Link to note
            </span>
            {query.trim().length > 0 && (
              <span
                className="ml-auto text-[10px] tabular-nums"
                style={{ color: "var(--text-tertiary)" }}
              >
                {results.length} result{results.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Results list — max 5 rows visible, scrollable */}
          <div
            ref={listRef}
            className="overflow-y-auto no-scrollbar py-1"
            style={{ maxHeight: 232 }} // ~5 items at 44px each + padding
          >
            {results.map((result, i) => {
              const { note, matchIndex } = result;
              const active = i === activeIndex;
              const dotColor = subjectColor(note.subject);

              return (
                <button
                  key={note.id}
                  ref={active ? activeRef : undefined}
                  onClick={() => onPick(note.title)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 transition-none"
                  style={{
                    background: active ? "var(--accent-soft-strong)" : "transparent",
                    borderLeft: active
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  }}
                  role="option"
                  aria-selected={active}
                >
                  {/* Subject colour dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: dotColor }}
                  />

                  {/* Title + subject */}
                  <div className="flex-1 min-w-0">
                    <HighlightedTitle
                      title={note.title}
                      matchIndex={matchIndex}
                      queryLen={query.trim().length}
                    />
                    <div
                      className="text-[10px] mt-0.5 truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {note.subject}
                      {note.tags.length > 0 && (
                        <> · {note.tags.slice(0, 2).join(", ")}</>
                      )}
                    </div>
                  </div>

                  {/* Active indicator */}
                  {active && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                      }}
                    >
                      ↵
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div
            className="flex items-center gap-3 px-3 py-1.5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {(
              [
                ["↑↓", "navigate"],
                ["↵",  "insert"],
                ["Esc", "close"],
              ] as [string, string][]
            ).map(([key, hint]) => (
              <div key={key} className="flex items-center gap-1">
                <kbd
                  className="text-[9px] px-1 py-0.5 rounded"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--text-secondary)",
                    fontFamily: "inherit",
                    lineHeight: 1.4,
                  }}
                >
                  {key}
                </kbd>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {hint}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
