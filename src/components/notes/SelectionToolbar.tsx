"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, BookOpen, HelpCircle, Languages } from "lucide-react";

interface Props {
  visible: boolean;
  position: { top: number; left: number };
  onAction: (action: "summarize" | "explain" | "make-question" | "translate") => void;
}

const ACTIONS = [
  { id: "summarize" as const, label: "Summarize", icon: BookOpen },
  { id: "explain" as const, label: "Explain", icon: Sparkles },
  { id: "make-question" as const, label: "Quiz me", icon: HelpCircle },
  { id: "translate" as const, label: "Translate", icon: Languages },
];

export function SelectionToolbar({ visible, position, onAction }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ duration: 0.14 }}
          className="fixed z-50 glass-strong rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)] overflow-hidden flex items-center"
          style={{ top: position.top, left: position.left }}
          role="toolbar"
          aria-label="AI selection toolbar"
        >
          {ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => onAction(a.id)}
                className="flex items-center gap-1.5 px-3 h-9 text-[12px] text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                style={i > 0 ? { borderLeft: "1px solid var(--border)" } : undefined}
              >
                <Icon className="w-3.5 h-3.5 text-accent" />
                <span>{a.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
