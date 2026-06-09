"use client";
import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Send,
  Sparkles,
  Bookmark,
  Highlighter,
  Calculator,
  Search,
  Link as LinkIcon,
  Plus,
  X,
  Copy,
  CheckCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNotesStore } from "@/store/notes.store";
import { useRouter } from "next/navigation";
import type { Formula, PageText } from "@/lib/pdf/parser";
import type { OllamaMessage } from "@/lib/ollama";

interface ChatMsg {
  id: string;
  role: "user" | "ai";
  content: string;
  page?: number;
}

interface Highlight {
  id: string;
  page: number;
  text: string;
  color: "yellow" | "green" | "pink";
}

interface BookmarkItem {
  id: string;
  page: number;
  label: string;
}

interface ParsedDoc {
  name: string;
  size: number;
  pageCount: number;
  pages: PageText[];
  text: string;
  formulas: Formula[];
}

type Tab = "document" | "chat" | "formulas" | "highlights" | "bookmarks";

const SUGGESTED_QUESTIONS = [
  "Summarize this document",
  "What are the key formulas?",
  "List the main concepts",
  "Explain the most important equation",
];

function buildPDFContext(doc: ParsedDoc, maxChars = 6000): string {
  
  const truncated = doc.text.slice(0, maxChars);
  return (
    `Document: "${doc.name}" (${doc.pageCount} pages)\n\n` +
    `Extracted content:\n${truncated}` +
    (doc.text.length > maxChars ? "\n\n[...document continues...]" : "")
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfChatPage() {
  const router = useRouter();
  const { createNote } = useNotesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [doc, setDoc] = useState<ParsedDoc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Upload a PDF and I'll help you understand it. I'll cite the page when I can.",
    },
  ]);

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const filteredHighlights = useMemo(
    () =>
      search
        ? highlights.filter((h) => h.text.toLowerCase().includes(search.toLowerCase()))
        : highlights,
    [highlights, search]
  );

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pdf/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" })) as { error: string };
        throw new Error(err.error ?? "Upload failed");
      }

      const data = await res.json() as ParsedDoc;
      setDoc(data);
      setPageIdx(0);
      setMessages([
        {
          id: "loaded",
          role: "ai",
          content: `I've loaded "${data.name}" (${data.pageCount} pages, ${data.formulas.length} formulas detected). Ask me anything about it!`,
        },
      ]);
      setTab("chat");
      toast.success(`PDF loaded — ${data.pageCount} pages`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse PDF";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || busy) return;

      const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content };
      const aiMsg: ChatMsg = { id: (Date.now() + 1).toString(), role: "ai", content: "" };

      setMessages((m) => [...m, userMsg, aiMsg]);
      setInput("");
      setBusy(true);

      const systemContent = doc
        ? `You are an AI study assistant. The user has uploaded a PDF document. Here is the extracted content:\n\n${buildPDFContext(doc)}\n\nAnswer questions based on this document. Cite page numbers when relevant (e.g. "On page 2..."). Be concise.`
        : "You are an AI study assistant. Help the user understand their document.";

      const history = messages
        .filter((m) => m.role === "user" || m.role === "ai")
        .slice(-12)
        .map((m): OllamaMessage => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        }));

      const ollamaMessages: OllamaMessage[] = [
        { role: "system", content: systemContent },
        ...history,
        { role: "user", content },
      ];

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: ollamaMessages }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errData = await res.json().catch(() => ({ error: "AI unavailable" })) as { error: string };
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "ai") {
              copy[copy.length - 1] = { ...last, content: `Error: ${errData.error}` };
            }
            return copy;
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "ai") {
              copy[copy.length - 1] = { ...last, content: fullText };
            }
            return copy;
          });
        }

        const pageMatch = fullText.match(/page\s+(\d+)/i);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1]);
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "ai") {
              copy[copy.length - 1] = { ...last, page: pageNum };
            }
            return copy;
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "ai" && last.content === "") {
            copy[copy.length - 1] = {
              ...last,
              content: "Failed to reach Ollama. Make sure it's running on port 11434.",
            };
          }
          return copy;
        });
      } finally {
        setBusy(false);
        abortRef.current = null;
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [busy, doc, messages]
  );

  const copyFormula = (formula: Formula) => {
    navigator.clipboard.writeText(formula.formula);
    setCopiedId(formula.formula);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveFormulaAsNote = (formula: Formula) => {
    const id = createNote({
      title: `Formula: ${formula.formula.slice(0, 40)}`,
      content: `## Formula\n\n\`\`\`\n${formula.formula}\n\`\`\`\n\n**Subject:** ${formula.subject}\n**Source:** ${doc?.name ?? "PDF"}, page ${formula.page}${formula.context ? `\n\n**Context:**\n> ${formula.context}` : ""}`,
      tags: ["formula", formula.subject, "pdf"],
    });
    toast.success("Saved as note");
    router.push(`/notes/${id}`);
  };

  const saveAsNote = (msg: ChatMsg) => {
    const id = createNote({
      title: `From PDF: ${doc?.name ?? "Document"}`,
      content:
        msg.content +
        (msg.page ? `\n\n*Source: page ${msg.page} of ${doc?.name ?? "PDF"}*` : ""),
      tags: ["pdf", "ai-generated"],
    });
    toast.success("Saved as note");
    router.push(`/notes/${id}`);
  };

  const currentPage = doc?.pages[pageIdx];

  if (!doc) {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <h1 className="text-[28px] font-bold tracking-tight mb-1">PDF Workspace</h1>
        <p className="text-text-secondary text-[14px] mb-8">
          Upload any textbook chapter and chat with it. Highlight, bookmark, extract formulas.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="card-v2 border-2 border-dashed border-app hover:border-accent/40 hover:bg-[var(--accent-soft)] cursor-pointer transition-all p-12 text-center"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <p className="text-[14px] text-text-secondary">Parsing PDF…</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-accent mx-auto mb-3" />
              <h2 className="text-[17px] font-semibold mb-1">Drop a PDF here</h2>
              <p className="text-[13px] text-text-secondary mb-4">
                Or click to browse · Max 50 MB
              </p>
              <button className="btn-primary" type="button">
                <Upload className="w-4 h-4" /> Choose PDF
              </button>
            </>
          )}
        </div>

        {uploadError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mt-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{uploadError}</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = "";
          }}
        />

        <div className="grid grid-cols-3 gap-3 mt-6 text-[12px] text-text-tertiary">
          <Feature icon={<Highlighter className="w-4 h-4 text-accent" />} label="Highlights & annotations" />
          <Feature icon={<Bookmark className="w-4 h-4 text-accent" />} label="Smart bookmarks" />
          <Feature icon={<Calculator className="w-4 h-4 text-accent" />} label="Auto formula extraction" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-160px)]">
      {}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[14px] truncate">{doc.name}</div>
            <div className="text-[11px] text-text-tertiary">
              {doc.pageCount} pages · {formatSize(doc.size)} · {doc.formulas.length} formulas
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setDoc(null);
            setMessages([
              {
                id: "welcome",
                role: "ai",
                content: "Upload a PDF and I'll help you understand it.",
              },
            ]);
          }}
          className="btn-ghost text-[12px]"
        >
          <X className="w-3.5 h-3.5" /> Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 h-full">
        {}
        <div className="card-v2 overflow-hidden flex flex-col" style={{ padding: 0 }}>
          {}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-app">
            <div className="flex items-center gap-2 text-[12px] text-text-secondary">
              <button
                onClick={() => setPageIdx(Math.max(0, pageIdx - 1))}
                disabled={pageIdx === 0}
                className="px-2 py-1 rounded hover:bg-[var(--bg-elevated)] disabled:opacity-40"
                aria-label="Previous page"
              >
                ←
              </button>
              <span>
                Page {pageIdx + 1} of {doc.pageCount}
              </span>
              <button
                onClick={() => setPageIdx(Math.min(doc.pageCount - 1, pageIdx + 1))}
                disabled={pageIdx === doc.pageCount - 1}
                className="px-2 py-1 rounded hover:bg-[var(--bg-elevated)] disabled:opacity-40"
                aria-label="Next page"
              >
                →
              </button>
            </div>
            <button
              onClick={() =>
                setBookmarks((b) => [
                  ...b,
                  { id: Date.now().toString(), page: pageIdx + 1, label: `Page ${pageIdx + 1}` },
                ])
              }
              className="text-[11px] px-2 py-1 rounded hover:bg-[var(--bg-elevated)] text-text-tertiary hover:text-accent inline-flex items-center gap-1"
            >
              <Bookmark className="w-3 h-3" /> Bookmark
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-white text-black">
            {currentPage ? (
              <div className="max-w-prose mx-auto">
                <p className="text-[11px] text-gray-400 mb-4 font-mono">Page {currentPage.page}</p>
                <pre className="whitespace-pre-wrap text-[14px] leading-relaxed font-sans">
                  {currentPage.text || "(No text extracted from this page)"}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-[14px]">
                No page content
              </div>
            )}
          </div>
        </div>

        {}
        <div className="card-v2 flex flex-col overflow-hidden" style={{ padding: 0 }}>
          <div className="flex border-b border-app overflow-x-auto">
            {(["chat", "document", "formulas", "highlights", "bookmarks"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 flex-1 px-3 py-2.5 text-[11px] capitalize transition-colors border-b-2 ${
                  tab === t
                    ? "border-accent text-accent"
                    : "border-transparent text-text-tertiary hover:text-text-primary"
                }`}
              >
                {t}
                {t === "formulas" && doc.formulas.length > 0 && (
                  <span className="ml-1 text-[9px] bg-accent/20 text-accent rounded-full px-1.5">
                    {doc.formulas.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {}
            {tab === "chat" && (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`group max-w-[88%] p-3 rounded-[var(--radius-md)] text-[13px] leading-relaxed ${
                          m.role === "user"
                            ? "bg-[var(--accent-soft)] text-text-primary"
                            : "bg-[var(--bg-elevated)] text-text-secondary"
                        }`}
                      >
                        {m.content.split("\n").map((line, i) => (
                          <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                            {line}
                          </p>
                        ))}
                        {m.role === "ai" && busy && m.id === messages[messages.length - 1]?.id && m.content === "" && (
                          <span className="inline-flex gap-0.5 items-center ml-1">
                            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
                          </span>
                        )}
                        {m.role === "ai" && (m.page || m.content) && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-app">
                            {m.page && (
                              <button
                                onClick={() => {
                                  setPageIdx(Math.min(doc.pageCount - 1, m.page! - 1));
                                  setTab("document");
                                }}
                                className="text-[10px] text-accent hover:underline inline-flex items-center gap-1"
                              >
                                <LinkIcon className="w-2.5 h-2.5" /> Page {m.page}
                              </button>
                            )}
                            {m.content && (
                              <button
                                onClick={() => saveAsNote(m)}
                                className="text-[10px] text-text-tertiary hover:text-accent inline-flex items-center gap-1 ml-auto"
                              >
                                <Plus className="w-2.5 h-2.5" /> Save as note
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {busy && (
                  <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary p-3">
                    <Sparkles className="w-3 h-3 animate-pulse text-accent" />
                    Thinking…
                  </div>
                )}
                {messages.length <= 2 && !busy && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
                      Suggested
                    </div>
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="block w-full text-left text-[12px] px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-soft)] text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {}
            {tab === "document" && (
              <div className="space-y-2">
                <p className="text-[11px] text-text-tertiary mb-3">
                  {doc.pageCount} pages · {doc.text.length.toLocaleString()} characters
                </p>
                {doc.pages.map((p) => (
                  <button
                    key={p.page}
                    onClick={() => { setPageIdx(p.page - 1); setTab("chat"); }}
                    className="w-full text-left p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-soft)] transition-colors"
                  >
                    <div className="text-[11px] font-medium text-text-secondary mb-1">Page {p.page}</div>
                    <div className="text-[11px] text-text-tertiary truncate">
                      {p.text.slice(0, 80) || "(empty)"}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {}
            {tab === "formulas" && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                  {doc.formulas.length} auto-extracted formulas
                </div>
                {doc.formulas.length === 0 && (
                  <div className="text-center py-8 text-[12px] text-text-tertiary">
                    No formulas detected in this document.
                  </div>
                )}
                {doc.formulas.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-wide text-text-tertiary">
                        {f.subject} · p.{f.page}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyFormula(f)}
                          className="p-1 rounded hover:bg-[var(--bg-app)] text-text-tertiary hover:text-accent transition-colors"
                          title="Copy formula"
                        >
                          {copiedId === f.formula ? (
                            <CheckCheck className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => saveFormulaAsNote(f)}
                          className="p-1 rounded hover:bg-[var(--bg-app)] text-text-tertiary hover:text-accent transition-colors"
                          title="Save as note"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-[12px] break-all">{f.formula}</div>
                    {f.context && (
                      <div className="text-[10px] text-text-tertiary mt-1 truncate" title={f.context}>
                        {f.context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {}
            {tab === "highlights" && (
              <div>
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search highlights"
                    className="input-base pl-8 text-[12px] py-2"
                  />
                </div>
                {filteredHighlights.length === 0 ? (
                  <div className="text-center py-8 text-[12px] text-text-tertiary">
                    {highlights.length === 0 ? "No highlights yet" : "No matching highlights"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredHighlights.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border-l-2"
                        style={{
                          borderColor:
                            h.color === "yellow" ? "#facc15" : h.color === "green" ? "#34c98e" : "#ec4899",
                        }}
                      >
                        <div className="text-[12px] mb-1">{h.text}</div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setPageIdx(h.page - 1)}
                            className="text-[10px] text-accent hover:underline"
                          >
                            Go to page {h.page}
                          </button>
                          <button
                            onClick={() =>
                              setHighlights((hl) => hl.filter((x) => x.id !== h.id))
                            }
                            className="text-[10px] text-text-tertiary hover:text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {currentPage?.text && (
                  <button
                    onClick={() =>
                      setHighlights((hl) => [
                        ...hl,
                        {
                          id: Date.now().toString(),
                          page: pageIdx + 1,
                          text: currentPage.text.slice(0, 120) + "…",
                          color: "yellow",
                        },
                      ])
                    }
                    className="mt-3 w-full text-[12px] btn-ghost"
                  >
                    <Highlighter className="w-3.5 h-3.5" /> Highlight current page excerpt
                  </button>
                )}
              </div>
            )}

            {}
            {tab === "bookmarks" && (
              <div className="space-y-2">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-8 text-[12px] text-text-tertiary">
                    No bookmarks yet. Click &quot;Bookmark&quot; in the page nav.
                  </div>
                ) : (
                  bookmarks.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setPageIdx(b.page - 1)}
                      className="w-full text-left p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-soft)] transition-colors flex items-start gap-2"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate">{b.label}</div>
                        <div className="text-[10px] text-text-tertiary">Page {b.page}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {}
          {tab === "chat" && (
            <div className="border-t border-app p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask about this PDF…"
                  rows={1}
                  className="input-base resize-none text-[13px] py-2"
                  disabled={busy}
                />
                {busy ? (
                  <button
                    onClick={() => abortRef.current?.abort()}
                    className="btn-ghost px-3 text-[12px]"
                    aria-label="Stop"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim()}
                    className="btn-primary disabled:opacity-40 px-3"
                    aria-label="Send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="card-v2 flex items-center gap-2.5" style={{ padding: 12 }}>
      {icon}
      <span className="text-[12px] text-text-secondary">{label}</span>
    </div>
  );
}
