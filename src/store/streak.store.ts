"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateStreak } from "@/lib/dummy-data";

interface StreakState {
  days: { date: string; minutes: number }[];
  currentStreak: number;
  longestStreak: number;
  recompute: () => void;
  logToday: (minutes?: number) => void;
}

function calc(days: { date: string; minutes: number }[]) {
  let current = 0;
  let longest = 0;
  let run = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].minutes > 0) {
      run++;
      if (i === days.length - 1) current = run;
    } else {
      if (i === days.length - 1) current = 0;
      longest = Math.max(longest, run);
      run = 0;
    }
  }
  longest = Math.max(longest, run);
  if (current === 0) {
    // count from end consecutively
    let c = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].minutes > 0) c++;
      else break;
    }
    current = c;
  }
  return { current, longest };
}

const initial = generateStreak();
const { current, longest } = calc(initial);

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      days: initial,
      currentStreak: current,
      longestStreak: longest,
      recompute: () => {
        const { current, longest } = calc(get().days);
        set({ currentStreak: current, longestStreak: longest });
      },
      logToday: (minutes = 30) =>
        set((s) => {
          const today = new Date().toISOString().slice(0, 10);
          const days = s.days.some((d) => d.date === today)
            ? s.days.map((d) => (d.date === today ? { ...d, minutes: d.minutes + minutes } : d))
            : [...s.days, { date: today, minutes }];
          const { current, longest } = calc(days);
          return { days, currentStreak: current, longestStreak: longest };
        }),
    }),
    { name: "vyronotes-streak" }
  )
);
