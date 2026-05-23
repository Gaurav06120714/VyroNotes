"use client";
import { useNotesStore } from "@/store/notes.store";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { useMemo } from "react";
import type { Note } from "@/lib/types";

interface Props {
  currentNoteId: string;
  currentTitle: string;
}

export function BacklinksPanel({ currentNoteId, currentTitle }: Props) {
  const allNotes = useNotesStore((s) => s.notes);
  const re = useMemo(() => {
    // [[Title]] pattern matching this note's title
    const escaped = currentTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    return new RegExp(`\\[\\[${escaped}\\]\\]`, "i");
  }, [currentTitle]);

  const backlinks = useMemo(
    () =>
      allNotes.filter(
        (n) => n.id !== currentNoteId && !n.trashed && !n.archived && re.test(n.content)
      ),
    [allNotes, currentNoteId, re]
  );

  // Parse outgoing links from current note
  const currentNote = allNotes.find((n) => n.id === currentNoteId);
  const outgoing = useMemo<Note[]>(() => {
    if (!currentNote) return [];
    const matches = Array.from(currentNote.content.matchAll(/\[\[([^\]]+)\]\]/g));
    return matches
      .map((m) => m[1].trim())
      .map((title) => allNotes.find((n) => n.title.toLowerCase() === title.toLowerCase()))
      .filter((n): n is Note => !!n);
  }, [currentNote, allNotes]);

  if (backlinks.length === 0 && outgoing.length === 0) {
    return (
      <div className="card-v2">
        <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-2">
          <Link2 className="w-3.5 h-3.5 text-accent" /> Links
        </h3>
        <p className="text-[11px] text-text-tertiary leading-relaxed">
          No links yet. Type <code className="px-1 py-0.5 rounded bg-bg-elevated text-text-secondary">[[Note Title]]</code> to link to another note.
        </p>
      </div>
    );
  }

  return (
    <div className="card-v2 space-y-3">
      {outgoing.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5">Links from this note</div>
          <div className="space-y-1">
            {outgoing.map((n) => (
              <Link
                key={n.id}
                href={`/notes/${n.id}`}
                className="block p-2 rounded-md hover:bg-bg-elevated transition-colors"
              >
                <div className="text-[12px] font-medium truncate">{n.title}</div>
                <div className="text-[10px] text-text-tertiary">{n.subject}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {backlinks.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5">
            Backlinks ({backlinks.length})
          </div>
          <div className="space-y-1">
            {backlinks.map((n) => (
              <Link
                key={n.id}
                href={`/notes/${n.id}`}
                className="block p-2 rounded-md hover:bg-bg-elevated transition-colors"
              >
                <div className="text-[12px] font-medium truncate">{n.title}</div>
                <div className="text-[10px] text-text-tertiary">{n.subject}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
