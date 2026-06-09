"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ArrowUpRight, Unlink, FolderOpen, ChevronRight } from "lucide-react";
import { useNotesStore } from "@/store/notes.store";
import { subjectColor, formatRelative } from "@/lib/utils";
import { stagger, staggerItem, easing } from "@/lib/animations";
import type { Note, Folder } from "@/lib/types";

interface Props {
  currentNoteId: string;
  currentTitle: string;
}

interface BacklinkEntry {
  note:    Note;
  folder:  Folder | null;
  snippet: string; 
}

interface OutgoingEntry {
  note:   Note;
  folder: Folder | null;
}

function extractSnippet(content: string, title: string): string {
  const escapedTitle = title.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const wikilinkRe   = new RegExp(`\\[\\[${escapedTitle}\\]\\]`, "i");

  const sentences = content.split(/(?<=[.!?])\s+|\n{2,}/);

  for (const sentence of sentences) {
    if (wikilinkRe.test(sentence)) {
      const clean = sentence
        .replace(/\[\[([^\]]+)\]\]/g, "$1") 
        .replace(/[#*`>_~]/g, "")            // strip markdown syntax
        .replace(/\s+/g, " ")
        .trim();
      return clean.length > 120 ? clean.slice(0, 117) + "…" : clean;
    }
  }

  // Fallback: first 120 chars stripped of markdown
  const fallback = content
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[#*`>_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return fallback.length > 120 ? fallback.slice(0, 117) + "…" : fallback;
}

function SectionHeader({
  icon,
  label,
  count,
  accent = false,
}: {
  icon:    React.ReactNode;
  label:   string;
  count:   number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span style={{ color: accent ? "var(--accent)" : "var(--text-tertiary)" }}>
        {icon}
      </span>
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      {}
      <span
        className="ml-auto text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full"
        style={{
          background: accent ? "var(--accent-soft)" : "var(--bg-elevated)",
          color:      accent ? "var(--accent)"      : "var(--text-tertiary)",
          border:     `1px solid ${accent ? "rgba(124,109,250,0.18)" : "var(--border)"}`,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function BacklinkCard({ entry }: { entry: BacklinkEntry }) {
  const { note, folder, snippet } = entry;
  const dot = subjectColor(note.subject);

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={`/notes/${note.id}`}
        className="group block rounded-lg p-2.5 transition-colors"
        style={{
          border:     "1px solid transparent",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background  = "var(--bg-elevated)";
          el.style.borderColor = "var(--border)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background  = "transparent";
          el.style.borderColor = "transparent";
        }}
      >
        {}
        <div className="flex items-center gap-1.5 mb-1 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: dot }}
          />
          <span
            className="text-[12px] font-semibold truncate flex-1"
            style={{ color: "var(--text-primary)" }}
          >
            {note.title}
          </span>
          <ArrowUpRight
            className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--accent)" }}
          />
        </div>

        {}
        {folder && (
          <div
            className="flex items-center gap-1 mb-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            <FolderOpen className="w-2.5 h-2.5 shrink-0" />
            <span className="text-[10px] truncate">{folder.name}</span>
          </div>
        )}

        {}
        {snippet && (
          <p
            className="text-[11px] leading-relaxed line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {snippet}
          </p>
        )}

        {}
        <div
          className="mt-1.5 text-[10px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {formatRelative(note.updatedAt)}
        </div>
      </Link>
    </motion.div>
  );
}

function OutgoingRow({ entry }: { entry: OutgoingEntry }) {
  const { note, folder } = entry;
  const dot = subjectColor(note.subject);

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={`/notes/${note.id}`}
        className="group flex items-center gap-2 px-2.5 py-2 rounded-lg"
        style={{
          border:     "1px solid transparent",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background  = "var(--bg-elevated)";
          el.style.borderColor = "var(--border)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background  = "transparent";
          el.style.borderColor = "transparent";
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: dot }}
        />
        <div className="flex-1 min-w-0">
          <div
            className="text-[12px] font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {note.title}
          </div>
          {folder && (
            <div
              className="text-[10px] truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              {folder.name}
            </div>
          )}
        </div>
        <ChevronRight
          className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        />
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: easing }}
      className="flex flex-col items-center gap-2.5 py-6 px-3 text-center"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: "var(--bg-elevated)",
          border:     "1px solid var(--border)",
        }}
      >
        <Unlink className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
      </div>
      <div>
        <p
          className="text-[12px] font-medium mb-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          No links yet
        </p>
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: "var(--text-tertiary)" }}
        >
          Type{" "}
          <code
            className="px-1 py-0.5 rounded text-[10px]"
            style={{
              background: "var(--bg-elevated)",
              color:      "var(--text-secondary)",
              border:     "1px solid var(--border)",
            }}
          >
            {"[[Note Title]]"}
          </code>{" "}
          to link notes together.
        </p>
      </div>
    </motion.div>
  );
}

export function BacklinksPanel({ currentNoteId, currentTitle }: Props) {
  
  const allNotes   = useNotesStore((s) => s.notes);
  const allFolders = useNotesStore((s) => s.folders);

  const folderMap = useMemo(
    () => new Map(allFolders.map((f) => [f.id, f])),
    [allFolders]
  );

  const escapedTitle = useMemo(
    () => currentTitle.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
    [currentTitle]
  );

  const backlinkRe = useMemo(
    () => new RegExp(`\\[\\[${escapedTitle}\\]\\]`, "i"),
    [escapedTitle]
  );

  const backlinks = useMemo<BacklinkEntry[]>(() => {
    return allNotes
      .filter(
        (n) =>
          n.id !== currentNoteId &&
          !n.trashed &&
          !n.archived &&
          backlinkRe.test(n.content)
      )
      .map((note) => ({
        note,
        folder:  note.folderId ? (folderMap.get(note.folderId) ?? null) : null,
        snippet: extractSnippet(note.content, currentTitle),
      }));
  }, [allNotes, currentNoteId, backlinkRe, currentTitle, folderMap]);

  const currentNote = useMemo(
    () => allNotes.find((n) => n.id === currentNoteId),
    [allNotes, currentNoteId]
  );

  const outgoing = useMemo<OutgoingEntry[]>(() => {
    if (!currentNote) return [];

    const matches = Array.from(currentNote.content.matchAll(/\[\[([^\]]+)\]\]/g));
    const seen    = new Set<string>();

    return matches
      .map((m) => m[1].trim().toLowerCase())
      .filter((lower) => {
        if (seen.has(lower)) return false; 
        seen.add(lower);
        return true;
      })
      .map((lower) =>
        allNotes.find(
          (n) =>
            n.title.toLowerCase() === lower &&
            !n.trashed &&
            !n.archived
        )
      )
      .filter((n): n is Note => !!n)
      .map((note) => ({
        note,
        folder: note.folderId ? (folderMap.get(note.folderId) ?? null) : null,
      }));
  }, [currentNote, allNotes, folderMap]);

  const hasLinks = backlinks.length > 0 || outgoing.length > 0;

  return (
    <div
      className="card-v2 overflow-hidden"
      style={{ padding: 0 }}
    >
      {}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link2
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: "var(--accent)" }}
        />
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Links
        </span>
        {hasLinks && (
          <span
            className="ml-auto text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full"
            style={{
              background: "var(--accent-soft)",
              color:      "var(--accent)",
              border:     "1px solid rgba(124,109,250,0.18)",
            }}
          >
            {backlinks.length + outgoing.length}
          </span>
        )}
      </div>

      {}
      <div className="px-2.5 py-2.5 space-y-4 overflow-y-auto no-scrollbar max-h-[70vh]">
        <AnimatePresence mode="wait">
          {!hasLinks ? (
            <EmptyState key="empty" />
          ) : (
            <motion.div
              key="content"
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {}
              {backlinks.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Link2 className="w-3 h-3" />}
                    label="Backlinks"
                    count={backlinks.length}
                    accent
                  />
                  <motion.div
                    variants={stagger}
                    initial="initial"
                    animate="animate"
                    className="space-y-0.5"
                  >
                    {backlinks.map((entry) => (
                      <BacklinkCard key={entry.note.id} entry={entry} />
                    ))}
                  </motion.div>
                </section>
              )}

              {}
              {backlinks.length > 0 && outgoing.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)" }} />
              )}

              {}
              {outgoing.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<ArrowUpRight className="w-3 h-3" />}
                    label="Links from this note"
                    count={outgoing.length}
                  />
                  <motion.div
                    variants={stagger}
                    initial="initial"
                    animate="animate"
                    className="space-y-0.5"
                  >
                    {outgoing.map((entry) => (
                      <OutgoingRow key={entry.note.id} entry={entry} />
                    ))}
                  </motion.div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
