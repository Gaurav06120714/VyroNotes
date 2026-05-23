"use client";
import { useNotesStore } from "@/store/notes.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Folder,
  Tag as TagIcon,
  Pin,
  Archive,
  Trash2,
  FileText,
  Filter,
} from "lucide-react";
import { formatRelative, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { SUBJECTS } from "@/lib/dummy-data";
import { stagger, staggerItem } from "@/lib/animations";

export default function NotesListPage() {
  const router = useRouter();
  const {
    notes,
    folders,
    tags,
    selectedFolderId,
    setSelectedFolder,
    selectedTag,
    setSelectedTag,
    search,
    setSearch,
    createNote,
    togglePin,
    deleteNote,
    toggleArchive,
  } = useNotesStore();

  const [view, setView] = useState<"all" | "archived" | "trash">("all");
  const [subject, setSubject] = useState<string>("");

  const filtered = useMemo(() => {
    let list = notes;
    if (view === "all") list = list.filter((n) => !n.trashed && !n.archived);
    if (view === "archived") list = list.filter((n) => n.archived && !n.trashed);
    if (view === "trash") list = list.filter((n) => n.trashed);
    if (selectedFolderId) list = list.filter((n) => n.folderId === selectedFolderId);
    if (selectedTag) list = list.filter((n) => n.tags.includes(selectedTag));
    if (subject) list = list.filter((n) => n.subject === subject);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });
  }, [notes, view, selectedFolderId, selectedTag, subject, search]);

  const handleNew = () => {
    const n = createNote({ title: "Untitled" });
    toast.success("Note created");
    router.push(`/notes/${n.id}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 max-w-7xl mx-auto">
      {/* Sidebar */}
      <aside className="space-y-3 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto no-scrollbar">
        <button onClick={handleNew} className="btn-primary w-full">
          <Plus className="w-4 h-4" /> New Note
        </button>

        <div className="card-v2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Views</div>
          {["all", "archived", "trash"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as typeof view)}
              className={cn(
                "w-full text-left text-[12px] px-2.5 py-1.5 rounded-md capitalize transition-colors",
                view === v ? "text-text-primary" : "text-text-secondary hover:bg-bg-elevated"
              )}
              style={view === v ? { background: "var(--accent-soft)" } : undefined}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="card-v2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Folders</div>
          <button
            onClick={() => setSelectedFolder(null)}
            className={cn(
              "w-full flex items-center gap-2 text-[12px] px-2.5 py-1.5 rounded-md transition-colors",
              !selectedFolderId ? "text-text-primary" : "text-text-secondary hover:bg-bg-elevated"
            )}
            style={!selectedFolderId ? { background: "var(--accent-soft)" } : undefined}
          >
            <Folder className="w-3.5 h-3.5" /> All notes
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={cn(
                "w-full flex items-center gap-2 text-[12px] px-2.5 py-1.5 rounded-md transition-colors",
                selectedFolderId === f.id ? "text-text-primary" : "text-text-secondary hover:bg-bg-elevated"
              )}
              style={{
                marginLeft: f.parentId ? 12 : 0,
                background: selectedFolderId === f.id ? "var(--accent-soft)" : undefined,
              }}
            >
              <Folder className="w-3.5 h-3.5" style={{ color: f.color }} />
              {f.name}
            </button>
          ))}
        </div>

        <div className="card-v2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Subjects</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSubject("")}
              className={cn(
                "text-[11px] px-2 py-1 rounded-md border transition-colors",
                !subject ? "text-text-primary" : "border-app text-text-secondary hover:border-strong"
              )}
              style={!subject ? { background: "var(--accent-soft)", borderColor: "rgba(124,109,250,0.30)" } : undefined}
            >
              All
            </button>
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={cn(
                  "text-[11px] px-2 py-1 rounded-md border transition-colors",
                  subject === s ? "text-text-primary" : "border-app text-text-secondary hover:border-strong"
                )}
                style={subject === s ? { background: "var(--accent-soft)", borderColor: "rgba(124,109,250,0.30)" } : undefined}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="card-v2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 10).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={cn(
                  "text-[11px] px-2 py-1 rounded-md border transition-colors",
                  selectedTag === t ? "text-text-primary" : "border-app text-text-secondary hover:border-strong"
                )}
                style={selectedTag === t ? { background: "var(--accent-soft)", borderColor: "rgba(124,109,250,0.30)" } : undefined}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes by title or content…"
              className="input-base pl-9"
            />
          </div>
          <div className="text-[12px] text-text-tertiary self-center flex items-center gap-2">
            <Filter className="w-3 h-3" />
            {filtered.length} {filtered.length === 1 ? "note" : "notes"}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card-v2 text-center py-20">
            <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <h3 className="text-[15px] font-semibold mb-1">No notes here</h3>
            <p className="text-[13px] text-text-secondary mb-4">Create your first note to get started.</p>
            <button onClick={handleNew} className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> Create note
            </button>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {filtered.map((n) => (
              <motion.div key={n.id} variants={staggerItem}>
                <Link
                  href={`/notes/${n.id}`}
                  className="card-v2 interactive block group relative overflow-hidden h-full"
                >
                  {n.coverColor && (
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: n.coverColor }} />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {n.pinned && <Pin className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" />}
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold tracking-[0.08em]"
                        style={{ background: "var(--bg-elevated)", color: n.coverColor || "var(--accent)" }}
                      >
                        {n.subject}
                      </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          togglePin(n.id);
                        }}
                        className="p-1 rounded hover:bg-bg-elevated"
                        aria-label="Pin"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleArchive(n.id);
                          toast.success(n.archived ? "Unarchived" : "Archived");
                        }}
                        className="p-1 rounded hover:bg-bg-elevated"
                        aria-label="Archive"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteNote(n.id);
                          toast.success("Moved to trash");
                        }}
                        className="p-1 rounded hover:bg-bg-elevated text-[var(--danger)]"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-[14px] font-semibold mb-1.5 line-clamp-1 tracking-tight">{n.title}</h3>
                  <p className="text-[12px] text-text-secondary line-clamp-3 mb-3 leading-relaxed">
                    {n.content.replace(/[#*`>[\]]/g, "").slice(0, 140)}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                    <div className="flex items-center gap-1.5 truncate">
                      {n.tags.slice(0, 2).map((t) => (
                        <span key={t} className="flex items-center gap-0.5">
                          <TagIcon className="w-2 h-2" />
                          {t}
                        </span>
                      ))}
                    </div>
                    <span>{formatRelative(n.updatedAt)}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
