import { hasSupabase } from "@/store/auth.store";
import type { Note, Folder, FlashcardDeck, Assignment } from "@/lib/types";

interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  subject: string | null;
  tags: string[];
  folder_id: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  word_count: number;
  created_at: string;
  updated_at: string;
}

interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

interface AssignmentRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
}

type RawClient = any;

async function getClient(): Promise<RawClient> {
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  return getSupabaseClient();
}

export async function syncNotes(userId: string, localNotes: Note[]): Promise<Note[]> {
  if (!hasSupabase) return localNotes;

  const supabase = await getClient();

  const rows: NoteRow[] = localNotes.map((n) => ({
    id: n.id,
    user_id: userId,
    title: n.title,
    content: n.content,
    subject: n.subject,
    tags: n.tags,
    folder_id: n.folderId ?? null,
    is_pinned: n.pinned,
    is_archived: n.archived,
    is_trashed: n.trashed,
    word_count: n.content.split(/\s+/).filter(Boolean).length,
    updated_at: n.updatedAt,
    created_at: n.createdAt,
  }));

  if (rows.length > 0) {
    await supabase.from("notes").upsert(rows, { onConflict: "id" });
  }

  const { data: remoteNotes, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !remoteNotes) return localNotes;

  const localMap = new Map(localNotes.map((n) => [n.id, n]));

  for (const r of (remoteNotes as NoteRow[])) {
    const local = localMap.get(r.id);
    if (!local || r.updated_at > local.updatedAt) {
      localMap.set(r.id, {
        id: r.id,
        title: r.title,
        content: r.content,
        subject: (r.subject as Note["subject"]) ?? "Math",
        folderId: r.folder_id,
        tags: r.tags ?? [],
        pinned: r.is_pinned,
        archived: r.is_archived,
        trashed: r.is_trashed,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }
  }

  return Array.from(localMap.values());
}

export async function syncFolders(userId: string, localFolders: Folder[]): Promise<Folder[]> {
  if (!hasSupabase) return localFolders;

  const supabase = await getClient();

  const rows: Omit<FolderRow, "created_at">[] = localFolders.map((f) => ({
    id: f.id,
    user_id: userId,
    name: f.name,
    color: f.color,
  }));

  if (rows.length > 0) {
    await supabase.from("folders").upsert(rows, { onConflict: "id" });
  }

  const { data: remoteFolders } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId);

  if (!remoteFolders) return localFolders;

  const merged = new Map(localFolders.map((f) => [f.id, f]));
  for (const r of (remoteFolders as FolderRow[])) {
    if (!merged.has(r.id)) {
      merged.set(r.id, { id: r.id, name: r.name, color: r.color, parentId: null });
    }
  }

  return Array.from(merged.values());
}

export async function syncFlashcards(userId: string, localDecks: FlashcardDeck[]): Promise<FlashcardDeck[]> {
  if (!hasSupabase) return localDecks;

  const supabase = await getClient();

  const deckRows = localDecks.map((d) => ({
    id: d.id,
    user_id: userId,
    name: d.name,
    subject: d.subject,
    updated_at: new Date().toISOString(),
    created_at: d.createdAt,
  }));

  if (deckRows.length > 0) {
    await supabase.from("flashcard_decks").upsert(deckRows, { onConflict: "id" });
  }

  const cardRows = localDecks.flatMap((d) =>
    d.cards.map((c) => ({
      id: c.id,
      deck_id: d.id,
      user_id: userId,
      front: c.front,
      back: c.back,
      interval: c.interval,
      ease_factor: c.easeFactor,
      due_at: c.dueAt,
      mastery: c.mastery,
      updated_at: new Date().toISOString(),
    }))
  );

  if (cardRows.length > 0) {
    await supabase.from("flashcards").upsert(cardRows, { onConflict: "id" });
  }

  return localDecks;
}

export async function syncAssignments(userId: string, localAssignments: Assignment[]): Promise<Assignment[]> {
  if (!hasSupabase) return localAssignments;

  const supabase = await getClient();

  const rows = localAssignments.map((a) => ({
    id: a.id,
    user_id: userId,
    title: a.title,
    description: a.description,
    status: a.status,
    priority: a.priority,
    due_date: a.dueDate,
    subject: a.subject,
    updated_at: new Date().toISOString(),
    created_at: a.createdAt,
  }));

  if (rows.length > 0) {
    await supabase.from("assignments").upsert(rows, { onConflict: "id" });
  }

  const { data: remote } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", userId);

  if (!remote) return localAssignments;

  const merged = new Map(localAssignments.map((a) => [a.id, a]));
  for (const r of (remote as AssignmentRow[])) {
    if (!merged.has(r.id)) {
      merged.set(r.id, {
        id: r.id,
        title: r.title,
        description: r.description ?? "",
        status: r.status as Assignment["status"],
        priority: r.priority as Assignment["priority"],
        dueDate: r.due_date,
        subject: (r.subject as Assignment["subject"]) ?? "CS",
        progress: 0,
        createdAt: r.created_at,
      });
    }
  }

  return Array.from(merged.values());
}

export interface CloudData {
  notes: Note[];
  folders: Folder[];
  decks: FlashcardDeck[];
  assignments: Assignment[];
}

export async function loadFromCloud(userId: string): Promise<CloudData | null> {
  if (!hasSupabase) return null;

  const supabase = await getClient();

  const [notesRes, foldersRes, assignmentsRes] = await Promise.all([
    supabase.from("notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("folders").select("*").eq("user_id", userId),
    supabase.from("assignments").select("*").eq("user_id", userId),
  ]);

  const notes: Note[] = ((notesRes.data ?? []) as NoteRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    subject: (r.subject as Note["subject"]) ?? "Math",
    folderId: r.folder_id,
    tags: r.tags ?? [],
    pinned: r.is_pinned,
    archived: r.is_archived,
    trashed: r.is_trashed,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const folders: Folder[] = ((foldersRes.data ?? []) as FolderRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    parentId: null,
  }));

  const assignments: Assignment[] = ((assignmentsRes.data ?? []) as AssignmentRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    status: r.status as Assignment["status"],
    priority: r.priority as Assignment["priority"],
    dueDate: r.due_date,
    subject: (r.subject as Assignment["subject"]) ?? "CS",
    progress: 0,
    createdAt: r.created_at,
  }));

  return { notes, folders, decks: [], assignments };
}
