"use client";

/**
 * CanvasBoard.tsx
 *
 * Zero-external-library infinite canvas supporting:
 *  - Infinite pan (pointer-capture drag on background) and wheel zoom
 *  - Draggable sticky-note, concept, and text nodes
 *  - SVG cubic-bezier edges with midpoint ×-delete
 *  - Edge drawing via the per-node link button
 *  - Inline editing on double-click
 *  - Note side drawer (slide-from-right, no navigation)
 *  - Note picker search modal
 *  - PNG export via off-screen <canvas>
 *  - Del/⌫ to delete selected; Esc to deselect / cancel linking
 *
 * Exports
 * ───────
 *  CanvasBoardRef  — the default board component (forwardRef, imperative handle)
 *  CanvasBoardHandle — the ref interface used by the parent page toolbar
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Link2,
  ExternalLink,
  StickyNote,
  Lightbulb,
  BookOpen,
  Hash,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { useCanvasStore, type CanvasNode, type CanvasEdge } from "@/store/canvas.store";
import { useNotesStore }    from "@/store/notes.store";
import { subjectColor, wordCount, cn } from "@/lib/utils";
import type { Note } from "@/lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_ZOOM    = 0.2;
const MAX_ZOOM    = 3;
const NODE_COLORS = [
  "#7c6dfa", "#60a5fa", "#34d399", "#fb923c",
  "#fbbf24", "#f472b6", "#a3e635", "#818cf8",
];

// ── Shared helpers (module-level — not re-created on every render) ─────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function nodeCentre(node: CanvasNode) {
  return { cx: node.x + node.width / 2, cy: node.y + 48 };
}

function cubicPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
}

function noteSnippet(content: string, maxLen = 80) {
  const clean = content
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[#*`>_~\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > maxLen ? clean.slice(0, maxLen - 1) + "…" : clean;
}

// ── NodeCard ──────────────────────────────────────────────────────────────────

interface NodeCardProps {
  node:          CanvasNode;
  note:          Note | null;
  selected:      boolean;
  linking:       boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onDelete:      (id: string) => void;
  onEdit:        (id: string, label: string, body?: string) => void;
  onLinkStart:   (id: string) => void;
  onLinkEnd:     (id: string) => void;
  onNoteOpen:    (note: Note) => void;
}

function NodeCard({
  node, note, selected, linking,
  onPointerDown, onDelete, onEdit, onLinkStart, onLinkEnd, onNoteOpen,
}: NodeCardProps) {
  const [editing,   setEditing]   = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const [editBody,  setEditBody]  = useState(node.body ?? "");
  const labelRef = useRef<HTMLInputElement>(null);

  const commitEdit = () => {
    setEditing(false);
    onEdit(node.id, editLabel.trim() || node.label, editBody);
  };

  const dot = note ? subjectColor(note.subject) : (node.color || "#7c6dfa");

  const borderColor = selected
    ? "var(--accent)"
    : linking
    ? "#34d399"
    : node.type === "concept"
    ? (node.color || "var(--border-strong)")
    : "var(--border)";

  const bg = node.type === "text"
    ? "transparent"
    : node.type === "concept"
    ? `color-mix(in srgb, ${node.color || "#7c6dfa"} 12%, var(--bg-surface) 88%)`
    : "var(--bg-surface)";

  return (
    <div
      className="absolute select-none"
      style={{ left: node.x, top: node.y, width: node.width, cursor: "grab", zIndex: selected ? 20 : 10 }}
      onPointerDown={(e) => onPointerDown(e, node.id)}
    >
      <div
        className="relative rounded-xl overflow-visible"
        style={{
          background: bg,
          border: node.type === "text" ? "none" : `1px solid ${borderColor}`,
          boxShadow: selected
            ? "0 0 0 2px var(--accent), 0 8px 32px rgba(0,0,0,0.4)"
            : "0 2px 12px rgba(0,0,0,0.25)",
          transition: "box-shadow 0.15s, border-color 0.15s",
        }}
      >
        {/* Delete button */}
        <button
          className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center z-30 transition-opacity"
          style={{
            background: "var(--bg-elevated)",
            border:     "1px solid var(--border-strong)",
            color:      "var(--text-tertiary)",
            opacity:    selected ? 1 : 0,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
          title="Delete node"
        >
          <X className="w-2.5 h-2.5" />
        </button>

        {/* Link button */}
        <button
          className={cn("absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full flex items-center justify-center z-30 transition-all", linking && "scale-110")}
          style={{
            background: linking ? "#34d399" : "var(--bg-elevated)",
            border:     `1px solid ${linking ? "#34d399" : "var(--border-strong)"}`,
            color:      linking ? "#fff" : "var(--text-tertiary)",
            opacity:    selected || linking ? 1 : 0,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); linking ? onLinkEnd(node.id) : onLinkStart(node.id); }}
          title={linking ? "Connect here" : "Draw edge"}
        >
          <Link2 className="w-2.5 h-2.5" />
        </button>

        {/* ── Content ─────────────────────────────────────────────────────── */}

        {node.type === "note" && note ? (
          <div
            className="p-3 cursor-pointer"
            onDoubleClick={(e) => { e.stopPropagation(); onNoteOpen(note); }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
              <span className="text-[12px] font-semibold truncate flex-1" style={{ color: "var(--text-primary)" }}>
                {note.title}
              </span>
              <button
                className="shrink-0 opacity-0 hover:opacity-100 transition-opacity"
                style={{ color: "var(--accent)" }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onNoteOpen(note); }}
                title="Open note"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            {note.content && (
              <p className="text-[10px] leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                {noteSnippet(note.content, 120)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2" style={{ color: "var(--text-tertiary)" }}>
              <span className="text-[9px]">{wordCount(note.content)} words</span>
              <span className="text-[9px]">{note.subject}</span>
            </div>
          </div>

        ) : node.type === "concept" ? (
          <div
            className="p-3"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setTimeout(() => labelRef.current?.focus(), 0); }}
          >
            {editing ? (
              <div onPointerDown={(e) => e.stopPropagation()} className="flex flex-col gap-1.5">
                <input
                  ref={labelRef}
                  className="w-full bg-transparent text-[12px] font-semibold outline-none border-b"
                  style={{ color: "var(--text-primary)", borderColor: "var(--border-strong)" }}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
                    if (e.key === "Escape") setEditing(false);
                  }}
                  onBlur={commitEdit}
                />
                <textarea
                  className="w-full bg-transparent text-[11px] outline-none resize-none"
                  style={{ color: "var(--text-secondary)", minHeight: 48 }}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  onBlur={commitEdit}
                  placeholder="Description…"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3 h-3 shrink-0" style={{ color: dot }} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {node.label}
                  </span>
                </div>
                {node.body && (
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {node.body}
                  </p>
                )}
              </>
            )}
          </div>

        ) : (
          /* text node */
          <div
            className="px-2 py-1.5 min-w-[80px]"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setTimeout(() => labelRef.current?.focus(), 0); }}
          >
            {editing ? (
              <input
                ref={labelRef}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-transparent text-[13px] font-medium outline-none w-full"
                style={{ color: "var(--text-primary)" }}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" || e.key === "Escape") commitEdit();
                }}
                onBlur={commitEdit}
              />
            ) : (
              <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                {node.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── EdgeLine ──────────────────────────────────────────────────────────────────

function EdgeLine({ edge, nodes, onRemove }: { edge: CanvasEdge; nodes: CanvasNode[]; onRemove: (id: string) => void }) {
  const src = nodes.find((n) => n.id === edge.source);
  const tgt = nodes.find((n) => n.id === edge.target);
  if (!src || !tgt) return null;

  const { cx: x1, cy: y1 } = nodeCentre(src);
  const { cx: x2, cy: y2 } = nodeCentre(tgt);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const d  = cubicPath(x1, y1, x2, y2);

  return (
    <g>
      <path d={d} fill="none" stroke="transparent" strokeWidth={12} style={{ cursor: "pointer" }} onClick={() => onRemove(edge.id)} />
      <path d={d} fill="none" stroke="rgba(124,109,250,0.45)" strokeWidth={1.5} strokeDasharray="5 3" />
      <circle cx={x2} cy={y2} r={3} fill="rgba(124,109,250,0.7)" />
      <g style={{ cursor: "pointer" }} onClick={() => onRemove(edge.id)}>
        <circle cx={mx} cy={my} r={8} fill="var(--bg-elevated)" stroke="var(--border-strong)" />
        <line x1={mx-3} y1={my-3} x2={mx+3} y2={my+3} stroke="var(--text-tertiary)" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={mx+3} y1={my-3} x2={mx-3} y2={my+3} stroke="var(--text-tertiary)" strokeWidth={1.5} strokeLinecap="round" />
      </g>
    </g>
  );
}

// ── Note side drawer ──────────────────────────────────────────────────────────

function NoteDrawer({ note, onClose }: { note: Note; onClose: () => void }) {
  const dot    = subjectColor(note.subject);
  const folder = useNotesStore(
    useCallback((s) => s.folders.find((f) => f.id === note.folderId) ?? null, [note.folderId])
  );

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
      style={{ width: 340, background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "-12px 0 40px rgba(0,0,0,0.35)" }}
    >
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
        <span className="flex-1 text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{note.title}</span>
        <Link href={`/notes/${note.id}`} className="p-1.5 rounded-md hover:bg-bg-elevated transition-colors" style={{ color: "var(--accent)" }} title="Open full editor">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-bg-elevated transition-colors" style={{ color: "var(--text-secondary)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          <BookOpen className="w-3 h-3" /> {note.subject}
        </span>
        {folder && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            <FolderOpen className="w-3 h-3" /> {folder.name}
          </span>
        )}
        {note.tags.length > 0 && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            <Hash className="w-3 h-3" /> {note.tags.slice(0, 3).join(", ")}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
        {note.content
          .replace(/\[\[([^\]]+)\]\]/g, "$1")
          .replace(/#{1,6}\s/g, "")
          .replace(/[*`_~]/g, "")
          .trim() || "No content yet."}
      </div>

      <div className="px-4 py-2.5 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <Link href={`/notes/${note.id}`} className="btn-primary w-full flex items-center justify-center gap-2 text-[12px] h-8">
          <ExternalLink className="w-3.5 h-3.5" /> Open full editor
        </Link>
      </div>
    </motion.aside>
  );
}

// ── Imperative handle type ────────────────────────────────────────────────────

export interface CanvasBoardHandle {
  addTextNode:    () => void;
  addConceptNode: () => void;
  openNotePicker: () => void;
  exportPNG:      () => void;
  clearAll:       () => void;
  resetViewport:  () => void;
}

// ── CanvasBoardRef — the single exported board component ──────────────────────

export const CanvasBoardRef = forwardRef<CanvasBoardHandle>(
  function CanvasBoardRef(_props, ref) {
    const {
      nodes, edges, viewport,
      addNode, updateNode, removeNode, clearAll,
      addEdge, removeEdge, setViewport, resetViewport,
    } = useCanvasStore();

    const allNotes     = useNotesStore((s) => s.notes);
    const visibleNotes = useMemo(() => allNotes.filter((n) => !n.trashed && !n.archived), [allNotes]);
    const noteMap      = useMemo(() => new Map(allNotes.map((n) => [n.id, n])), [allNotes]);

    const boardRef = useRef<HTMLDivElement>(null);
    const svgRef   = useRef<SVGSVGElement>(null);

    const [selectedId,     setSelectedId]     = useState<string | null>(null);
    const [linkingFrom,    setLinkingFrom]    = useState<string | null>(null);
    const [openNote,       setOpenNote]       = useState<Note | null>(null);
    const [notePickerOpen, setNotePickerOpen] = useState(false);
    const [noteSearch,     setNoteSearch]     = useState("");
    const [pendingLine,    setPendingLine]    = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

    const dragging = useRef<{
      kind: "node" | "pan";
      nodeId?: string;
      startX: number; startY: number;
      origX:  number; origY:  number;
    } | null>(null);

    // ── Coordinate conversion ────────────────────────────────────────────────
    const screenToCanvas = useCallback((sx: number, sy: number) => {
      const { x, y, zoom } = viewport;
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return { cx: 0, cy: 0 };
      return { cx: (sx - rect.left - x) / zoom, cy: (sy - rect.top - y) / zoom };
    }, [viewport]);

    const nextPos = useCallback(() => {
      const rect = boardRef.current?.getBoundingClientRect();
      return screenToCanvas(
        (rect?.left ?? 0) + (rect?.width  ?? 800) / 2 + (Math.random() - 0.5) * 160,
        (rect?.top  ?? 0) + (rect?.height ?? 600) / 2 + (Math.random() - 0.5) * 100,
      );
    }, [screenToCanvas]);

    // ── Imperative handle ────────────────────────────────────────────────────
    const addTextNodeFn    = useCallback(() => { const { cx, cy } = nextPos(); addNode({ type: "text", label: "Label", x: cx, y: cy, width: 120 }); }, [addNode, nextPos]);
    const addConceptNodeFn = useCallback(() => {
      const { cx, cy } = nextPos();
      const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
      addNode({ type: "concept", label: "Concept", body: "", x: cx, y: cy, width: 180, color });
    }, [addNode, nextPos]);

    const exportPNG = useCallback(async () => {
      const board = boardRef.current;
      if (!board) return;
      const SCALE = 2;
      const rect  = board.getBoundingClientRect();
      const cvs   = document.createElement("canvas");
      cvs.width   = rect.width  * SCALE;
      cvs.height  = rect.height * SCALE;
      const ctx   = cvs.getContext("2d")!;
      ctx.scale(SCALE, SCALE);

      // Background
      ctx.fillStyle = "#08080c";
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Grid dots
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      const gs = 32 * viewport.zoom;
      const ox = viewport.x % gs;
      const oy = viewport.y % gs;
      for (let gx = ox; gx < rect.width;  gx += gs)
        for (let gy = oy; gy < rect.height; gy += gs) {
          ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill();
        }

      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);

      // Edges
      ctx.strokeStyle = "rgba(124,109,250,0.45)";
      ctx.lineWidth   = 1.5 / viewport.zoom;
      ctx.setLineDash([5, 3]);
      for (const edge of edges) {
        const s = nodes.find((n) => n.id === edge.source);
        const t = nodes.find((n) => n.id === edge.target);
        if (!s || !t) continue;
        const { cx: x1, cy: y1 } = nodeCentre(s);
        const { cx: x2, cy: y2 } = nodeCentre(t);
        const dx = Math.abs(x2 - x1) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Nodes
      for (const node of nodes) {
        const note  = node.noteId ? noteMap.get(node.noteId) : undefined;
        const color = note ? subjectColor(note.subject) : (node.color || "#7c6dfa");
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        ctx.save();
        ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
        const { x, y, width } = node;
        const h = 64; const rr = 12; const pad = 12;
        ctx.beginPath();
        ctx.moveTo(x + rr, y); ctx.lineTo(x + width - rr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + rr);
        ctx.lineTo(x + width, y + h - rr);
        ctx.quadraticCurveTo(x + width, y + h, x + width - rr, y + h);
        ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
        if (node.type !== "text") ctx.fill();
        ctx.fillStyle = "#f0f0f5";
        ctx.font = `600 12px ui-sans-serif,system-ui,sans-serif`;
        ctx.fillText(note?.title || node.label, x + pad, y + 28, width - pad * 2);
        if (node.body || (note?.content)) {
          ctx.fillStyle = "#9999a8";
          ctx.font      = `400 10px ui-sans-serif,system-ui,sans-serif`;
          const preview = note?.content ? noteSnippet(note.content, 40) : (node.body || "").slice(0, 40);
          ctx.fillText(preview, x + pad, y + 46, width - pad * 2);
        }
        ctx.restore();
      }
      ctx.restore();

      const url = cvs.toDataURL("image/png");
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `vyronotes-canvas-${Date.now()}.png`;
      a.click();
    }, [nodes, edges, viewport, noteMap]);

    useImperativeHandle(ref, () => ({
      addTextNode:    addTextNodeFn,
      addConceptNode: addConceptNodeFn,
      openNotePicker: () => setNotePickerOpen(true),
      exportPNG,
      clearAll,
      resetViewport,
    }));

    // ── Pointer handlers ─────────────────────────────────────────────────────
    const handleNodePointerDown = useCallback((e: React.PointerEvent, nodeId: string) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      if (linkingFrom && linkingFrom !== nodeId) {
        addEdge(linkingFrom, nodeId);
        setLinkingFrom(null);
        setPendingLine(null);
        return;
      }
      setSelectedId(nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragging.current = { kind: "node", nodeId, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y };
    }, [nodes, linkingFrom, addEdge]);

    const handleBoardPointerDown = useCallback((e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (linkingFrom) { setLinkingFrom(null); setPendingLine(null); return; }
      setSelectedId(null);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragging.current = { kind: "pan", startX: e.clientX, startY: e.clientY, origX: viewport.x, origY: viewport.y };
    }, [viewport, linkingFrom]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      if (linkingFrom) {
        const srcNode = nodes.find((n) => n.id === linkingFrom);
        if (srcNode) {
          const { cx, cy } = nodeCentre(srcNode);
          const { cx: mx, cy: my } = screenToCanvas(e.clientX, e.clientY);
          setPendingLine({ x1: cx, y1: cy, x2: mx, y2: my });
        }
      }
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.startX;
      const dy = e.clientY - dragging.current.startY;
      if (dragging.current.kind === "pan") {
        setViewport({ x: dragging.current.origX + dx, y: dragging.current.origY + dy });
      } else if (dragging.current.nodeId) {
        updateNode(dragging.current.nodeId, {
          x: dragging.current.origX + dx / viewport.zoom,
          y: dragging.current.origY + dy / viewport.zoom,
        });
      }
    }, [linkingFrom, nodes, screenToCanvas, updateNode, viewport.zoom, setViewport]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      const factor  = e.deltaY < 0 ? 1.08 : 0.93;
      const newZoom = clamp(viewport.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const rect    = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      setViewport({
        zoom: newZoom,
        x: ox - (ox - viewport.x) * (newZoom / viewport.zoom),
        y: oy - (oy - viewport.y) * (newZoom / viewport.zoom),
      });
    }, [viewport, setViewport]);

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        const tag = (document.activeElement as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
          removeNode(selectedId);
          setSelectedId(null);
        }
        if (e.key === "Escape") {
          setLinkingFrom(null);
          setPendingLine(null);
          setSelectedId(null);
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [selectedId, removeNode]);

    // ── Note picker filter ───────────────────────────────────────────────────
    const filteredNotes = useMemo(() => {
      const q = noteSearch.toLowerCase().trim();
      return q
        ? visibleNotes.filter((n) => n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q)).slice(0, 12)
        : visibleNotes.slice(0, 12);
    }, [visibleNotes, noteSearch]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ background: "var(--bg-base, #08080c)" }}>

        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.35 }}>
          <defs>
            <pattern
              id="canvas-grid"
              x={viewport.x % 32} y={viewport.y % 32}
              width={32 * viewport.zoom} height={32 * viewport.zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={1} cy={1} r={1} fill="rgba(255,255,255,0.08)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#canvas-grid)" />
        </svg>

        {/* Pan + drag surface */}
        <div
          ref={boardRef}
          className="absolute inset-0"
          style={{ cursor: linkingFrom ? "crosshair" : "default" }}
          onPointerDown={handleBoardPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => { dragging.current = null; }}
          onWheel={handleWheel}
        >
          {/* SVG edge layer */}
          <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ overflow: "visible", pointerEvents: "none" }}>
            <g
              style={{ transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.zoom})` }}
              className="pointer-events-auto"
            >
              {edges.map((edge) => (
                <EdgeLine key={edge.id} edge={edge} nodes={nodes} onRemove={removeEdge} />
              ))}
              {pendingLine && (
                <path
                  d={cubicPath(pendingLine.x1, pendingLine.y1, pendingLine.x2, pendingLine.y2)}
                  fill="none" stroke="#34d399" strokeWidth={1.5} strokeDasharray="6 3"
                  style={{ pointerEvents: "none" }}
                />
              )}
            </g>
          </svg>

          {/* Node layer */}
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: "0 0" }}
          >
            {nodes.map((node) => {
              const note = node.noteId ? (noteMap.get(node.noteId) ?? null) : null;
              return (
                <NodeCard
                  key={node.id}
                  node={node}
                  note={note}
                  selected={selectedId === node.id}
                  linking={linkingFrom === node.id}
                  onPointerDown={handleNodePointerDown}
                  onDelete={removeNode}
                  onEdit={(id, label, body) => updateNode(id, { label, body })}
                  onLinkStart={setLinkingFrom}
                  onLinkEnd={(targetId) => {
                    if (linkingFrom) addEdge(linkingFrom, targetId);
                    setLinkingFrom(null);
                    setPendingLine(null);
                  }}
                  onNoteOpen={setOpenNote}
                />
              );
            })}
          </div>
        </div>

        {/* Note side drawer */}
        <AnimatePresence>
          {openNote && <NoteDrawer note={openNote} onClose={() => setOpenNote(null)} />}
        </AnimatePresence>

        {/* Note picker modal */}
        <AnimatePresence>
          {notePickerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => { setNotePickerOpen(false); setNoteSearch(""); }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute z-50 rounded-xl overflow-hidden"
                style={{
                  top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  width: 360,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <StickyNote className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                  <input
                    autoFocus
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    placeholder="Search notes…"
                    className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <button onClick={() => { setNotePickerOpen(false); setNoteSearch(""); }} style={{ color: "var(--text-tertiary)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: 320 }}>
                  {filteredNotes.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>No notes found</p>
                  ) : filteredNotes.map((note) => {
                    const dot = subjectColor(note.subject);
                    return (
                      <button
                        key={note.id}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left"
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        onClick={() => {
                          const rect = boardRef.current?.getBoundingClientRect();
                          const { cx, cy } = screenToCanvas(
                            (rect?.left ?? 0) + (rect?.width ?? 800) / 2 + (Math.random() - 0.5) * 160,
                            (rect?.top  ?? 0) + (rect?.height ?? 600) / 2 + (Math.random() - 0.5) * 100,
                          );
                          addNode({ type: "note", label: note.title, noteId: note.id, x: cx, y: cy, width: 220 });
                          setNotePickerOpen(false);
                          setNoteSearch("");
                        }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{note.title}</div>
                          <div className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>{note.subject} · {wordCount(note.content)} words</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Linking hint banner */}
        <AnimatePresence>
          {linkingFrom && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full text-[12px] font-medium pointer-events-none"
              style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.35)", color: "#34d399" }}
            >
              Click another node to connect — Esc to cancel
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom indicator */}
        <div
          className="absolute bottom-4 right-4 text-[11px] tabular-nums px-2 py-1 rounded-md z-20"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
        >
          {Math.round(viewport.zoom * 100)}%
        </div>
      </div>
    );
  }
);
