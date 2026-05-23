"use client";
import { Command } from "cmdk";
import { useUIStore } from "@/store/ui.store";
import { useNotesStore } from "@/store/notes.store";
import { useRouter } from "next/navigation";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  StickyNote,
  Layers,
  ListChecks,
  Kanban,
  Calendar,
  GraduationCap,
  Timer as TimerIcon,
  Sparkles,
  Plus,
  Sun,
  Moon,
  Zap,
  FileText,
  BookOpen,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { useThemeStore } from "@/store/theme.store";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/quizzes", label: "Quizzes", icon: ListChecks },
  { href: "/assignments", label: "Assignments", icon: Kanban },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/exams", label: "Exams", icon: GraduationCap },
  { href: "/revision", label: "Revision", icon: BookOpen },
  { href: "/exam-mode", label: "1 Hour Exam Mode", icon: Zap },
  { href: "/timer", label: "Pomodoro Timer", icon: TimerIcon },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/pdf-chat", label: "PDF Chat", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setAIOpen } = useUIStore();
  const { notes, createNote } = useNotesStore();
  const { toggle: toggleTheme, theme } = useThemeStore();
  const router = useRouter();

  useKeyboardShortcut("k", (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault();
      setCommandOpen(!commandOpen);
    }
  });
  useKeyboardShortcut("Escape", () => commandOpen && setCommandOpen(false));

  const run = (fn: () => void) => {
    setCommandOpen(false);
    setTimeout(fn, 50);
  };

  return (
    <AnimatePresence>
      {commandOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setCommandOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl glass-strong rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="w-full" loop>
              <div className="flex items-center px-4 border-b border-app">
                <Search className="w-4 h-4 text-text-tertiary mr-2" />
                <Command.Input
                  placeholder="Search or type a command…"
                  className="flex-1 h-12 bg-transparent outline-none text-sm placeholder:text-text-tertiary"
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated border border-app font-mono ml-2">esc</kbd>
              </div>
              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-6 text-center text-sm text-text-tertiary">
                  No results. Try a different query.
                </Command.Empty>

                <Command.Group heading="Actions" className="text-[10px] uppercase tracking-wider text-text-tertiary px-2 py-1">
                  <Command.Item
                    onSelect={() =>
                      run(() => {
                        const n = createNote({ title: "New Note" });
                        router.push(`/notes/${n.id}`);
                      })
                    }
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm text-text-primary aria-selected:bg-accent/15 aria-selected:text-white"
                  >
                    <Plus className="w-4 h-4 text-accent" />
                    <span>Create new note</span>
                    <kbd className="ml-auto text-[10px] font-mono text-text-tertiary">⌘N</kbd>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => run(() => setAIOpen(true))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm aria-selected:bg-accent/15 aria-selected:text-white"
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Open AI Assistant</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => run(toggleTheme)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm aria-selected:bg-accent/15 aria-selected:text-white"
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span>Toggle theme</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Navigate" className="text-[10px] uppercase tracking-wider text-text-tertiary px-2 py-1 mt-2">
                  {NAV.map((n) => (
                    <Command.Item
                      key={n.href}
                      onSelect={() => run(() => router.push(n.href))}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm aria-selected:bg-accent/15 aria-selected:text-white"
                    >
                      <n.icon className="w-4 h-4 text-text-secondary" />
                      <span>{n.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Notes" className="text-[10px] uppercase tracking-wider text-text-tertiary px-2 py-1 mt-2">
                  {notes
                    .filter((n) => !n.trashed && !n.archived)
                    .slice(0, 8)
                    .map((n) => (
                      <Command.Item
                        key={n.id}
                        value={`note ${n.title} ${n.subject}`}
                        onSelect={() => run(() => router.push(`/notes/${n.id}`))}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm aria-selected:bg-accent/15 aria-selected:text-white"
                      >
                        <StickyNote className="w-4 h-4 text-text-secondary" />
                        <span className="truncate">{n.title}</span>
                        <span className="ml-auto text-[10px] text-text-tertiary">{n.subject}</span>
                      </Command.Item>
                    ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
