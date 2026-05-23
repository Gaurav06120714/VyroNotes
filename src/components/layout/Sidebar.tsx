"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  StickyNote,
  Layers,
  ListChecks,
  Kanban,
  Calendar,
  GraduationCap,
  FileText,
  BookOpen,
  Timer as TimerIcon,
  Sparkles,
  Settings,
  Flame,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreakStore } from "@/store/streak.store";
import { useUIStore } from "@/store/ui.store";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

const sections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "G D" },
    ],
  },
  {
    label: "Study",
    items: [
      { href: "/notes", label: "Notes", icon: StickyNote, shortcut: "G N" },
      { href: "/flashcards", label: "Flashcards", icon: Layers, shortcut: "G F" },
      { href: "/quizzes", label: "Quizzes", icon: ListChecks, shortcut: "G Q" },
      { href: "/revision", label: "Revision", icon: BookOpen },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/assignments", label: "Assignments", icon: Kanban, shortcut: "G A" },
      { href: "/calendar", label: "Calendar", icon: Calendar, shortcut: "G C" },
      { href: "/exams", label: "Exams", icon: GraduationCap },
    ],
  },
  {
    label: "Focus",
    items: [
      { href: "/timer", label: "Pomodoro", icon: TimerIcon },
      { href: "/exam-mode", label: "1 Hr Exam Mode", icon: Zap },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
      { href: "/pdf-chat", label: "PDF Chat", icon: FileText },
    ],
  },
];

function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { currentStreak } = useStreakStore();
  const isMobile = !!onClose;
  return (
    <>
      <div className="flex items-center gap-2 px-5 h-16 border-b border-app shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="overflow-hidden flex-1 min-w-0">
            <div className="font-semibold text-[14px] leading-tight tracking-tight">Vyro Notes</div>
            <div className="text-[11px] text-text-tertiary leading-tight">Study Sanctuary</div>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-elevated text-text-secondary focus-ring"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            {(!collapsed || isMobile) && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.10em] text-text-tertiary">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors group min-h-[36px]",
                      active
                        ? "text-text-primary"
                        : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                    )}
                    style={active ? { background: "var(--accent-soft)" } : undefined}
                    title={collapsed && !isMobile ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", active && "text-accent")} />
                    {(!collapsed || isMobile) && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-text-tertiary font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.shortcut}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-app shrink-0">
        {(!collapsed || isMobile) ? (
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-app hover:border-strong transition-colors"
            style={{ background: "var(--bg-elevated)" }}
          >
            <Flame className="w-4 h-4 text-[#f59e0b]" />
            <div className="flex-1">
              <div className="text-[10px] text-text-tertiary uppercase tracking-wider">Current streak</div>
              <div className="text-[13px] font-semibold text-text-primary">{currentStreak} days</div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-center py-2 text-[#f59e0b]" title="Streak">
            <Flame className="w-4 h-4" />
          </div>
        )}
        <Link
          href="/settings"
          onClick={onClose}
          className={cn(
            "mt-2 flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors min-h-[36px]",
            pathname.startsWith("/settings") && "text-text-primary"
          )}
          style={pathname.startsWith("/settings") ? { background: "var(--accent-soft)" } : undefined}
        >
          <Settings className="w-4 h-4" />
          {(!collapsed || isMobile) && <span>Settings</span>}
        </Link>
      </div>
    </>
  );
}

export function Sidebar() {
  const { sidebarOpen, sidebarDrawerOpen, setSidebarDrawerOpen } = useUIStore();
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setSidebarDrawerOpen(false);
  }, [pathname, setSidebarDrawerOpen]);

  return (
    <>
      {/* Desktop sticky sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 248 : 68 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex flex-col h-screen sticky top-0 glass-strong border-r border-app overflow-hidden"
      >
        <SidebarContent collapsed={!sidebarOpen} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSidebarDrawerOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed top-0 bottom-0 left-0 z-50 w-[280px] flex flex-col glass-strong border-r border-app"
              aria-label="Navigation"
            >
              <SidebarContent collapsed={false} onClose={() => setSidebarDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
