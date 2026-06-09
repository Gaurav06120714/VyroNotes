"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Note, Folder } from "@/lib/types";
import { DUMMY_NOTES, DUMMY_FOLDERS, TAGS } from "@/lib/dummy-data";
import { uid } from "@/lib/utils";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface NotesState {
  notes: Note[];
  folders: Folder[];
  tags: string[];
  selectedFolderId: string | null;
  selectedTag: string | null;
  search: string;
  syncStatus: SyncStatus;

  setSelectedFolder: (id: string | null) => void;
  setSelectedTag: (t: string | null) => void;
  setSearch: (q: string) => void;
  setSyncStatus: (s: SyncStatus) => void;

  createNote: (partial?: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  hardDelete: (id: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;

  createFolder: (name: string, parentId?: string | null) => void;
  deleteFolder: (id: string) => void;

  hydrateFromCloud: (notes: Note[], folders: Folder[]) => void;

  getDailyTitle: (date: Date) => string;
  
  getDailyNote: (date: Date) => Note;
}

async function getRawSupabase(): Promise<any> {
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  return getSupabaseClient();
}

async function upsertNoteToSupabase(note: Note, userId: string) {
  const { hasSupabase } = await import("@/store/auth.store");
  if (!hasSupabase) return;
  try {
    const supabase = await getRawSupabase();
    await supabase.from("notes").upsert({
      id: note.id,
      user_id: userId,
      title: note.title,
      content: note.content,
      subject: note.subject,
      tags: note.tags,
      folder_id: note.folderId ?? null,
      is_pinned: note.pinned,
      is_archived: note.archived,
      is_trashed: note.trashed,
      word_count: note.content.split(/\s+/).filter(Boolean).length,
      updated_at: note.updatedAt,
      created_at: note.createdAt,
    }, { onConflict: "id" });
  } catch {
    
  }
}

async function deleteNoteFromSupabase(noteId: string) {
  const { hasSupabase } = await import("@/store/auth.store");
  if (!hasSupabase) return;
  try {
    const supabase = await getRawSupabase();
    await supabase.from("notes").delete().eq("id", noteId);
  } catch {
    
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const { hasSupabase } = await import("@/store/auth.store");
  if (!hasSupabase) return null;
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session?.user.id ?? null;
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
      syncStatus: "idle" as SyncStatus,

      setSelectedFolder: (id) => set({ selectedFolderId: id }),
      setSelectedTag: (t) => set({ selectedTag: t }),
      setSearch: (q) => set({ search: q }),
      setSyncStatus: (s) => set({ syncStatus: s }),

      hydrateFromCloud: (notes, folders) => set({ notes, folders }),

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
        
        getCurrentUserId().then((uid) => { if (uid) upsertNoteToSupabase(note, uid); });
        return note;
      },
      updateNote: (id, patch) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
          ),
        }));
        
        const updated = get().notes.find((n) => n.id === id);
        if (updated) {
          getCurrentUserId().then((uid) => { if (uid) upsertNoteToSupabase(updated, uid); });
        }
      },
      deleteNote: (id) => {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, trashed: true } : n)),
        }));
        const trashed = get().notes.find((n) => n.id === id);
        if (trashed) {
          getCurrentUserId().then((uid) => { if (uid) upsertNoteToSupabase({ ...trashed, trashed: true }, uid); });
        }
      },
      restoreNote: (id) => {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, trashed: false } : n)),
        }));
        const restored = get().notes.find((n) => n.id === id);
        if (restored) {
          getCurrentUserId().then((uid) => { if (uid) upsertNoteToSupabase({ ...restored, trashed: false }, uid); });
        }
      },
      hardDelete: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        deleteNoteFromSupabase(id);
      },
      togglePin: (id) => {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
        }));
        const note = get().notes.find((n) => n.id === id);
        if (note) getCurrentUserId().then((uid) => { if (uid) upsertNoteToSupabase(note, uid); });
      },
      toggleArchive: (id) => {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, archived: !n.archived } : n)),
        }));
        const note = get().notes.find((n) => n.id === id);
        if (note) getCurrentUserId().then((uid) => { if (uid) upsertNoteToSupabase(note, uid); });
      },

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
        
        const month = date.toLocaleString("en-US", { month: "long" });
        const day   = date.getDate();
        const year  = date.getFullYear();
        return `Daily Note — ${month} ${day}, ${year}`;
      },

      getDailyNote: (date: Date) => {
        const { notes, folders, getDailyTitle, createNote } = get();
        const title = getDailyTitle(date);

        const existing = notes.find(
          (n) => n.title === title && !n.trashed
        );
        if (existing) return existing;

        const FOLDER_NAME = "Daily Notes";
        let folder = folders.find((f) => f.name === FOLDER_NAME);
        if (!folder) {
          const fid = uid();
          folder = { id: fid, name: FOLDER_NAME, parentId: null, color: "#7c6dfa" };
          set((s) => ({ folders: [...s.folders, folder!] }));
        }

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

        const newNote = createNote({
          title,
          content,
          subject:  "CS",          
          tags:     ["daily"],
          folderId: folder.id,
        });

        set((s) => ({
          tags: s.tags.includes("daily") ? s.tags : [...s.tags, "daily"],
        }));

        return newNote;
      },
    }),
    { name: "vyronotes-notes" }
  )
);
