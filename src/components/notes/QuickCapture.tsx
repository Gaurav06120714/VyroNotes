"use client";
import { useUIStore } from "@/store/ui.store";
import { useNotesStore } from "@/store/notes.store";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function QuickCapture() {
  const { quickCaptureOpen, setQuickCaptureOpen } = useUIStore();
  const { createNote } = useNotesStore();
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!quickCaptureOpen) setContent("");
  }, [quickCaptureOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + N
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "N" || e.key === "n")) {
        e.preventDefault();
        setQuickCaptureOpen(true);
      }
      if (e.key === "Escape" && quickCaptureOpen) {
        setQuickCaptureOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quickCaptureOpen, setQuickCaptureOpen]);

  const handleSave = () => {
    if (!content.trim()) return;
    const title = content.split("\n")[0].slice(0, 80) || "Quick capture";
    const rest = content.split("\n").slice(1).join("\n");
    createNote({ title, content: rest || content, subject: "Math", tags: ["inbox"] });
    toast.success("Saved to Inbox");
    setQuickCaptureOpen(false);
  };

  return (
    <AnimatePresence>
      {quickCaptureOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickCaptureOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-[min(560px,calc(100vw-32px))] glass-strong rounded-2xl overflow-hidden"
            role="dialog"
            aria-label="Quick capture"
          >
            <div className="flex items-center gap-2 px-4 h-12 border-b border-app">
              <Inbox className="w-4 h-4 text-accent" />
              <span className="text-[13px] font-semibold flex-1">Quick capture</span>
              <span className="text-[11px] text-text-tertiary hidden sm:inline">Saves to Inbox</span>
              <button
                onClick={() => setQuickCaptureOpen(false)}
                className="p-1.5 rounded-md hover:bg-bg-elevated text-text-secondary"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a thought, idea, or note…"
              className="w-full px-4 py-3 bg-transparent outline-none resize-none text-[14px] min-h-[180px] placeholder:text-text-tertiary"
            />
            <div className="flex items-center justify-between px-4 h-12 border-t border-app">
              <div className="text-[11px] text-text-tertiary">
                <kbd>Esc</kbd> to dismiss · <kbd>⌘</kbd>+<kbd>Enter</kbd> to save
              </div>
              <button
                onClick={handleSave}
                disabled={!content.trim()}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
                }}
                className="btn-primary text-[12px] py-1.5 px-3"
              >
                Save to Inbox
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
