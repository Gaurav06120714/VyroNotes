"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "@/lib/types";
import { uid } from "@/lib/utils";
import { getAIResponse } from "@/lib/ai-mock";

interface ChatContext {
  currentPage: string;
  currentNoteId?: string;
  currentExamId?: string;
}

interface ChatState {
  messages: ChatMessage[];
  context: ChatContext;
  send: (content: string, page?: string) => void;
  setContext: (ctx: Partial<ChatContext>) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hey! I'm your AI study buddy. I can summarize notes, generate quizzes, build study plans, and help you cram for exams. What's on your mind?",
          timestamp: new Date().toISOString(),
        },
      ],
      context: { currentPage: "/" },
      send: (content, page) =>
        set((s) => {
          const ctx = page ? { ...s.context, currentPage: page } : s.context;
          const user: ChatMessage = {
            id: uid(),
            role: "user",
            content,
            timestamp: new Date().toISOString(),
          };
          const ai: ChatMessage = {
            id: uid(),
            role: "assistant",
            content: getAIResponse(content, ctx.currentPage),
            timestamp: new Date().toISOString(),
          };
          return { messages: [...s.messages, user, ai], context: ctx };
        }),
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
        }),
    }),
    {
      name: "vyronotes-chat",
      partialize: (s) => ({ messages: s.messages.slice(-30), context: s.context }),
    }
  )
);

// Silence unused warning for get
void useChatStore.getState;
