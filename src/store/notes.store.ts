"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Note, Folder } from "@/lib/types";
import { DUMMY_NOTES, DUMMY_FOLDERS, TAGS } from "@/lib/dummy-data";
import { uid } from "@/lib/utils";

interface NotesState {
  notes: Note[];
  folders: Folder[];
  tags: string[];
  selectedFolderId: string | null;
  selectedTag: string | null;
  search: string;

  setSelectedFolder: (id: string | null) => void;
  setSelectedTag: (t: string | null) => void;
  setSearch: (q: string) => void;

  createNote: (partial?: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  hardDelete: (id: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;

  createFolder: (name: string, parentId?: string | null) => void;
  deleteFolder: (id: string) => void;

  /** Returns the daily-note title string for a given date, e.g. "Daily Note — May 29, 2026" */
  getDailyTitle: (date: Date) => string;
  /**
   * Finds the daily note for `date`.  If it doesn't exist it is created,
   * including auto-creating the "Daily Notes" folder when absent.
   * Returns the existing or new Note.
   */
  getDailyNote: (date: Date) => Note;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: DUMMY_NOTES,
      folders: DUMMY_FOLDERS,
      tags: TAGS,
      selectedFolderId: null,
      selectedTag: null,
      search: "",

      setSelectedFolder: (id) => set({ selectedFolderId: id }),
      setSelectedTag: (t) => set({ selectedTag: t }),
      setSearch: (q) => set({ search: q }),

      createNote: (partial) => {
        const note: Note = {
          id: uid(),
          title: partial?.title || "Untitled",
          content: partial?.content || "",
          subject: partial?.subject || "Math",
          folderId: partial?.folderId ?? get().selectedFolderId,
          tags: partial?.tags || [],
          pinned: false,
          archived: false,
          trashed: false,
          coverColor: partial?.coverColor,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
          ),
        })),
      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, trashed: true } : n)),
        })),
      restoreNote: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, trashed: false } : n)),
        })),
      hardDelete: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      togglePin: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
        })),
      toggleArchive: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, archived: !n.archived } : n)),
        })),

      createFolder: (name, parentId = null) =>
        set((s) => ({
          folders: [
            ...s.folders,
            { id: uid(), name, parentId, color: "#a78bfa" },
          ],
        })),
      deleteFolder: (id) =>
        set((s) => ({ folders: s.folders.filter((f) => f.id !== id) })),

      getDailyTitle: (date: Date) => {
        // Format: "Daily Note — May 29, 2026"
        const month = date.toLocaleString("en-US", { month: "long" });
        const day   = date.getDate();
        const year  = date.getFullYear();
        return `Daily Note — ${month} ${day}, ${year}`;
      },

      getDailyNote: (date: Date) => {
        const { notes, folders, getDailyTitle, createNote } = get();
        const title = getDailyTitle(date);

        // 1. Return existing (non-trashed) daily note for this date
        const existing = notes.find(
          (n) => n.title === title && !n.trashed
        );
        if (existing) return existing;

        // 2. Ensure "Daily Notes" folder exists
        const FOLDER_NAME = "Daily Notes";
        let folder = folders.find((f) => f.name === FOLDER_NAME);
        if (!folder) {
          const fid = uid();
          folder = { id: fid, name: FOLDER_NAME, parentId: null, color: "#7c6dfa" };
          set((s) => ({ folders: [...s.folders, folder!] }));
        }

        // 3. Build prefilled template
        const dateLabel = date.toLocaleString("en-US", {
          weekday: "long",
          month:   "long",
          day:     "numeric",
          year:    "numeric",
        });
        const content = [
          `# ${title}`,
          `_${dateLabel}_`,
          ``,
          `## 🎯 Focus`,
          `What is the one thing I must accomplish today?`,
          ``,
          `- `,
          ``,
          `## 📝 Notes`,
          ``,
          ``,
          `## ✅ Tasks`,
          ``,
          `- [ ] `,
          `- [ ] `,
          `- [ ] `,
          ``,
          `## 🔁 Review`,
          `**What went well?**`,
          ``,
          `**What could be better?**`,
          ``,
          `**Grateful for:**`,
          ``,
        ].join("\n");

        // 4. Create and return
        const newNote = createNote({
          title,
          content,
          subject:  "CS",          // sensible default; user can change
          tags:     ["daily"],
          folderId: folder.id,
        });

        // Also register "daily" tag if it isn't there yet
        set((s) => ({
          tags: s.tags.includes("daily") ? s.tags : [...s.tags, "daily"],
        }));

        return newNote;
      },
    }),
    { name: "vyronotes-notes" }
  )
);
