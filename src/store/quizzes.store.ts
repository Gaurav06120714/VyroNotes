"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Quiz } from "@/lib/types";
import { DUMMY_QUIZZES } from "@/lib/dummy-data";

interface QuizzesState {
  quizzes: Quiz[];
  recordAttempt: (id: string, score: number) => void;
}

export const useQuizzesStore = create<QuizzesState>()(
  persist(
    (set) => ({
      quizzes: DUMMY_QUIZZES,
      recordAttempt: (id, score) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id === id
              ? {
                  ...q,
                  attempts: q.attempts + 1,
                  bestScore: Math.max(q.bestScore || 0, score),
                }
              : q
          ),
        })),
    }),
    { name: "vyronotes-quizzes" }
  )
);
