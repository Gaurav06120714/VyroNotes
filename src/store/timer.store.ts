"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PomodoroSession } from "@/lib/types";
import { uid } from "@/lib/utils";

interface TimerState {
  focusDuration: number;
  shortBreak: number;
  longBreak: number;
  sessions: PomodoroSession[];
  currentTask: string | null;
  totalToday: number;
  setDurations: (focus: number, short: number, long: number) => void;
  setCurrentTask: (t: string | null) => void;
  completeSession: (s: Omit<PomodoroSession, "id" | "completedAt">) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      focusDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      sessions: [],
      currentTask: null,
      totalToday: 0,
      setDurations: (focus, short, long) =>
        set({ focusDuration: focus, shortBreak: short, longBreak: long }),
      setCurrentTask: (t) => set({ currentTask: t }),
      completeSession: (s) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            { ...s, id: uid(), completedAt: new Date().toISOString() },
          ],
          totalToday:
            s.type === "focus" ? state.totalToday + s.duration : state.totalToday,
        })),
    }),
    { name: "vyronotes-timer" }
  )
);
