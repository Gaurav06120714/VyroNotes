"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GitBranch, StickyNote, Link2, Unlink } from "lucide-react";
import { useNotesStore } from "@/store/notes.store";
import { buildGraphData } from "@/lib/buildGraphData";
import { GraphView } from "@/components/graph/GraphView";
import { fadeUp, fadeUpTransition, stagger, staggerItem } from "@/lib/animations";

// ── Stat pill ─────────────────────────────────────────────────────────────────

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}

function StatPill({ icon, label, value, accent }: StatPillProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{
        background: accent
          ? "rgba(124,109,250,0.08)"
          : "var(--bg-elevated)",
        border: `1px solid ${accent ? "rgba(124,109,250,0.18)" : "var(--border)"}`,
      }}
    >
      <span
        className="shrink-0"
        style={{ color: accent ? "var(--accent)" : "var(--text-tertiary)" }}
      >
        {icon}
      </span>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </span>
      <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GraphPage() {
  // Zustand v5 best practice: select the raw array, never derive inside selector.
  const notes = useNotesStore((s) => s.notes);

  // Derive visible (non-trashed, non-archived) notes outside the selector.
  const visibleNotes = useMemo(
    () => notes.filter((n) => !n.trashed && !n.archived),
    [notes]
  );

  // Build graph stats for the header pills — memoised separately so the
  // GraphView component can also call buildGraphData independently with
  // the full notes array (it does its own internal filtering).
  const stats = useMemo(() => {
    const g = buildGraphData(notes);
    return g.stats;
  }, [notes]);

  return (
    <motion.div
      className="flex flex-col gap-5 h-full"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        transition={fadeUpTransition}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        {/* Title + description */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <GitBranch
              className="w-5 h-5 shrink-0"
              style={{ color: "var(--accent)" }}
            />
            <h1
              className="text-[20px] font-semibold tracking-tight leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Graph View
            </h1>
          </div>
          <p
            className="text-[13px] leading-snug pl-7"
            style={{ color: "var(--text-tertiary)" }}
          >
            Visualise connections between your notes via{" "}
            <code
              className="px-1 py-0.5 rounded text-[11px]"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
              }}
            >
              [[wikilinks]]
            </code>
          </p>
        </div>

        {/* Stat pills — stagger in after header */}
        <motion.div
          variants={stagger}
          className="flex items-center gap-2 flex-wrap"
        >
          <StatPill
            icon={<StickyNote className="w-3.5 h-3.5" />}
            label="notes"
            value={stats.totalNodes}
          />
          <StatPill
            icon={<Link2 className="w-3.5 h-3.5" />}
            label="connections"
            value={stats.totalEdges}
            accent
          />
          <StatPill
            icon={<Unlink className="w-3.5 h-3.5" />}
            label="orphans"
            value={stats.orphanCount}
          />
        </motion.div>
      </motion.div>

      {/* ── Graph canvas ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={staggerItem}
        // On mobile the graph fills remaining viewport height;
        // on md+ it uses a fixed comfortable height.
        className="flex-1 min-h-0 md:flex-none"
        style={{ height: undefined }} // let CSS below control it
      >
        {visibleNotes.length === 0 ? (
          <EmptyState />
        ) : (
          <GraphView
            notes={notes}
            className="w-full h-full md:h-[calc(100vh-13rem)]"
          />
        )}
      </motion.div>

      {/* ── Legend / help row (desktop only) ─────────────────────────────────── */}
      <motion.div
        variants={staggerItem}
        className="hidden md:flex items-center gap-6 px-1 pb-1"
      >
        {(
          [
            { dot: "var(--accent)",                    text: "Linked note — has at least one [[wikilink]]"  },
            { dot: "rgba(255,255,255,0.18)", dashed: true, text: "Orphan note — no outgoing or incoming links" },
          ] as { dot: string; dashed?: boolean; text: string }[]
        ).map(({ dot, dashed, text }) => (
          <div key={text} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: dot,
                border: dashed ? "1px dashed rgba(255,255,255,0.3)" : "none",
              }}
            />
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {text}
            </span>
          </div>
        ))}

        <span
          className="text-[11px] ml-auto"
          style={{ color: "var(--text-tertiary)" }}
        >
          Scroll to zoom · Drag to pan · Click a node to open the note
        </span>
      </motion.div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      variants={fadeUp}
      transition={fadeUpTransition}
      className="flex flex-col items-center justify-center gap-4 rounded-xl py-20 px-6 text-center"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(124,109,250,0.08)", border: "1px solid rgba(124,109,250,0.15)" }}
      >
        <GitBranch className="w-7 h-7" style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p
          className="text-[15px] font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          No notes yet
        </p>
        <p
          className="text-[13px] max-w-xs leading-relaxed"
          style={{ color: "var(--text-tertiary)" }}
        >
          Create some notes and link them with{" "}
          <code
            className="px-1 py-0.5 rounded text-[11px]"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            [[Note Title]]
          </code>{" "}
          to see the graph come alive.
        </p>
      </div>
    </motion.div>
  );
}
