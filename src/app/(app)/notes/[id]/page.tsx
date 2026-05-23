"use client";
import { useNotesStore } from "@/store/notes.store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAutosave } from "@/hooks/useAutosave";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Quote,
  Link2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Pin,
  Archive,
  Trash2,
  ArrowLeft,
  Sparkles,
  Save,
  Loader2,
  Plus,
  X,
  Maximize2,
  FileText,
  BookOpen,
  Minimize2,
} from "lucide-react";
import { wordCount, readingTime, formatRelative, cn } from "@/lib/utils";
import { SUBJECTS } from "@/lib/dummy-data";
import { Subject } from "@/lib/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { useFlashcardsStore } from "@/store/flashcards.store";
import { SlashMenu } from "@/components/notes/SlashMenu";
import { SelectionToolbar } from "@/components/notes/SelectionToolbar";
import { BacklinksPanel } from "@/components/notes/BacklinksPanel";
import { AnimatePresence, motion } from "framer-motion";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

interface SlashAction {
  id: string;
  label: string;
  hint: string;
  insert: string;
}

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { notes, updateNote, togglePin, toggleArchive, deleteNote, tags: allTags } = useNotesStore();
  const { createDeck } = useFlashcardsStore();

  const note = notes.find((n) => n.id === id);

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [subject, setSubject] = useState<Subject>(note?.subject || "Math");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [preview, setPreview] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashStart, setSlashStart] = useState(-1);

  // Selection toolbar state
  const [selectionToolbar, setSelectionToolbar] = useState<{ visible: boolean; top: number; left: number; text: string }>({
    visible: false,
    top: 0,
    left: 0,
    text: "",
  });

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSubject(note.subject);
      setTags(note.tags);
    }
  }, [note]);

  const status = useAutosave(
    { title, content, subject, tags },
    (v) => {
      if (note) updateNote(note.id, v);
    },
    1200
  );

  const words = useMemo(() => wordCount(content), [content]);
  const minutes = useMemo(() => readingTime(content), [content]);

  // F toggles focus mode
  useKeyboardShortcut("f", () => {
    if ((document.activeElement as HTMLElement | null)?.tagName === "TEXTAREA") return;
    if ((document.activeElement as HTMLElement | null)?.tagName === "INPUT") return;
    setFocusMode((f) => !f);
  });

  if (!note) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
        <h2 className="text-[17px] font-semibold mb-1">Note not found</h2>
        <p className="text-[13px] text-text-secondary mb-4">It may have been deleted.</p>
        <Link href="/notes" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to notes
        </Link>
      </div>
    );
  }

  const insert = (before: string, after = "") => {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // Slash command handling
  const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    const ta = e.target;
    const caret = ta.selectionStart;
    const lineStart = newContent.lastIndexOf("\n", caret - 1) + 1;
    const slashIdx = newContent.lastIndexOf("/", caret - 1);

    // Slash must be at start of line (only whitespace before)
    if (slashIdx >= lineStart && newContent.slice(lineStart, slashIdx).trim() === "") {
      const query = newContent.slice(slashIdx + 1, caret);
      // Cancel if user typed space
      if (/\s/.test(query)) {
        setSlashOpen(false);
        return;
      }
      setSlashStart(slashIdx);
      setSlashQuery(query);
      // Compute position
      const rect = ta.getBoundingClientRect();
      const wrapRect = editorWrapRef.current?.getBoundingClientRect();
      if (wrapRect) {
        // Estimate via measured caret coords using a hidden div mirror would be heavy.
        // Use line-based estimate: count newlines up to caret.
        const linesBeforeCaret = newContent.slice(0, slashIdx).split("\n").length;
        const lineHeight = 24; // rough
        const top = (linesBeforeCaret * lineHeight) + 36 - ta.scrollTop;
        const left = 16; // gutter
        setSlashPosition({ top: Math.min(top, rect.height - 280), left });
      }
      setSlashOpen(true);
    } else {
      setSlashOpen(false);
    }
  };

  const handleSlashPick = (action: SlashAction) => {
    const ta = editorRef.current;
    if (!ta || slashStart < 0) return;
    const caret = ta.selectionStart;
    const before = content.slice(0, slashStart);
    const after = content.slice(caret);
    let insertText = action.insert;
    if (action.id === "ai") {
      insertText = "\n\n> AI continuation: Building on your last point, the next concept to explore is the relationship between rate of change and accumulation.\n\n";
      toast.success("AI continuation inserted");
    }
    const next = before + insertText + after;
    setContent(next);
    setSlashOpen(false);
    setTimeout(() => {
      ta.focus();
      const cursorPos = (before + insertText).length;
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  // Selection handling for AI toolbar
  const checkSelection = useCallback(() => {
    const ta = editorRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    if (selectionEnd > selectionStart) {
      const selected = content.slice(selectionStart, selectionEnd).trim();
      if (selected.length > 4) {
        const rect = ta.getBoundingClientRect();
        // Approx position above the selection start
        setSelectionToolbar({
          visible: true,
          top: rect.top + 8,
          left: Math.max(rect.left + 16, rect.left + rect.width / 2 - 130),
          text: selected,
        });
        return;
      }
    }
    setSelectionToolbar((s) => ({ ...s, visible: false }));
  }, [content]);

  useEffect(() => {
    const handler = () => checkSelection();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [checkSelection]);

  const handleAIAction = (action: "summarize" | "explain" | "make-question" | "translate") => {
    const map = {
      summarize: "Summary: this passage discusses the core concept and its implications. Key points captured below.",
      explain: "Plain explanation: think of it as the connection between input changes and output responses. The technical version is exact, but the intuition is just 'sensitivity.'",
      "make-question": "Quiz question: explain the relationship described in this passage with a worked example.",
      translate: "Translation preview: technical terms preserved; rest paraphrased clearly.",
    };
    toast.success(map[action]);
    setSelectionToolbar((s) => ({ ...s, visible: false }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen) {
      // Slash menu handles its own keys via window listener
      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
        if (e.key === "Enter") e.preventDefault();
        return;
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insert("**", "**");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insert("*", "*");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      toast.success("Saved");
    }
  };

  const aiActions = [
    {
      label: "Summarize",
      run: () => {
        toast.success("AI summary added at top");
        setContent("## AI Summary\n- Key idea: ...\n- Important formula: ...\n- Watch out for: ...\n\n---\n\n" + content);
      },
    },
    {
      label: "Generate Quiz",
      run: () => {
        toast.success("Quiz generated — check the Quizzes page");
        router.push("/quizzes");
      },
    },
    {
      label: "Make Flashcards",
      run: () => {
        createDeck(`${title} — Auto Deck`, subject);
        toast.success("Flashcard deck created");
      },
    },
    {
      label: "Key Concepts",
      run: () => toast.success("Key concepts tagged in your note"),
    },
  ];

  const addTag = (t: string) => {
    const cleaned = t.trim().replace(/^#/, "");
    if (!cleaned) return;
    if (tags.includes(cleaned)) return;
    setTags([...tags, cleaned]);
    setNewTag("");
  };

  return (
    <div className={cn("mx-auto", focusMode ? "max-w-3xl" : "max-w-7xl")}>
      {/* Focus mode exit pill */}
      <AnimatePresence>
        {focusMode && (
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => setFocusMode(false)}
            className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-3 h-8 rounded-full glass-strong text-[12px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <Minimize2 className="w-3 h-3" /> Exit focus
          </motion.button>
        )}
      </AnimatePresence>

      {/* Header */}
      {!focusMode && (
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Link href="/notes" className="p-2 rounded-md hover:bg-bg-elevated transition-colors text-text-secondary">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="text-[11px] text-text-tertiary flex items-center gap-2">
              <span>Last edited {formatRelative(note.updatedAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {status === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
                {status === "saved" && <Save className="w-3 h-3 text-[var(--success)]" />}
                {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "All changes saved"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setReadingMode(!readingMode)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] transition-colors",
                readingMode ? "text-text-primary" : "hover:bg-bg-elevated text-text-secondary"
              )}
              style={readingMode ? { background: "var(--accent-soft)" } : undefined}
            >
              <BookOpen className="w-3.5 h-3.5" /> Read
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] transition-colors",
                showAI ? "text-text-primary" : "hover:bg-bg-elevated text-text-secondary"
              )}
              style={showAI ? { background: "var(--accent-soft)" } : undefined}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI
            </button>
            {!readingMode && (
              <button onClick={() => setPreview(!preview)} className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] hover:bg-bg-elevated text-text-secondary">
                {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {preview ? "Hide preview" : "Show preview"}
              </button>
            )}
            <button onClick={() => setFocusMode(true)} className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary" title="Focus mode (press F)">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                togglePin(note.id);
                toast.success(note.pinned ? "Unpinned" : "Pinned");
              }}
              className={cn("p-2 rounded-md hover:bg-bg-elevated", note.pinned ? "text-[#f59e0b]" : "text-text-secondary")}
              title="Pin"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                toggleArchive(note.id);
                toast.success(note.archived ? "Unarchived" : "Archived");
              }}
              className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary"
              title="Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                deleteNote(note.id);
                toast.success("Moved to trash");
                router.push("/notes");
              }}
              className="p-2 rounded-md hover:bg-bg-elevated text-[var(--danger)]"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Reading mode */}
      {readingMode ? (
        <div className="card-v2 min-h-[60vh]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-[36px] font-bold outline-none mb-6 placeholder:text-text-tertiary tracking-tight"
          />
          <div className="prose-reading prose-app">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*Nothing to read yet.*"}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <>
          {!focusMode && (
            <div className="card-v2 mb-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled note"
                className="w-full bg-transparent text-[28px] md:text-[32px] font-bold tracking-tight outline-none mb-3 placeholder:text-text-tertiary"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="bg-[var(--bg-elevated)] border border-app rounded-md px-2.5 py-1 text-[11px] text-text-secondary"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 flex-wrap">
                  {tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-md text-accent flex items-center gap-1" style={{ background: "var(--accent-soft)" }}>
                      #{t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-text-primary">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag(newTag)}
                      list="tag-suggestions"
                      placeholder="Add tag…"
                      className="text-[11px] bg-transparent outline-none placeholder:text-text-tertiary w-24"
                    />
                    <datalist id="tag-suggestions">
                      {allTags.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                    {newTag && (
                      <button onClick={() => addTag(newTag)} className="p-0.5 rounded hover:bg-bg-elevated">
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="ml-auto text-[10px] text-text-tertiary flex items-center gap-3">
                  <span>{words} words</span>
                  <span>·</span>
                  <span>{minutes} min read</span>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          {!focusMode && (
            <div className="card-v2 mb-4 p-1.5 flex items-center gap-0.5 overflow-x-auto no-scrollbar">
              {[
                { icon: Heading1, fn: () => insert("# "), title: "Heading 1" },
                { icon: Heading2, fn: () => insert("## "), title: "Heading 2" },
                { icon: Bold, fn: () => insert("**", "**"), title: "Bold (⌘B)" },
                { icon: Italic, fn: () => insert("*", "*"), title: "Italic (⌘I)" },
                { icon: List, fn: () => insert("- "), title: "Bullet" },
                { icon: ListOrdered, fn: () => insert("1. "), title: "Numbered" },
                { icon: Quote, fn: () => insert("> "), title: "Quote" },
                { icon: Code, fn: () => insert("`", "`"), title: "Code" },
                { icon: Link2, fn: () => insert("[", "](url)"), title: "Link" },
                { icon: ImageIcon, fn: () => insert("![alt](", ")"), title: "Image" },
              ].map((b, i) => (
                <button
                  key={i}
                  onClick={b.fn}
                  title={b.title}
                  aria-label={b.title}
                  className="p-1.5 rounded-md hover:bg-bg-elevated text-text-secondary"
                >
                  <b.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}

          {/* AI Panel */}
          {showAI && (
            <div className="card-v2 mb-4" style={{ borderColor: "rgba(124,109,250,0.30)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-[13px] font-semibold">AI actions</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {aiActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={a.run}
                    className="px-3 py-2 text-[12px] rounded-md transition-colors"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor grid: editor + (preview || backlinks) */}
          <div className={cn("grid gap-4", focusMode ? "grid-cols-1" : (preview ? "grid-cols-1 lg:grid-cols-[1fr_1fr_240px]" : "grid-cols-1 lg:grid-cols-[1fr_240px]"))}>
            <div ref={editorWrapRef} className="relative">
              <textarea
                id="md-editor"
                ref={editorRef}
                value={content}
                onChange={onContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Start writing in markdown… (try / for commands)"
                className="card-v2 editor-area w-full min-h-[60vh] outline-none resize-none placeholder:text-text-tertiary"
              />
              <SlashMenu
                open={slashOpen}
                query={slashQuery}
                position={slashPosition}
                onPick={handleSlashPick}
                onClose={() => setSlashOpen(false)}
              />
            </div>
            {preview && !focusMode && (
              <div className="card-v2 min-h-[60vh] overflow-auto">
                <div className="prose-app">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*Nothing to preview yet.*"}</ReactMarkdown>
                </div>
              </div>
            )}
            {!focusMode && <BacklinksPanel currentNoteId={note.id} currentTitle={note.title} />}
          </div>
        </>
      )}

      {/* Selection AI toolbar */}
      <SelectionToolbar
        visible={selectionToolbar.visible}
        position={{ top: selectionToolbar.top, left: selectionToolbar.left }}
        onAction={handleAIAction}
      />
    </div>
  );
}
