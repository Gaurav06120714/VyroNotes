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
  SlidersHorizontal,
} from "lucide-react";
import { wordCount, readingTime, formatRelative, cn } from "@/lib/utils";
import { SUBJECTS } from "@/lib/dummy-data";
import { Subject } from "@/lib/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { useFlashcardsStore } from "@/store/flashcards.store";
import { useQuizzesStore } from "@/store/quizzes.store";
import { SlashMenu } from "@/components/notes/SlashMenu";
import { SelectionToolbar } from "@/components/notes/SelectionToolbar";
import { BacklinksPanel } from "@/components/notes/BacklinksPanel";
import { WikiLinkPopover } from "@/components/notes/WikiLinkPopover";
import { PropertiesPanel } from "@/components/notes/PropertiesPanel";
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
  const { notes, folders, updateNote, togglePin, toggleArchive, deleteNote, tags: allTags } = useNotesStore();
  const { createDeck, addCardsToDeck } = useFlashcardsStore();
  const { addQuiz } = useQuizzesStore();
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const note = notes.find((n) => n.id === id);

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [subject, setSubject] = useState<Subject>(note?.subject || "Math");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [preview, setPreview] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showProps, setShowProps] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashStart, setSlashStart] = useState(-1);

  // WikiLink popover state
  const [wikiOpen, setWikiOpen] = useState(false);
  const [wikiQuery, setWikiQuery] = useState("");
  const [wikiPosition, setWikiPosition] = useState({ top: 0, left: 0 });
  const [wikiStart, setWikiStart] = useState(-1);

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

  /** Shared line-height-based caret position estimator (avoids heavy DOM mirror). */
  const estimateCaretPos = (
    ta: HTMLTextAreaElement,
    markerIdx: number,
    newContent: string
  ): { top: number; left: number } => {
    const linesBeforeCaret = newContent.slice(0, markerIdx).split("\n").length;
    const lineHeight = 24;
    const top = linesBeforeCaret * lineHeight + 36 - ta.scrollTop;
    return { top, left: 16 };
  };

  // Slash command handling + WikiLink detection
  const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    const ta = e.target;
    const caret = ta.selectionStart;

    // ── WikiLink `[[` detection ──────────────────────────────────────────────
    // Find the last `[[` that is still open (no matching `]]` after it).
    const doubleBracketIdx = newContent.lastIndexOf("[[", caret - 1);
    const closingIdx       = newContent.indexOf("]]", doubleBracketIdx);
    const wikiActive =
      doubleBracketIdx !== -1 &&
      doubleBracketIdx < caret &&
      (closingIdx === -1 || closingIdx >= caret);

    if (wikiActive) {
      const query = newContent.slice(doubleBracketIdx + 2, caret);
      // Close if user inserted a newline or a closing bracket inside the query
      if (query.includes("\n") || query.includes("]]")) {
        setWikiOpen(false);
      } else {
        setWikiStart(doubleBracketIdx);
        setWikiQuery(query);
        const wrapRect = editorWrapRef.current?.getBoundingClientRect();
        if (wrapRect) {
          const { top, left } = estimateCaretPos(ta, doubleBracketIdx, newContent);
          setWikiPosition({ top: Math.min(top, wrapRect.height - 280), left });
        }
        setWikiOpen(true);
        // WikiLink takes priority — close slash menu
        setSlashOpen(false);
        return;
      }
    } else {
      setWikiOpen(false);
    }

    // ── Slash command detection ──────────────────────────────────────────────
    const lineStart = newContent.lastIndexOf("\n", caret - 1) + 1;
    const slashIdx  = newContent.lastIndexOf("/", caret - 1);

    if (slashIdx >= lineStart && newContent.slice(lineStart, slashIdx).trim() === "") {
      const query = newContent.slice(slashIdx + 1, caret);
      if (/\s/.test(query)) {
        setSlashOpen(false);
        return;
      }
      setSlashStart(slashIdx);
      setSlashQuery(query);
      const rect = ta.getBoundingClientRect();
      const wrapRect = editorWrapRef.current?.getBoundingClientRect();
      if (wrapRect) {
        const { top, left } = estimateCaretPos(ta, slashIdx, newContent);
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
      // Kick off async AI continuation after inserting a placeholder
      insertText = "\n\n> AI: generating…\n\n";
      toast.loading("Generating AI continuation…", { id: "ai-cont" });
      const beforeText = content.slice(0, slashStart);
      const contextText = beforeText.slice(-800); // last 800 chars for context
      fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are a smart note-taking assistant. Continue the note from where it left off. Be concise and use markdown.",
          prompt: contextText,
        }),
      })
        .then((r) => r.json())
        .then((data: { text?: string }) => {
          if (data.text) {
            setContent((prev) =>
              prev.replace("> AI: generating…", "> AI: " + data.text!.replace(/\n/g, "\n> "))
            );
            toast.success("AI continuation inserted", { id: "ai-cont" });
          }
        })
        .catch(() => {
          toast.error("AI continuation failed", { id: "ai-cont" });
        });
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

  const handleAIAction = async (action: "summarize" | "explain" | "make-question" | "translate") => {
    const selectedText = selectionToolbar.text;
    setSelectionToolbar((s) => ({ ...s, visible: false }));

    const systemPrompts = {
      summarize: "You are a concise academic study assistant. Summarize the following passage into clear bullet points. Use markdown.",
      explain: "You are a tutor. Explain this passage clearly in simple terms, then give a real-world example.",
      "make-question": "Generate 3 quiz questions from this passage. Use markdown numbered list.",
      translate: "Paraphrase this passage in simpler academic English, preserving technical terms. Use markdown.",
    };

    const toastMsg = {
      summarize: "Summarizing selection…",
      explain: "Generating explanation…",
      "make-question": "Generating questions…",
      translate: "Paraphrasing…",
    };

    const toId = toast.loading(toastMsg[action]);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: selectedText, system: systemPrompts[action] }),
      });
      const data = await res.json() as { text?: string; error?: string };
      toast.dismiss(toId);
      if (!res.ok || !data.text) {
        toast.error(data.error ?? "AI request failed");
        return;
      }
      // Insert result as a blockquote after current cursor / selection
      const ta = editorRef.current;
      if (ta) {
        const insertAt = ta.selectionEnd;
        const before = content.slice(0, insertAt);
        const after  = content.slice(insertAt);
        setContent(before + "\n\n> **AI:** " + data.text.replace(/\n/g, "\n> ") + "\n\n" + after);
        toast.success("AI response inserted");
      }
    } catch {
      toast.dismiss(toId);
      toast.error("Failed to reach AI service");
    }
  };

  const handleWikiPick = (title: string) => {
    const ta = editorRef.current;
    if (!ta || wikiStart < 0) return;
    const caret = ta.selectionStart;
    const before = content.slice(0, wikiStart);       // everything before `[[`
    const after  = content.slice(caret);               // everything after cursor
    const inserted = `[[${title}]]`;
    const next = before + inserted + after;
    setContent(next);
    setWikiOpen(false);
    setTimeout(() => {
      ta.focus();
      const pos = before.length + inserted.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // WikiLink popover consumes nav keys via window capture listener
    if (wikiOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
        if (e.key === "Enter") e.preventDefault();
        return;
      }
    }
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

  const callGenerate = async (
    system: string,
    prompt: string,
    label: string
  ): Promise<string | null> => {
    setAiLoading(label);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        toast.error(data.error ?? "AI request failed");
        return null;
      }
      return data.text;
    } catch {
      toast.error("Failed to reach AI service");
      return null;
    } finally {
      setAiLoading(null);
    }
  };

  const aiActions = [
    {
      label: "Summarize",
      run: async () => {
        const text = await callGenerate(
          "You are a concise academic study assistant. Summarize the following note content into clear bullet points. Use markdown formatting.",
          content || title,
          "Summarize"
        );
        if (text) {
          setContent("## AI Summary\n\n" + text + "\n\n---\n\n" + content);
          toast.success("AI summary added at top");
        }
      },
    },
    {
      label: "Generate Quiz",
      run: async () => {
        const text = await callGenerate(
          'Generate 5 multiple-choice quiz questions from this content. Return ONLY a JSON array: [{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]',
          content || title,
          "Generate Quiz"
        );
        if (!text) return;
        try {
          // Strip markdown code fences if present
          const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
          const start = cleaned.indexOf("[");
          const end   = cleaned.lastIndexOf("]");
          if (start === -1 || end === -1) throw new Error("No JSON array found");
          const questions = JSON.parse(cleaned.slice(start, end + 1)) as Array<{
            question: string;
            options: string[];
            correctIndex: number;
            explanation?: string;
          }>;
          const { uid: uidFn } = await import("@/lib/utils");
          const quiz = {
            id: uidFn(),
            title: `${title} — AI Quiz`,
            subject,
            description: `Auto-generated from "${title}"`,
            questions: questions.map((q) => ({
              id: uidFn(),
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
            })),
            attempts: 0,
            timePerQuestion: 60,
            createdAt: new Date().toISOString(),
          };
          addQuiz(quiz);
          toast.success("Quiz generated — check the Quizzes page");
          router.push("/quizzes");
        } catch {
          toast.error("Could not parse quiz response — try again");
        }
      },
    },
    {
      label: "Make Flashcards",
      run: async () => {
        const text = await callGenerate(
          'You are a study card generator. Given the following note, generate 8-12 flashcards as a JSON array: [{"front": "question", "back": "answer"}]. Return ONLY valid JSON, no other text.',
          content || title,
          "Make Flashcards"
        );
        if (!text) return;
        try {
          const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
          const start = cleaned.indexOf("[");
          const end   = cleaned.lastIndexOf("]");
          if (start === -1 || end === -1) throw new Error("No JSON array found");
          const cards = JSON.parse(cleaned.slice(start, end + 1)) as Array<{ front: string; back: string }>;
          // Create deck then populate
          const { uid: uidFn } = await import("@/lib/utils");
          const deckId = uidFn();
          // Use createDeck to add empty deck, then addCardsToDeck
          createDeck(`${title} — AI Deck`, subject);
          // We need the deckId — createDeck doesn't return it, so grab the latest
          const storeDecks = (await import("@/store/flashcards.store")).useFlashcardsStore.getState().decks;
          const newDeck = storeDecks[storeDecks.length - 1];
          if (newDeck) {
            addCardsToDeck(newDeck.id, cards);
          }
          void deckId;
          toast.success(`${cards.length} flashcards created`);
        } catch {
          toast.error("Could not parse flashcard response — try again");
        }
      },
    },
    {
      label: "Key Concepts",
      run: async () => {
        const text = await callGenerate(
          "Extract the 5-8 most important concepts from this note as a markdown bullet list with one-line explanations.",
          content || title,
          "Key Concepts"
        );
        if (text) {
          setContent(content + "\n\n## Key Concepts\n\n" + text);
          toast.success("Key concepts appended");
        }
      },
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
            <button
              onClick={() => setShowProps(!showProps)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] transition-colors",
                showProps ? "text-text-primary" : "hover:bg-bg-elevated text-text-secondary"
              )}
              style={showProps ? { background: "var(--accent-soft)" } : undefined}
              title="Properties"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Props
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
                    onClick={() => { void a.run(); }}
                    disabled={aiLoading !== null}
                    className="px-3 py-2 text-[12px] rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    {aiLoading === a.label && <Loader2 className="w-3 h-3 animate-spin" />}
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor grid: editor + (preview) + backlinks + (properties) */}
          <div
            className={cn(
              "grid gap-4",
              focusMode
                ? "grid-cols-1"
                : preview
                ? showProps
                  ? "grid-cols-1 lg:grid-cols-[1fr_1fr_240px_240px]"
                  : "grid-cols-1 lg:grid-cols-[1fr_1fr_240px]"
                : showProps
                ? "grid-cols-1 lg:grid-cols-[1fr_240px_240px]"
                : "grid-cols-1 lg:grid-cols-[1fr_240px]"
            )}
          >
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
              <WikiLinkPopover
                open={wikiOpen}
                query={wikiQuery}
                position={wikiPosition}
                onPick={handleWikiPick}
                onClose={() => setWikiOpen(false)}
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
            <AnimatePresence>
              {showProps && !focusMode && (
                <PropertiesPanel
                  note={note}
                  content={content}
                  tags={tags}
                  setTags={setTags}
                  allTags={allTags}
                  folders={folders}
                  updateNote={updateNote}
                />
              )}
            </AnimatePresence>
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
