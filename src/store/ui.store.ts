"use client";
import { create } from "zustand";

interface UIState {
  commandOpen: boolean;
  aiOpen: boolean;
  sidebarOpen: boolean;
  sidebarDrawerOpen: boolean; // mobile slide-in drawer
  shortcutsOpen: boolean;
  quickCaptureOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  setAIOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setSidebarDrawerOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  setQuickCaptureOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  aiOpen: false,
  sidebarOpen: true,
  sidebarDrawerOpen: false,
  shortcutsOpen: false,
  quickCaptureOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),
  setAIOpen: (v) => set({ aiOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarDrawerOpen: (v) => set({ sidebarDrawerOpen: v }),
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
  setQuickCaptureOpen: (v) => set({ quickCaptureOpen: v }),
}));
