"use client";

/**
 * Canvas page  —  /canvas
 *
 * Hosts the CanvasBoard with a floating toolbar.
 * The board takes up the full remaining viewport height.
 *
 * Toolbar actions:
 *   Add Note     — opens note-picker modal inside the board
 *   Add Concept  — drops a coloured concept node
 *   Add Text     — drops a minimal text label node
 *   ─────────
 *   Export PNG   — renders the current viewport to a PNG download
 *   Clear Canvas — removes all nodes & edges
 */

import { useRef, useState } from "react";
import { motion }           from "framer-motion";
import {
  StickyNote,
  Lightbulb,
  Type,
  Download,
  Trash2,
  Network,
  RotateCcw,
  Info,
} from "lucide-react";
import { CanvasBoardRef, type CanvasBoardHandle } from "@/components/canvas/CanvasBoard";
import { useCanvasStore } from "@/store/canvas.store";
import { fadeUp, fadeUpTransition } from "@/lib/animations";
import { cn } from "@/lib/utils";

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolBtn({
  icon,
  label,
  onClick,
  danger = false,
  accent = false,
  disabled = false,
}: {
  icon:      React.ReactNode;
  label:     string;
  onClick:   () => void;
  danger?:   boolean;
  accent?:   boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium transition-all select-none",
        danger
          ? "hover:bg-red-500/10 text-text-secondary hover:text-red-400"
          : accent
          ? "text-white"
          : "hover:bg-bg-elevated text-text-secondary hover:text-text-primary",
        disabled && "opacity-40 cursor-not-allowed"
      )}
      style={
        accent
          ? { background: "var(--accent)", color: "#fff" }
          : undefined
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const boardRef    = useRef<CanvasBoardHandle>(null);
  const nodeCount   = useCanvasStore((s) => s.nodes.length);
  const edgeCount   = useCanvasStore((s) => s.edges.length);

  const [showHint, setShowHint] = useState(false);

  const handleClear = () => {
    if (nodeCount === 0) return;
    if (!confirm("Clear the entire canvas? This cannot be undone.")) return;
    boardRef.current?.clearAll();
  };

  return (
    <div className="relative flex flex-col h-full -mt-1 gap-0">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={fadeUpTransition}
        className="flex items-center justify-between gap-3 pb-3 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Network className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} />
          <div className="min-w-0">
            <h1
              className="text-[18px] font-semibold tracking-tight leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Canvas
            </h1>
            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {nodeCount} node{nodeCount !== 1 ? "s" : ""} · {edgeCount} edge{edgeCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Info hint toggle */}
        <button
          onClick={() => setShowHint((h) => !h)}
          className="p-1.5 rounded-md hover:bg-bg-elevated transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          title="Keyboard shortcuts"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Hint bar */}
      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex flex-wrap gap-3 px-3 py-2 rounded-lg text-[11px] shrink-0"
          style={{
            background: "var(--bg-elevated)",
            border:     "1px solid var(--border)",
            color:      "var(--text-tertiary)",
          }}
        >
          {[
            ["Drag canvas",  "Pan"],
            ["Scroll",       "Zoom"],
            ["Click node",   "Select"],
            ["Dbl-click",    "Edit label"],
            ["Link button",  "Draw edge"],
            ["Click edge ×", "Remove edge"],
            ["Del / ⌫",       "Delete selected"],
            ["Esc",          "Deselect"],
          ].map(([key, desc]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd
                className="px-1 py-0.5 rounded text-[10px]"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)" }}
              >
                {key}
              </kbd>
              {desc}
            </span>
          ))}
        </motion.div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-xl mb-2 shrink-0 overflow-x-auto no-scrollbar"
        style={{
          background: "var(--bg-surface)",
          border:     "1px solid var(--border)",
        }}
      >
        {/* Add nodes */}
        <ToolBtn
          icon={<StickyNote className="w-3.5 h-3.5" />}
          label="Add Note"
          accent
          onClick={() => boardRef.current?.openNotePicker()}
        />
        <ToolBtn
          icon={<Lightbulb className="w-3.5 h-3.5" />}
          label="Add Concept"
          onClick={() => boardRef.current?.addConceptNode()}
        />
        <ToolBtn
          icon={<Type className="w-3.5 h-3.5" />}
          label="Add Text"
          onClick={() => boardRef.current?.addTextNode()}
        />

        {/* Spacer */}
        <div className="flex-1" />
        <div className="w-px h-5 shrink-0" style={{ background: "var(--border)" }} />

        {/* Viewport */}
        <ToolBtn
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          label="Reset view"
          onClick={() => boardRef.current?.resetViewport()}
        />

        {/* Export */}
        <ToolBtn
          icon={<Download className="w-3.5 h-3.5" />}
          label="Export PNG"
          onClick={() => boardRef.current?.exportPNG()}
          disabled={nodeCount === 0}
        />

        {/* Clear */}
        <ToolBtn
          icon={<Trash2 className="w-3.5 h-3.5" />}
          label="Clear"
          danger
          onClick={handleClear}
          disabled={nodeCount === 0}
        />
      </div>

      {/* ── Canvas board (fills remaining height) ─────────────────────────── */}
      <div
        className="flex-1 min-h-0 rounded-xl overflow-hidden"
        style={{
          border:     "1px solid var(--border)",
          minHeight:  400,
        }}
      >
        <CanvasBoardRef ref={boardRef} />
      </div>

      {/* Empty-state overlay (shown over the board when no nodes exist) */}
      {nodeCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <div
            className="flex flex-col items-center gap-2 p-6 rounded-2xl text-center"
            style={{
              background: "rgba(8,8,12,0.75)",
              backdropFilter: "blur(8px)",
              border: "1px solid var(--border)",
              maxWidth: 320,
            }}
          >
            <Network className="w-8 h-8 mb-1" style={{ color: "var(--accent)" }} />
            <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Your canvas is empty
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Add a note, concept, or text node from the toolbar above to get started.
              Drag the background to pan, scroll to zoom.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
