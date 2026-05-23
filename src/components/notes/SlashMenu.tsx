"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import type { LucideIcon } from "lucide-react";

interface SlashAction {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  insert: string;
}

const ACTIONS: SlashAction[] = [
  { id: "h1", label: "Heading 1", hint: "Large section title", icon: Heading1, insert: "# " },
  { id: "h2", label: "Heading 2", hint: "Medium section title", icon: Heading2, insert: "## " },
  { id: "h3", label: "Heading 3", hint: "Subsection title", icon: Heading3, insert: "### " },
  { id: "ul", label: "Bullet list", hint: "Unordered list", icon: List, insert: "- " },
  { id: "ol", label: "Numbered list", hint: "Ordered list", icon: ListOrdered, insert: "1. " },
  { id: "todo", label: "To-do", hint: "Checkable task", icon: CheckSquare, insert: "- [ ] " },
  { id: "code", label: "Code block", hint: "Fenced code", icon: Code, insert: "```\n\n```" },
  { id: "quote", label: "Quote", hint: "Blockquote", icon: Quote, insert: "> " },
  { id: "divider", label: "Divider", hint: "Horizontal rule", icon: Minus, insert: "\n---\n" },
  { id: "ai", label: "AI suggest", hint: "Let AI continue", icon: Sparkles, insert: "{{AI}}" },
];

interface Props {
  open: boolean;
  query: string;
  position: { top: number; left: number };
  onPick: (action: SlashAction) => void;
  onClose: () => void;
}

export function SlashMenu({ open, query, position, onPick, onClose }: Props) {
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return ACTIONS;
    return ACTIONS.filter((a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q));
  }, [query]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        const item = filtered[activeIndex];
        if (item) {
          e.preventDefault();
          onPick(item);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, activeIndex, onPick, onClose]);

  return (
    <AnimatePresence>
      {open && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="absolute z-50 glass-strong rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden w-[240px]"
          style={{ top: position.top, left: position.left }}
          role="listbox"
        >
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary px-3 pt-2 pb-1">Blocks</div>
          <div className="max-h-[280px] overflow-y-auto pb-1">
            {filtered.map((a, i) => {
              const Icon = a.icon;
              const active = i === activeIndex;
              return (
                <button
                  key={a.id}
                  onClick={() => onPick(a)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className="w-full text-left px-3 py-2 flex items-center gap-3 transition-colors"
                  style={{ background: active ? "var(--accent-soft)" : "transparent" }}
                  role="option"
                  aria-selected={active}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <Icon className="w-3.5 h-3.5 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-text-primary">{a.label}</div>
                    <div className="text-[10px] text-text-tertiary">{a.hint}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
