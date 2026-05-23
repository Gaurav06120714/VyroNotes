"use client";
import { useUIStore } from "@/store/ui.store";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const groups = [
  {
    title: "General",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["⌘", "N"], label: "New note" },
      { keys: ["⌘", "/"], label: "Toggle sidebar" },
      { keys: ["⌘", "?"], label: "Show this dialog" },
      { keys: ["Esc"], label: "Close any modal" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["G", "D"], label: "Go to Dashboard" },
      { keys: ["G", "N"], label: "Go to Notes" },
      { keys: ["G", "F"], label: "Go to Flashcards" },
      { keys: ["G", "Q"], label: "Go to Quizzes" },
      { keys: ["G", "A"], label: "Go to Assignments" },
      { keys: ["G", "C"], label: "Go to Calendar" },
    ],
  },
  {
    title: "Editor",
    items: [
      { keys: ["⌘", "B"], label: "Bold" },
      { keys: ["⌘", "I"], label: "Italic" },
      { keys: ["⌘", "S"], label: "Force save" },
    ],
  },
];

export function ShortcutsModal() {
  const { shortcutsOpen, setShortcutsOpen } = useUIStore();
  return (
    <AnimatePresence>
      {shortcutsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShortcutsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl glass-strong rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {groups.map((g) => (
                <div key={g.title}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
                    {g.title}
                  </h3>
                  <div className="space-y-2">
                    {g.items.map((i) => (
                      <div key={i.label} className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">{i.label}</span>
                        <div className="flex items-center gap-1">
                          {i.keys.map((k) => (
                            <kbd
                              key={k}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated border border-app font-mono"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
