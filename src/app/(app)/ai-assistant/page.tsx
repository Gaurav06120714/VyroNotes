"use client";
import { useChatStore } from "@/store/chat.store";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Trash2 } from "lucide-react";
import { QUICK_PROMPTS } from "@/lib/ai-mock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePathname } from "next/navigation";

export default function AIAssistantPage() {
  const { messages, send, clear } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    send(t, pathname);
    if (!text) setInput("");
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-160px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--accent)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight">AI Study Buddy</h1>
            <p className="text-[11px] text-text-tertiary flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" /> Online · knows your subjects
            </p>
          </div>
        </div>
        <button onClick={clear} className="text-[12px] flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-bg-elevated text-text-secondary">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 card-v2 overflow-y-auto space-y-4">
        {messages.map((m) => (
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {messages.length <= 2 && (
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

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Ask anything…"
          className="input-base"
          aria-label="Message"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-md bg-[var(--accent)] flex items-center justify-center disabled:opacity-40 shrink-0 hover:bg-[var(--accent-hover)] transition-colors"
          aria-label="Send"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
