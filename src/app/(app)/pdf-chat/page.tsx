"use client";
import { useState, useRef } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { useNotesStore } from "@/store/notes.store";
import { useRouter } from "next/navigation";

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

const SAMPLE_PAGES = [
  {
    title: "Chapter 4: Differentiation",
    content: `The derivative of a function f(x) at a point x = a measures the instantaneous rate of change of f at that point.

Definition. The derivative of f at a, denoted f'(a), is defined as:

  f'(a) = lim h→0 [ f(a + h) − f(a) ] / h

provided the limit exists.

Geometric interpretation. f'(a) equals the slope of the tangent line to the graph of f at the point (a, f(a)).

Key rules
• Sum rule: (f + g)' = f' + g'
• Product rule: (fg)' = f'g + fg'
• Quotient rule: (f/g)' = (f'g − fg') / g²
• Chain rule: (f ∘ g)'(x) = f'(g(x)) · g'(x)`,
  },
  {
    title: "Chapter 4.2: Common Derivatives",
    content: `Standard derivatives memorized:

  d/dx[xⁿ] = n·xⁿ⁻¹
  d/dx[sin x] = cos x
  d/dx[cos x] = −sin x
  d/dx[tan x] = sec² x
  d/dx[eˣ] = eˣ
  d/dx[ln x] = 1/x  (x > 0)

L'Hôpital's rule. If lim x→a f(x)/g(x) gives 0/0 or ∞/∞, then it equals lim x→a f'(x)/g'(x), provided the right-side limit exists.`,
  },
];

const FORMULAS = [
  { label: "Chain rule", formula: "(f∘g)'(x) = f'(g(x))·g'(x)" },
  { label: "Product rule", formula: "(fg)' = f'g + fg'" },
  { label: "Quotient rule", formula: "(f/g)' = (f'g − fg')/g²" },
  { label: "Power rule", formula: "d/dx[xⁿ] = n·xⁿ⁻¹" },
  { label: "Sin derivative", formula: "d/dx[sin x] = cos x" },
];

const SUGGESTED_QUESTIONS = [
  "What is the chain rule?",
  "Give me an example of integration by parts",
  "When does L'Hôpital's rule apply?",
  "Explain the quotient rule simply",
];

type Tab = "chat" | "highlights" | "bookmarks" | "formulas";

export default function PdfChatPage() {
  const router = useRouter();
  const { createNote } = useNotesStore();
  const [hasFile, setHasFile] = useState(false);
  const [fileName] = useState("Calculus_Textbook_Ch4.pdf");
  const [pageIdx, setPageIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "1",
      role: "ai",
      content:
        "I've loaded the document. Ask me anything — I'll cite the page when relevant.",
    },
  ]);
  const [highlights] = useState<Highlight[]>([
    { id: "h1", page: 1, text: "f'(a) = lim h→0 [ f(a + h) − f(a) ] / h", color: "yellow" },
    { id: "h2", page: 1, text: "Chain rule: (f ∘ g)'(x) = f'(g(x)) · g'(x)", color: "green" },
  ]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([
    { id: "b1", page: 1, label: "Definition of derivative" },
    { id: "b2", page: 2, label: "Common derivatives table" },
  ]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const page = SAMPLE_PAGES[pageIdx];
  const filteredHighlights = search
    ? highlights.filter((h) => h.text.toLowerCase().includes(search.toLowerCase()))
    : highlights;

  function handleUpload() {
    setHasFile(true);
    toast.success("PDF loaded — ready to chat");
  }

  function send(content: string) {
    if (!content.trim()) return;
    setMessages((m) => [...m, { id: Date.now().toString(), role: "user", content }]);
    setInput("");
    setBusy(true);
    setTimeout(() => {
      const aiReply = generateMockReply(content);
      setMessages((m) => [
        ...m,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: aiReply.content,
          page: aiReply.page,
        },
      ]);
      setBusy(false);
    }, 700);
  }

  function saveAsNote(msg: ChatMsg) {
    const id = createNote({
      title: `From PDF: ${fileName}`,
      content: msg.content + (msg.page ? `\n\n*Source: page ${msg.page} of ${fileName}*` : ""),
      folderId: null,
      tags: ["pdf", "ai-generated"],
    });
    toast.success("Saved as note");
    router.push(`/notes/${id}`);
  }

  if (!hasFile) {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <h1 className="text-[28px] font-bold tracking-tight mb-1">PDF Workspace</h1>
        <p className="text-text-secondary text-[14px] mb-8">
          Upload any textbook chapter and chat with it. Highlight, bookmark, extract formulas.
        </p>

        <div
          onClick={handleUpload}
          className="card-v2 border-2 border-dashed border-app hover:border-accent/40 hover:bg-[var(--accent-soft)] cursor-pointer transition-all p-12 text-center"
        >
          <Upload className="w-10 h-10 text-accent mx-auto mb-3" />
          <h2 className="text-[17px] font-semibold mb-1">Drop a PDF here</h2>
          <p className="text-[13px] text-text-secondary mb-4">
            Or click to upload · We&apos;ll demo with a sample calculus chapter
          </p>
          <button className="btn-primary">
            <Upload className="w-4 h-4" /> Try sample PDF
          </button>
        </div>

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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[14px] truncate">{fileName}</div>
            <div className="text-[11px] text-text-tertiary">
              {SAMPLE_PAGES.length} pages · auto-indexed
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setHasFile(false);
            setMessages([
              {
                id: "1",
                role: "ai",
                content: "I've loaded the document. Ask me anything — I'll cite the page when relevant.",
              },
            ]);
          }}
          className="btn-ghost text-[12px]"
        >
          <X className="w-3.5 h-3.5" /> Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 h-full">
        {/* PDF Preview */}
        <div className="card-v2 overflow-hidden flex flex-col" style={{ padding: 0 }}>
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
                Page {pageIdx + 1} of {SAMPLE_PAGES.length}
              </span>
              <button
                onClick={() => setPageIdx(Math.min(SAMPLE_PAGES.length - 1, pageIdx + 1))}
                disabled={pageIdx === SAMPLE_PAGES.length - 1}
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
                  { id: Date.now().toString(), page: pageIdx + 1, label: page.title },
                ])
              }
              className="text-[11px] px-2 py-1 rounded hover:bg-[var(--bg-elevated)] text-text-tertiary hover:text-accent inline-flex items-center gap-1"
            >
              <Bookmark className="w-3 h-3" /> Bookmark
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-white text-black">
            <div className="max-w-prose mx-auto">
              <h2 className="text-[22px] font-bold mb-4">{page.title}</h2>
              <pre className="whitespace-pre-wrap text-[14px] leading-relaxed font-sans">
                {page.content}
              </pre>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="card-v2 flex flex-col overflow-hidden" style={{ padding: 0 }}>
          <div className="flex border-b border-app">
            {(["chat", "highlights", "bookmarks", "formulas"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-3 py-2.5 text-[12px] capitalize transition-colors border-b-2 ${
                  tab === t
                    ? "border-accent text-accent"
                    : "border-transparent text-text-tertiary hover:text-text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
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
                        {m.role === "ai" && m.page && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-app">
                            <button
                              onClick={() => setPageIdx(Math.min(SAMPLE_PAGES.length - 1, m.page! - 1))}
                              className="text-[10px] text-accent hover:underline inline-flex items-center gap-1"
                            >
                              <LinkIcon className="w-2.5 h-2.5" /> Page {m.page}
                            </button>
                            <button
                              onClick={() => saveAsNote(m)}
                              className="text-[10px] text-text-tertiary hover:text-accent inline-flex items-center gap-1 ml-auto"
                            >
                              <Plus className="w-2.5 h-2.5" /> Save as note
                            </button>
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
              </div>
            )}

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
                    No highlights yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredHighlights.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border-l-2"
                        style={{
                          borderColor:
                            h.color === "yellow"
                              ? "#facc15"
                              : h.color === "green"
                              ? "#34c98e"
                              : "#ec4899",
                        }}
                      >
                        <div className="text-[12px] mb-1">{h.text}</div>
                        <button
                          onClick={() => setPageIdx(h.page - 1)}
                          className="text-[10px] text-accent hover:underline"
                        >
                          Go to page {h.page}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "bookmarks" && (
              <div className="space-y-2">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-8 text-[12px] text-text-tertiary">
                    No bookmarks yet
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

            {tab === "formulas" && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                  Auto-extracted
                </div>
                {FORMULAS.map((f) => (
                  <div key={f.label} className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)]">
                    <div className="text-[10px] text-text-tertiary mb-1">{f.label}</div>
                    <div className="font-mono text-[13px]">{f.formula}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || busy}
                  className="btn-primary disabled:opacity-40 px-3"
                  aria-label="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
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

function generateMockReply(question: string): { content: string; page: number } {
  const q = question.toLowerCase();
  if (q.includes("chain")) {
    return {
      content:
        "The chain rule says: when you differentiate a composite function f(g(x)), the result is f'(g(x)) · g'(x). Walk it outside-in: differentiate the outer with the inner kept as-is, then multiply by the derivative of the inner. See page 1 for the formal statement.",
      page: 1,
    };
  }
  if (q.includes("parts") || q.includes("integration")) {
    return {
      content:
        "Integration by parts comes from the product rule. The formula is ∫u dv = uv − ∫v du. Choose u via LIATE — Logarithmic, Inverse trig, Algebraic, Trig, Exponential — and dv as what's left.",
      page: 2,
    };
  }
  if (q.includes("hôpital") || q.includes("lhopital") || q.includes("l'hopital")) {
    return {
      content:
        "L'Hôpital's rule applies only when you get 0/0 or ∞/∞. In that case, differentiate numerator and denominator separately and take the limit again. If you get the same indeterminate form, repeat. Don't apply it to anything else — that's the most common mistake.",
      page: 2,
    };
  }
  if (q.includes("quotient")) {
    return {
      content:
        "Quotient rule: (f/g)' = (f'g − fg')/g². Remember the order — derivative of top times bottom minus top times derivative of bottom, all over bottom squared. Page 1 for the formula.",
      page: 1,
    };
  }
  return {
    content:
      "I scanned the document and don't see that explicitly. The closest match is on page 2 — common derivatives. Want me to summarize that section?",
    page: 2,
  };
}
