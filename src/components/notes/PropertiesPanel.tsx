"use client";

/**
 * PropertiesPanel.tsx
 *
 * Obsidian-inspired Properties Panel that slides in from the right of the
 * note editor. Displays & allows editing of:
 *  - Created / Updated dates
 *  - Word count & reading time (live from content)
 *  - Subject (read-only, shown for reference)
 *  - Folder (editable dropdown)
 *  - Tags (add / remove inline)
 *  - Linked notes count (backlinks + outgoing)
 *  - Note ID with copy-to-clipboard
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Hash,
  FolderOpen,
  Link2,
  Copy,
  Check,
  Plus,
  X,
  FileText,
  BookOpen,
  AlignLeft,
} from "lucide-react";
import { useNotesStore } from "@/store/notes.store";
import { wordCount, readingTime, subjectColor } from "@/lib/utils";
import type { Note, Folder } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  note:        Note;
  content:     string;      // live content from editor state
  tags:        string[];
  setTags:     (t: string[]) => void;
  allTags:     string[];
  folders:     Folder[];
  updateNote:  (id: string, data: Partial<Note>) => void;
}

// ── Animation ─────────────────────────────────────────────────────────────────

const slideFromRight = {
  initial:  { x: "100%", opacity: 0 },
  animate:  { x: 0,       opacity: 1 },
  exit:     { x: "100%",  opacity: 0 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

// ── Row wrapper ───────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  children,
}: {
  icon:     React.ReactNode;
  label:    string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
      <span
        className="mt-0.5 shrink-0 w-3.5 h-3.5 flex items-center justify-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </div>
        <div className="text-[12px]" style={{ color: "var(--text-primary)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Copy-to-clipboard button ──────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-1.5 p-0.5 rounded transition-colors hover:bg-bg-elevated shrink-0"
      style={{ color: copied ? "var(--success, #22c55e)" : "var(--text-tertiary)" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check className="w-3 h-3" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy className="w-3 h-3" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PropertiesPanel({
  note,
  content,
  tags,
  setTags,
  allTags,
  folders,
  updateNote,
}: Props) {
  const allNotes = useNotesStore((s) => s.notes);

  // Live stats
  const words   = useMemo(() => wordCount(content), [content]);
  const minutes = useMemo(() => readingTime(content), [content]);

  // Linked-notes count (backlinks + outgoing deduplicated by id)
  const linkedCount = useMemo(() => {
    const WIKILINK_RE = /\[\[(.+?)\]\]/g;
    const titleLower  = note.title.toLowerCase();
    const linkedIds   = new Set<string>();

    // Backlinks: other notes that contain [[note.title]]
    for (const n of allNotes) {
      if (n.id === note.id || n.trashed || n.archived) continue;
      if (n.content.toLowerCase().includes(`[[${titleLower}]]`)) {
        linkedIds.add(n.id);
      }
    }

    // Outgoing: [[wikilinks]] in this note that resolve to existing notes
    const titleMap = new Map(
      allNotes
        .filter((n) => !n.trashed && !n.archived)
        .map((n) => [n.title.toLowerCase(), n.id])
    );
    WIKILINK_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = WIKILINK_RE.exec(content)) !== null) {
      const target = titleMap.get(m[1].trim().toLowerCase());
      if (target && target !== note.id) linkedIds.add(target);
    }

    return linkedIds.size;
  }, [allNotes, note.id, note.title, content]);

  // Tag editing
  const [newTag, setNewTag]     = useState("");
  const [tagFocus, setTagFocus] = useState(false);

  const addTag = (t: string) => {
    const cleaned = t.trim().replace(/^#/, "");
    if (!cleaned || tags.includes(cleaned)) return;
    const next = [...tags, cleaned];
    setTags(next);
    updateNote(note.id, { tags: next });
    setNewTag("");
  };

  const removeTag = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    updateNote(note.id, { tags: next });
  };

  const handleFolderChange = (folderId: string) => {
    updateNote(note.id, { folderId: folderId || undefined });
  };

  const dot = subjectColor(note.subject);
  const currentFolder = folders.find((f) => f.id === note.folderId);

  return (
    <motion.aside
      {...slideFromRight}
      className="w-full overflow-y-auto no-scrollbar rounded-xl"
      style={{
        background: "var(--bg-surface)",
        border:     "1px solid var(--border)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 sticky top-0"
        style={{
          borderBottom: "1px solid var(--border)",
          background:   "var(--bg-surface)",
          zIndex:       1,
        }}
      >
        <AlignLeft className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
        <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Properties
        </span>
      </div>

      <div className="px-3 pb-3">
        {/* Created */}
        <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Created">
          <span style={{ color: "var(--text-secondary)" }}>
            {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </Row>

        {/* Updated */}
        <Row icon={<Clock className="w-3.5 h-3.5" />} label="Updated">
          <span style={{ color: "var(--text-secondary)" }}>
            {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </Row>

        {/* Word count + reading time */}
        <Row icon={<BookOpen className="w-3.5 h-3.5" />} label="Stats">
          <span style={{ color: "var(--text-secondary)" }}>
            {words} words · {minutes} min read
          </span>
        </Row>

        {/* Subject */}
        <Row icon={<FileText className="w-3.5 h-3.5" />} label="Subject">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: dot }}
            />
            <span style={{ color: "var(--text-secondary)" }}>{note.subject}</span>
          </span>
        </Row>

        {/* Folder */}
        <Row icon={<FolderOpen className="w-3.5 h-3.5" />} label="Folder">
          <select
            value={note.folderId || ""}
            onChange={(e) => handleFolderChange(e.target.value)}
            className="w-full rounded-md px-2 py-1 text-[12px] outline-none focus:ring-1 focus:ring-accent transition-colors"
            style={{
              background: "var(--bg-elevated)",
              border:     "1px solid var(--border)",
              color:      "var(--text-secondary)",
            }}
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Row>

        {/* Tags */}
        <Row icon={<Hash className="w-3.5 h-3.5" />} label="Tags">
          <div className="flex flex-wrap gap-1 mb-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-md"
                style={{
                  background: "var(--accent-soft)",
                  color:      "var(--accent)",
                }}
              >
                #{t}
                <button
                  onClick={() => removeTag(t)}
                  className="ml-0.5 hover:opacity-70 transition-opacity"
                  aria-label={`Remove tag ${t}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Add tag input */}
          <div
            className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors"
            style={{
              background:  tagFocus ? "var(--bg-elevated)" : "transparent",
              border:      `1px solid ${tagFocus ? "var(--border-strong)" : "var(--border)"}`,
            }}
          >
            <Plus className="w-3 h-3 shrink-0" style={{ color: "var(--text-tertiary)" }} />
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addTag(newTag); }
              }}
              onFocus={() => setTagFocus(true)}
              onBlur={() => setTagFocus(false)}
              list="props-tag-suggestions"
              placeholder="Add tag…"
              className="flex-1 min-w-0 bg-transparent text-[11px] outline-none placeholder:text-text-tertiary"
              style={{ color: "var(--text-primary)" }}
            />
            <datalist id="props-tag-suggestions">
              {allTags
                .filter((t) => !tags.includes(t))
                .map((t) => (
                  <option key={t} value={t} />
                ))}
            </datalist>
            {newTag && (
              <button
                onMouseDown={(e) => { e.preventDefault(); addTag(newTag); }}
                className="text-[10px] px-1 py-0.5 rounded"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                add
              </button>
            )}
          </div>
        </Row>

        {/* Linked notes */}
        <Row icon={<Link2 className="w-3.5 h-3.5" />} label="Linked notes">
          <span
            className="inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
            style={{
              background: linkedCount > 0 ? "var(--accent-soft)" : "var(--bg-elevated)",
              color:      linkedCount > 0 ? "var(--accent)"      : "var(--text-tertiary)",
              border:     `1px solid ${linkedCount > 0 ? "rgba(124,109,250,0.18)" : "var(--border)"}`,
            }}
          >
            {linkedCount}
            <span className="font-normal text-[11px]">
              {linkedCount === 1 ? "note" : "notes"}
            </span>
          </span>
        </Row>

        {/* Note ID */}
        <div className="flex items-start gap-2.5 pt-2">
          <span
            className="mt-0.5 shrink-0 w-3.5 h-3.5 flex items-center justify-center"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Hash className="w-3.5 h-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Note ID
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="text-[10px] font-mono truncate"
                style={{ color: "var(--text-tertiary)" }}
                title={note.id}
              >
                {note.id}
              </span>
              <CopyButton text={note.id} />
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
