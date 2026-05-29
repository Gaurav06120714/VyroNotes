"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "@/lib/types";
import { uid } from "@/lib/utils";
import type { OllamaMessage } from "@/lib/ollama";

interface ChatContext {
  currentPage: string;
  currentNoteId?: string;
  currentExamId?: string;
}

interface ChatState {
  messages: ChatMessage[];
  context: ChatContext;
  streaming: boolean;
  /** Send a user message and stream the AI response. */
  send: (content: string, page?: string) => Promise<void>;
  /** Append a token to the last assistant message (used during streaming). */
  appendToken: (token: string) => void;
  setContext: (ctx: Partial<ChatContext>) => void;
  clear: () => void;
  /** Abort controller ref stored outside Zustand to avoid serialization issues. */
  _abortController: AbortController | null;
}

/** Build a brief system prompt based on the current page. */
function buildSystemPrompt(page: string): string {
  const base =
    "You are an AI study buddy embedded in VyroNotes, a student note-taking app. " +
    "Be concise, helpful, and use markdown formatting for clarity. " +
    "Focus on academic topics, note-taking, and study strategies.";

  if (page.startsWith("/notes/")) {
    return base + " The user is currently editing a note — help them understand and expand it.";
  }
  if (page.startsWith("/flashcards")) {
    return base + " The user is reviewing flashcards — help with spaced repetition and memorization.";
  }
  if (page.startsWith("/quizzes")) {
    return base + " The user is taking a quiz — help them understand the concepts being tested.";
  }
  if (page.startsWith("/dashboard")) {
    return base + " The user is on the dashboard — help with study planning and prioritization.";
  }
  return base;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hey! I'm your AI study buddy powered by Ollama. I can summarize notes, generate quizzes, build study plans, and help you cram for exams. What's on your mind?",
          timestamp: new Date().toISOString(),
        },
      ],
      context: { currentPage: "/" },
      streaming: false,
      _abortController: null,

      appendToken: (token: string) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content: last.content + token };
          }
          return { messages: msgs };
        }),

      send: async (content: string, page?: string) => {
        const { messages, context, appendToken } = get();

        // Abort any in-flight request
        get()._abortController?.abort();
        const controller = new AbortController();
        set({ _abortController: controller });

        const ctx = page ? { ...context, currentPage: page } : context;

        const userMsg: ChatMessage = {
          id: uid(),
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        };
        const aiMsg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        };

        set({ messages: [...messages, userMsg, aiMsg], context: ctx, streaming: true });

        // Build messages array for Ollama (last 20 turns for context window)
        const systemMsg: OllamaMessage = {
          role: "system",
          content: buildSystemPrompt(ctx.currentPage),
        };
        const history: OllamaMessage[] = get()
          .messages.slice(-20)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        const ollamaMessages: OllamaMessage[] = [systemMsg, ...history];

        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: ollamaMessages }),
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            const errData = await res.json().catch(() => ({ error: "Unknown error" })) as { error: string };
            set((s) => {
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              if (last?.role === "assistant") {
                msgs[msgs.length - 1] = {
                  ...last,
                  content: `Sorry, I encountered an error: ${errData.error ?? res.statusText}`,
                };
              }
              return { messages: msgs, streaming: false };
            });
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            appendToken(decoder.decode(value, { stream: true }));
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            // User cancelled — leave partial response as-is
          } else {
            set((s) => {
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              if (last?.role === "assistant" && last.content === "") {
                msgs[msgs.length - 1] = {
                  ...last,
                  content: "Failed to reach Ollama. Make sure it's running on port 11434.",
                };
              }
              return { messages: msgs };
            });
          }
        } finally {
          set({ streaming: false, _abortController: null });
        }
      },

      setContext: (ctx) => set((s) => ({ context: { ...s.context, ...ctx } })),
      clear: () =>
        set({
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content: "Cleared. What's next?",
              timestamp: new Date().toISOString(),
            },
          ],
          streaming: false,
        }),
    }),
    {
      name: "vyronotes-chat",
      partialize: (s) => ({ messages: s.messages.slice(-30), context: s.context }),
    }
  )
);
