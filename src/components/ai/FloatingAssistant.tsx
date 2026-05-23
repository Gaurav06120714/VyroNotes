"use client";
import { useUIStore } from "@/store/ui.store";
import { useChatStore } from "@/store/chat.store";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Maximize2 } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { QUICK_PROMPTS, getContextualPrompts } from "@/lib/ai-mock";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingAssistant() {
  const { aiOpen, setAIOpen } = useUIStore();
  const { messages, send } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, aiOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    send(input.trim(), pathname);
    setInput("");
  };

  const contextualPrompts = useMemo(() => getContextualPrompts(pathname), [pathname]);
  const showSuggestions = messages.length <= 2;

  return (
    <>
      {/* Floating bubble — repositions above bottom nav on mobile */}
      <AnimatePresence>
        {!aiOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={() => setAIOpen(true)}
            className="fixed z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--accent)] flex items-center justify-center group shadow-[0_8px_24px_rgba(124,109,250,0.35)] hover:shadow-[0_10px_28px_rgba(124,109,250,0.45)] transition-shadow bottom-[88px] right-4 md:bottom-6 md:right-6"
            aria-label="Open AI assistant"
          >
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mini chat */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[88px] md:bottom-6 right-4 md:right-6 z-40 w-[360px] max-w-[calc(100vw-32px)] h-[540px] max-h-[calc(100vh-180px)] md:max-h-[80vh] glass-strong rounded-2xl flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
            role="dialog"
            aria-label="AI Study Buddy chat"
          >
            <div className="flex items-center gap-2 px-4 h-14 border-b border-app shrink-0">
              <div className="w-8 h-8 rounded-md bg-[var(--accent)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold leading-tight">AI Study Buddy</div>
                <div className="text-[10px] text-text-tertiary flex items-center gap-1 leading-tight mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                  <span>Online · contextual to {pathname.split("/").pop() || "app"}</span>
                </div>
              </div>
              <Link
                href="/ai-assistant"
                onClick={() => setAIOpen(false)}
                className="p-1.5 rounded-md hover:bg-bg-elevated transition-colors text-text-secondary"
                title="Open full chat"
                aria-label="Open full chat"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setAIOpen(false)}
                className="p-1.5 rounded-md hover:bg-bg-elevated transition-colors text-text-secondary"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] whitespace-pre-wrap leading-relaxed ${
                      m.role === "user"
                        ? "bg-[var(--accent)] text-white rounded-br-sm"
                        : "bg-bg-elevated text-text-primary rounded-bl-sm border border-app"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {showSuggestions && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {(contextualPrompts.length ? contextualPrompts : QUICK_PROMPTS).slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p, pathname)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-app hover:border-strong text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-app shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask anything…"
                  className="input-base"
                  aria-label="Message"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-md bg-[var(--accent)] flex items-center justify-center disabled:opacity-40 shrink-0 hover:bg-[var(--accent-hover)] transition-colors"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
