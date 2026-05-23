"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "dark" | "light";
  toggle: () => void;
  set: (t: "dark" | "light") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      toggle: () =>
        set((s) => {
          const next = s.theme === "dark" ? "light" : "dark";
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", next);
          }
          return { theme: next };
        }),
      set: (t) => {
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", t);
        }
        set({ theme: t });
      },
    }),
    { name: "vyronotes-theme" }
  )
);
