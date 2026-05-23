"use client";
import { useUIStore } from "@/store/ui.store";
import { useThemeStore } from "@/store/theme.store";
import { useAuthStore } from "@/store/auth.store";
import { Search, Menu, Moon, Sun, Sparkles, Plus, Keyboard } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function TopBar() {
  const { setCommandOpen, toggleSidebar, setShortcutsOpen, setSidebarDrawerOpen } = useUIStore();
  const { theme, toggle } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const handleMenu = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarDrawerOpen(true);
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-app h-16 flex items-center px-4 md:px-6 gap-3">
      <button
        onClick={handleMenu}
        className="p-2 rounded-md hover:bg-bg-elevated transition-colors focus-ring"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <button
        onClick={() => setCommandOpen(true)}
        className="flex-1 max-w-xl flex items-center gap-2 px-3.5 h-9 rounded-lg border border-app hover:border-strong text-text-secondary hover:text-text-primary text-[13px] transition-colors"
        style={{ background: "var(--bg-surface)" }}
        aria-label="Open command palette and search"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search notes, run actions…</span>
        <div className="ml-auto hidden sm:flex items-center gap-1">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </div>
      </button>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            router.push("/notes");
            toast.success("New note — start writing!");
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-md border border-app hover:border-strong text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Create new note"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="hidden sm:flex p-2 rounded-md hover:bg-bg-elevated transition-colors focus-ring text-text-secondary"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>
        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-bg-elevated transition-colors focus-ring text-text-secondary"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-app h-8">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[13px] font-semibold">
            {user?.name?.[0] || "U"}
          </div>
          <div className="hidden sm:block">
            <div className="text-[13px] font-medium leading-tight">{user?.name || "User"}</div>
            <div className="text-[10px] text-text-tertiary leading-tight flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Pro</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
