"use client";

/**
 * GraphView.tsx
 *
 * Obsidian-style interactive graph view for VyroNotes.
 *
 * Architecture:
 *  - react-force-graph-2d renders the canvas (WebGL-backed, handles 500+ nodes).
 *  - All graph data comes from buildGraphData() — pure function, memoized here.
 *  - Hover state drives per-node opacity/glow via nodeCanvasObject (custom draw).
 *  - Controls panel (search, orphan toggle, zoom buttons) overlaid in HTML.
 *  - Framer Motion wraps the outer shell for page-entry animation only;
 *    canvas internals are not animated to preserve performance.
 *  - Dynamic import with ssr:false — react-force-graph-2d uses browser APIs.
 */

import dynamic from "next/dynamic";
import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  GitBranch,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildGraphData, type GraphNode } from "@/lib/buildGraphData";
import type { Note } from "@/lib/types";

// ── SSR-safe dynamic import ────────────────────────────────────────────────────
// react-force-graph-2d accesses window/canvas on import — must be client-only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

// ── Design tokens (mirror globals.css CSS vars) ───────────────────────────────
const COLORS = {
  bg:              "#08080c",
  surface:         "#101015",
  elevated:        "#16161e",
  border:          "rgba(255,255,255,0.06)",
  borderStrong:    "rgba(255,255,255,0.10)",
  accent:          "#7c6dfa",
  accentGlow:      "rgba(124,109,250,0.45)",
  accentSoft:      "rgba(124,109,250,0.10)",
  textPrimary:     "#f0f0f5",
  textSecondary:   "#9999a8",
  textTertiary:    "#5c5c6e",
  linkDefault:     "rgba(255,255,255,0.08)",
  linkHighlight:   "rgba(124,109,250,0.55)",
  nodeDimOpacity:  0.18,
} as const;

// ── Internal force-graph types ────────────────────────────────────────────────
// react-force-graph-2d's FCwithRef generic is tied to its own internal base
// NodeObject shape. We use `any` for the ref and canvas callbacks, then cast
// to GraphNode internally — this avoids a deeply-nested generic mismatch in
// the library's overloaded component signature.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FGRef = React.MutableRefObject<any>;

// Alias for readability in internal cast sites only.
type AnyNode = Record<string, unknown> & { x?: number; y?: number };

// ── Sub-components ────────────────────────────────────────────────────────────

function GraphSkeleton() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: COLORS.bg }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-2 animate-spin"
            style={{
              borderColor: `${COLORS.accent} transparent transparent transparent`,
            }}
          />
        </div>
        <p className="text-[12px]" style={{ color: COLORS.textTertiary }}>
          Building graph…
        </p>
      </div>
    </div>
  );
}

interface TooltipProps {
  node: GraphNode | null;
  position: { x: number; y: number };
}

function NodeTooltip({ node, position }: TooltipProps) {
  if (!node) return null;
  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        initial={{ opacity: 0, scale: 0.92, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 4 }}
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none fixed z-50 max-w-[220px]"
        style={{
          left: position.x + 14,
          top:  position.y - 8,
          background: COLORS.elevated,
          border: `1px solid ${COLORS.borderStrong}`,
          borderRadius: 10,
          padding: "8px 10px",
          boxShadow: `0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px ${COLORS.borderStrong}`,
        }}
      >
        {/* Subject dot + title */}
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: node.color }}
          />
          <span
            className="text-[12px] font-semibold leading-tight truncate"
            style={{ color: COLORS.textPrimary }}
          >
            {node.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[10px]" style={{ color: COLORS.textTertiary }}>
          <span>{node.subject}</span>
          <span>·</span>
          <span>{node.connections} link{node.connections !== 1 ? "s" : ""}</span>
          {node.pinned && (
            <>
              <span>·</span>
              <span style={{ color: COLORS.accent }}>pinned</span>
            </>
          )}
        </div>

        {/* Orphan badge */}
        {node.type === "orphan" && (
          <div
            className="mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full inline-block"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: COLORS.textTertiary,
            }}
          >
            no links
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Stats badge ───────────────────────────────────────────────────────────────

interface StatsProps {
  totalNodes: number;
  totalEdges: number;
  linkedCount: number;
  orphanCount: number;
  visible: number;
}

function StatsBadge({ totalNodes, totalEdges, linkedCount, orphanCount, visible }: StatsProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors focus-ring"
        style={{
          background: COLORS.elevated,
          border: `1px solid ${COLORS.border}`,
          color: COLORS.textSecondary,
        }}
        aria-label="Graph statistics"
      >
        <Info className="w-3 h-3" />
        <span>{visible} nodes</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full mt-1.5 right-0 w-44 rounded-xl p-3 z-20 space-y-1.5"
            style={{
              background: COLORS.elevated,
              border: `1px solid ${COLORS.borderStrong}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {(
              [
                ["Total notes",   totalNodes],
                ["Connections",   totalEdges],
                ["Linked",        linkedCount],
                ["Orphans",       orphanCount],
                ["Visible",       visible],
              ] as [string, number][]
            ).map(([label, val]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[11px]" style={{ color: COLORS.textTertiary }}>{label}</span>
                <span
                  className="text-[12px] font-semibold tabular-nums"
                  style={{ color: COLORS.textPrimary }}
                >
                  {val}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Canvas draw helpers ───────────────────────────────────────────────────────

/**
 * Custom canvas painter for a single node.
 * Draws:  glow halo → filled circle → accent ring (if hovered/connected) → label
 */
function paintNode(
  node:        AnyNode,
  ctx:         CanvasRenderingContext2D,
  globalScale: number,
  hoveredId:   string | null,
  connectedIds: Set<string>,
  searchMatch:  Set<string>,
) {
  const gn = node as AnyNode & GraphNode;
  const x  = node.x ?? 0;
  const y  = node.y ?? 0;
  const r  = gn.size ?? 5;

  // ── Opacity logic ──────────────────────────────────────────────────────────
  let opacity = 1;
  if (hoveredId !== null) {
    if (gn.id === hoveredId || connectedIds.has(String(gn.id))) {
      opacity = 1;
    } else {
      opacity = COLORS.nodeDimOpacity;
    }
  }
  if (searchMatch.size > 0) {
    opacity = searchMatch.has(String(gn.id)) ? 1 : COLORS.nodeDimOpacity;
  }

  const isActive = hoveredId === gn.id;
  const isConn   = connectedIds.has(String(gn.id));

  ctx.save();
  ctx.globalAlpha = opacity;

  // ── Glow halo (only for hovered or connected) ──────────────────────────────
  if (isActive || isConn) {
    const glowRadius = r * (isActive ? 3.2 : 2.2);
    const grad = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowRadius);
    const glowColor = isActive ? COLORS.accentGlow : `${gn.color}55`;
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ── Node circle ────────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);

  if (isActive) {
    // Solid accent fill when hovered
    ctx.fillStyle = COLORS.accent;
    ctx.shadowColor = COLORS.accentGlow;
    ctx.shadowBlur  = 12;
  } else {
    // Subject-coloured fill, slightly dimmed for non-hover
    ctx.fillStyle = gn.color ?? COLORS.accent;
    ctx.shadowBlur = 0;
  }
  ctx.fill();

  // ── Accent ring for connected nodes ───────────────────────────────────────
  if (isConn && !isActive) {
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  }

  // ── Orphan dashed ring ─────────────────────────────────────────────────────
  if (gn.type === "orphan" && hoveredId === null && searchMatch.size === 0) {
    ctx.setLineDash([1.5, 2]);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth   = 0.7;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.shadowBlur = 0;

  // ── Label (only render when zoomed in enough, or when hovered/connected) ──
  const labelThreshold = 2.5;
  const showLabel = globalScale > labelThreshold || isActive || isConn;

  if (showLabel) {
    const fontSize = Math.max(2, Math.min(5, r * 0.9));
    ctx.font        = `${isActive ? 600 : 400} ${fontSize}px Inter, ui-sans-serif`;
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle   = isActive ? "#ffffff" : COLORS.textPrimary;
    ctx.globalAlpha = opacity * (isActive ? 1 : 0.75);
    ctx.fillText(gn.label ?? "", x, y + r + fontSize + 1);
  }

  ctx.restore();
}

// ── Main component ────────────────────────────────────────────────────────────

export interface GraphViewProps {
  /** All notes from useNotesStore — component handles filtering internally. */
  notes: Note[];
  /** Container height in px. Defaults to full viewport minus a header offset. */
  height?: number;
  /** Extra className for the outer wrapper. */
  className?: string;
}

export function GraphView({ notes, height, className }: GraphViewProps) {
  const router    = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null) as FGRef;
  const wrapRef   = useRef<HTMLDivElement>(null);

  // ── Dimensions — measure wrapper on mount + resize ─────────────────────────
  const [dims, setDims] = useState({ w: 800, h: height ?? 600 });
  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height: h } = entry.contentRect;
      setDims({ w: Math.floor(width), h: Math.floor(h) });
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [showOrphans,  setShowOrphans]  = useState(true);
  const [hoveredNode,  setHoveredNode]  = useState<string | null>(null);
  const [tooltip,      setTooltip]      = useState<{
    node: GraphNode | null;
    position: { x: number; y: number };
  }>({ node: null, position: { x: 0, y: 0 } });

  // ── Graph data — memoised; only rebuilds when notes array reference changes ─
  const graphData = useMemo(() => buildGraphData(notes), [notes]);

  // ── Pre-compute adjacency set for the hovered node ────────────────────────
  // Using a Map<nodeId, Set<connectedId>> would be O(1) lookup for 500+ nodes.
  const adjacencyMap = useMemo<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of graphData.edges) {
      const s = edge.source;
      const t = edge.target;
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    }
    return map;
  }, [graphData.edges]);

  const connectedIds = useMemo<Set<string>>(
    () => (hoveredNode ? (adjacencyMap.get(hoveredNode) ?? new Set()) : new Set()),
    [hoveredNode, adjacencyMap]
  );

  // ── Search match set ───────────────────────────────────────────────────────
  const searchMatch = useMemo<Set<string>>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return new Set<string>();
    return new Set(
      graphData.nodes
        .filter((n) => n.label.toLowerCase().includes(q))
        .map((n) => n.id)
    );
  }, [search, graphData.nodes]);

  // ── Filtered node/link data passed to force-graph ─────────────────────────
  // force-graph uses `links` (not `edges`) and accepts plain objects.
  const fgData = useMemo(() => {
    const visibleNodes = graphData.nodes.filter((n) =>
      showOrphans ? true : n.type === "linked"
    );
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleLinks = graphData.edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nodes: visibleNodes as any[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      links: visibleLinks as any[],
    };
  }, [graphData, showOrphans]);

  // ── Count of currently visible nodes (for stats badge) ────────────────────
  const visibleCount = fgData.nodes.length;

  // ── Node canvas painter — stable callback, reads refs via closure ──────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      paintNode(node as AnyNode, ctx, globalScale, hoveredNode, connectedIds, searchMatch);
    },
    [hoveredNode, connectedIds, searchMatch]
  );

  // Pointer area — use same radius so click hit-box matches visual size
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodePointerAreaPaint = useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const gn = node as AnyNode & GraphNode;
      const r  = (gn.size ?? 5) + 3; // slightly larger for easier clicking
      ctx.beginPath();
      ctx.arc(gn.x ?? 0, gn.y ?? 0, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  // ── Link colour ────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkColor = useCallback(
    (link: any) => {
      if (hoveredNode === null && searchMatch.size === 0) return COLORS.linkDefault;
      const s = typeof link.source === "object" ? link.source?.id : link.source;
      const t = typeof link.target === "object" ? link.target?.id : link.target;
      const active =
        String(s) === hoveredNode ||
        String(t) === hoveredNode ||
        (searchMatch.size > 0 && (searchMatch.has(String(s)) || searchMatch.has(String(t))));
      return active ? COLORS.linkHighlight : `rgba(255,255,255,0.03)`;
    },
    [hoveredNode, searchMatch]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkWidth = useCallback(
    (link: any) => {
      const s = typeof link.source === "object" ? link.source?.id : link.source;
      const t = typeof link.target === "object" ? link.target?.id : link.target;
      const active = String(s) === hoveredNode || String(t) === hoveredNode;
      return active ? 1.4 : 0.5;
    },
    [hoveredNode]
  );

  // ── Event handlers ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback(
    (node: any) => {
      router.push(`/notes/${(node as GraphNode).id}`);
    },
    [router]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeHover = useCallback(
    (node: any) => {
      setHoveredNode(node ? String((node as GraphNode).id) : null);
    },
    []
  );

  // Mouse-move on the canvas wrapper to position HTML tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setTooltip((prev) => ({
      ...prev,
      position: { x: e.clientX, y: e.clientY },
    }));
  }, []);

  // Sync tooltip node with hovered node
  useEffect(() => {
    if (!hoveredNode) {
      setTooltip((prev) => ({ ...prev, node: null }));
      return;
    }
    const found = graphData.nodes.find((n) => n.id === hoveredNode) ?? null;
    setTooltip((prev) => ({ ...prev, node: found }));
  }, [hoveredNode, graphData.nodes]);

  // Change cursor on hover
  useEffect(() => {
    if (!wrapRef.current) return;
    wrapRef.current.style.cursor = hoveredNode ? "pointer" : "grab";
  }, [hoveredNode]);

  // ── Zoom controls ──────────────────────────────────────────────────────────
  const zoomIn  = useCallback(() => {
    if (!fgRef.current) return;
    const current = (fgRef.current.zoom as () => number)();
    fgRef.current.zoom(current * 1.4, 300);
  }, []);

  const zoomOut = useCallback(() => {
    if (!fgRef.current) return;
    const current = (fgRef.current.zoom as () => number)();
    fgRef.current.zoom(current / 1.4, 300);
  }, []);

  const zoomFit = useCallback(() => {
    fgRef.current?.zoomToFit(400, 40);
  }, []);

  // Auto-fit on first render after engine settles
  const handleEngineStop = useCallback(() => {
    fgRef.current?.zoomToFit(600, 50);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative w-full rounded-xl overflow-hidden", className)}
      style={{
        height: height ?? dims.h,
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
      }}
      ref={wrapRef}
      onMouseMove={handleMouseMove}
    >
      {/* ── Force graph canvas ─────────────────────────────────────────────── */}
      <ForceGraph2D
        ref={fgRef}
        graphData={fgData}
        width={dims.w}
        height={height ?? dims.h}
        backgroundColor={COLORS.bg}
        // Node rendering
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={nodePointerAreaPaint}
        nodeLabel={() => ""} /* disable built-in tooltip — we use our own */
        nodeVal={(node: any) => (node as GraphNode).size ?? 5}
        // Link rendering
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkCurvature={0.15}
        // Interaction
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        // Simulation
        cooldownTicks={120}
        onEngineStop={handleEngineStop}
        // Performance
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
        minZoom={0.05}
        maxZoom={8}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.35}
      />

      {/* ── HTML tooltip (positioned fixed so it escapes canvas) ───────────── */}
      <NodeTooltip node={tooltip.node} position={tooltip.position} />

      {/* ── Controls overlay ──────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="pointer-events-auto flex-1 max-w-[240px]"
        >
          <div
            className="flex items-center gap-2 px-3 h-8 rounded-lg"
            style={{
              background: COLORS.elevated,
              border: `1px solid ${COLORS.borderStrong}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <Search className="w-3 h-3 shrink-0" style={{ color: COLORS.textTertiary }} />
            <input
              type="text"
              placeholder="Filter nodes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[12px] placeholder:text-[12px] min-w-0"
              style={{
                color: COLORS.textPrimary,
              }}
              aria-label="Filter graph nodes"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="shrink-0 rounded focus-ring"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" style={{ color: COLORS.textTertiary }} />
              </button>
            )}
          </div>
          {/* Match count hint */}
          <AnimatePresence>
            {search && (
              <motion.div
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                className="mt-1 px-2 text-[10px]"
                style={{ color: COLORS.textTertiary }}
              >
                {searchMatch.size} match{searchMatch.size !== 1 ? "es" : ""}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right-side controls */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25 }}
          className="pointer-events-auto flex items-center gap-1.5"
        >
          {/* Stats badge */}
          <StatsBadge
            totalNodes={graphData.stats.totalNodes}
            totalEdges={graphData.stats.totalEdges}
            linkedCount={graphData.stats.linkedCount}
            orphanCount={graphData.stats.orphanCount}
            visible={visibleCount}
          />

          {/* Orphan toggle */}
          <button
            onClick={() => setShowOrphans((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors focus-ring"
            style={{
              background: showOrphans ? COLORS.accentSoft : COLORS.elevated,
              border: `1px solid ${showOrphans ? "rgba(124,109,250,0.3)" : COLORS.border}`,
              color: showOrphans ? COLORS.accent : COLORS.textSecondary,
            }}
            title={showOrphans ? "Hide orphan nodes" : "Show orphan nodes"}
            aria-label={showOrphans ? "Hide orphan nodes" : "Show orphan nodes"}
            aria-pressed={showOrphans}
          >
            {showOrphans ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span className="hidden sm:inline">Orphans</span>
          </button>
        </motion.div>
      </div>

      {/* ── Zoom controls (bottom-right) ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.25 }}
        className="absolute bottom-3 right-3 flex flex-col gap-1 pointer-events-auto"
      >
        {(
          [
            { icon: ZoomIn,    label: "Zoom in",       action: zoomIn  },
            { icon: ZoomOut,   label: "Zoom out",      action: zoomOut },
            { icon: Maximize2, label: "Fit to screen", action: zoomFit },
          ] as const
        ).map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors focus-ring"
            style={{
              background: COLORS.elevated,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = COLORS.elevated;
              (e.currentTarget as HTMLButtonElement).style.borderColor = COLORS.borderStrong;
              (e.currentTarget as HTMLButtonElement).style.color = COLORS.textPrimary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = COLORS.elevated;
              (e.currentTarget as HTMLButtonElement).style.borderColor = COLORS.border;
              (e.currentTarget as HTMLButtonElement).style.color = COLORS.textSecondary;
            }}
            aria-label={label}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </motion.div>

      {/* ── Legend (bottom-left) ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.25 }}
        className="absolute bottom-3 left-3 flex items-center gap-3 px-2.5 py-1.5 rounded-lg"
        style={{
          background: "rgba(16,16,21,0.7)",
          border: `1px solid ${COLORS.border}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <LegendDot color={COLORS.accent}                   label="Linked" />
        <LegendDot color="rgba(255,255,255,0.18)"          label="Orphan" dashed />
        <div
          className="hidden sm:flex items-center gap-1.5"
          style={{ color: COLORS.textTertiary }}
        >
          <GitBranch className="w-2.5 h-2.5" />
          <span className="text-[10px]">Click to open note</span>
        </div>
      </motion.div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visibleCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
          >
            <GitBranch className="w-10 h-10" style={{ color: COLORS.textTertiary }} />
            <p className="text-[13px]" style={{ color: COLORS.textTertiary }}>
              {search ? "No notes match your filter" : "No notes to display"}
            </p>
            {search && (
              <button
                className="pointer-events-auto text-[12px] underline underline-offset-2 focus-ring"
                style={{ color: COLORS.accent }}
                onClick={() => setSearch("")}
              >
                Clear filter
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          background: color,
          border: dashed ? `1px dashed rgba(255,255,255,0.25)` : "none",
        }}
      />
      <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
        {label}
      </span>
    </div>
  );
}
