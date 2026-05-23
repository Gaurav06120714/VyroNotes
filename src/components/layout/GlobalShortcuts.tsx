"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui.store";
import { useNotesStore } from "@/store/notes.store";
import toast from "react-hot-toast";

const NAV: Record<string, string> = {
  d: "/dashboard",
  n: "/notes",
  f: "/flashcards",
  q: "/quizzes",
  a: "/assignments",
  c: "/calendar",
  e: "/exams",
  t: "/timer",
  i: "/ai-assistant",
  s: "/settings",
};

export function GlobalShortcuts() {
  const router = useRouter();
  const { toggleSidebar, setShortcutsOpen } = useUIStore();
  const { createNote } = useNotesStore();
  const lastGAt = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Cmd+N → new note
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const n = createNote({ title: "Untitled" });
        toast.success("New note created");
        router.push(`/notes/${n.id}`);
        return;
      }

      // Cmd+Shift+N → quick capture
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const n = createNote({ title: "Quick capture", content: "" });
        toast.success("Quick capture");
        router.push(`/notes/${n.id}`);
        return;
      }

      // Cmd+/ → toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Cmd+? → shortcuts
      if ((e.metaKey || e.ctrlKey) && (e.key === "?" || (e.shiftKey && e.key === "/"))) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (isInput) return;

      // G then [letter]
      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey) {
        lastGAt.current = Date.now();
        return;
      }
      if (Date.now() - lastGAt.current < 1000) {
        const route = NAV[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          router.push(route);
          lastGAt.current = 0;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, toggleSidebar, setShortcutsOpen, createNote]);

  return null;
}
