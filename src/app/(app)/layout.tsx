"use client";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { FloatingAssistant } from "@/components/ai/FloatingAssistant";
import { ShortcutsModal } from "@/components/layout/ShortcutsModal";
import { BottomNav } from "@/components/layout/BottomNav";
import { GlobalShortcuts } from "@/components/layout/GlobalShortcuts";
import { QuickCapture } from "@/components/notes/QuickCapture";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:text-sm"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 subtle-bg">
        <TopBar />
        <main
          id="main-content"
          className="flex-1 px-4 md:px-8 py-6 pb-mobile md:pb-8"
          role="main"
        >
          <ErrorBoundary>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette />
      <ShortcutsModal />
      <FloatingAssistant />
      <BottomNav />
      <GlobalShortcuts />
      <QuickCapture />
    </div>
  );
}
