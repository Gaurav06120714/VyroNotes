"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link2, StickyNote } from "lucide-react";
import { useNotesStore } from "@/store/notes.store";
import { subjectColor } from "@/lib/utils";
import type { Note } from "@/lib/types";

export interface WikiLinkPopoverProps {
  
  open: boolean;

  query: string;

  position: { top: number; left: number };

  onPick: (title: string) => void;

  onClose: () => void;
}

interface SearchResult {
  note: Note;
  
  matchIndex: number;
  tier: 0 | 1;
}

function fuzzySearch(notes: Note[], query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    
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

  const byLength = (a: SearchResult, b: SearchResult) =>
    a.note.title.length - b.note.title.length;

  return [...tier0.sort(byLength), ...tier1.sort(byLength)].slice(0, 10);
}

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

export function WikiLinkPopover({
  open,
  query,
  position,
  onPick,
  onClose,
}: WikiLinkPopoverProps) {
  
  const notes = useNotesStore((s) => s.notes);

  const visibleNotes = useMemo(
    () => notes.filter((n) => !n.trashed && !n.archived),
    [notes]
  );

  const results = useMemo(
    () => fuzzySearch(visibleNotes, query),
    [visibleNotes, query]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (open && query.trim().length > 0 && results.length === 0) {
      onClose();
    }
  }, [open, query, results.length, onClose]);

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

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, results, activeIndex, onPick, onClose]);

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
          
          onMouseDown={(e) => e.preventDefault()}
          role="listbox"
          aria-label="Link to note"
        >
          {}
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

          {}
          <div
            ref={listRef}
            className="overflow-y-auto no-scrollbar py-1"
            style={{ maxHeight: 232 }} 
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
                  {}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: dotColor }}
                  />

                  {}
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

                  {}
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

          {}
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
