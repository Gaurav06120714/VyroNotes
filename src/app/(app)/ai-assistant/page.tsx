"use client";
import { useChatStore } from "@/store/chat.store";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Trash2, Square, Loader2, Download } from "lucide-react";
import { QUICK_PROMPTS } from "@/lib/ai-mock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePathname } from "next/navigation";
import { PRIMARY_MODEL } from "@/lib/ollama";

const AVAILABLE_MODELS = [PRIMARY_MODEL];

export default function AIAssistantPage() {
  const { messages, send, clear, streaming, _abortController } = useChatStore();
  const [input, setInput]   = useState("");
  const [model, setModel]   = useState(PRIMARY_MODEL);
  const scrollRef           = useRef<HTMLDivElement>(null);
  const pathname            = usePathname();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || streaming) return;
    send(t, pathname);
    if (!text) setInput("");
  };

  const handleAbort = () => {
    _abortController?.abort();
  };

  const exportMarkdown = () => {
    const md = messages
      .map((m) => `**${m.role === "user" ? "You" : "AI"}:**\n\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "ai-conversation.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-160px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--accent)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight">AI Study Buddy</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {streaming ? (
                <Loader2 className="w-3 h-3 text-text-tertiary animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              )}
              <p className="text-[11px] text-text-tertiary">
                {streaming ? "Generating…" : "Online · Ollama local inference"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model selector */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="text-[11px] bg-[var(--bg-elevated)] border border-app rounded-md px-2 py-1.5 text-text-secondary"
            aria-label="Select model"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button
            onClick={exportMarkdown}
            className="text-[12px] flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-bg-elevated text-text-secondary"
            title="Export conversation as markdown"
          >
            <Download className="w-3 h-3" />
          </button>

          <button
            onClick={clear}
            className="text-[12px] flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-bg-elevated text-text-secondary"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 card-v2 overflow-y-auto space-y-4 p-4">
        {messages.map((m, idx) => {
          const isStreamingLast =
            m.role === "assistant" && idx === messages.length - 1 && streaming;
          return (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-[14px] ${
                  m.role === "user"
                    ? "bg-[var(--accent)] text-white rounded-br-sm"
                    : "bg-bg-elevated border border-app rounded-bl-sm"
                }`}
              >
                <div className={m.role === "assistant" ? "prose-app text-[14px]" : "whitespace-pre-wrap"}>
                  {m.role === "assistant" ? (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content || (isStreamingLast ? " " : "*No response yet.*")}
                      </ReactMarkdown>
                      {isStreamingLast && m.content === "" && (
                        <span className="inline-flex gap-0.5 items-center">
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      )}
                      {isStreamingLast && m.content !== "" && (
                        <span className="inline-block w-0.5 h-4 bg-current opacity-70 animate-pulse ml-0.5 align-middle" />
                      )}
                    </>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && !streaming && (
        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-app hover:border-strong text-text-secondary hover:text-text-primary transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder={streaming ? "Waiting for response…" : "Ask anything…"}
          disabled={streaming}
          className="input-base disabled:opacity-50"
          aria-label="Message"
        />
        {streaming ? (
          <button
            onClick={handleAbort}
            className="w-10 h-10 rounded-md bg-[var(--danger)] flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Stop generation"
            title="Stop"
          >
            <Square className="w-4 h-4 text-white" />
          </button>
        ) : (
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-md bg-[var(--accent)] flex items-center justify-center disabled:opacity-40 shrink-0 hover:bg-[var(--accent-hover)] transition-colors"
            aria-label="Send"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
