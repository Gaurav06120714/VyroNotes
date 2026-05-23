"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  StickyNote,
  Sparkles,
  Timer as TimerIcon,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/ai-assistant", label: "AI", icon: Sparkles },
  { href: "/timer", label: "Timer", icon: TimerIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { setSidebarDrawerOpen } = useUIStore();
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-app safe-bottom"
    >
      <div className="h-[64px] flex items-stretch justify-around px-1.5">
        {items.map((i) => {
          const active = pathname.startsWith(i.href);
          const Icon = i.icon;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-w-[44px] rounded-lg transition-colors",
                active ? "text-accent" : "text-text-tertiary hover:text-text-primary"
              )}
              aria-label={i.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{i.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setSidebarDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 min-w-[44px] rounded-lg text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="More navigation"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
