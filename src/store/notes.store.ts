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
    }),
    { name: "vyronotes-notes" }
  )
);
