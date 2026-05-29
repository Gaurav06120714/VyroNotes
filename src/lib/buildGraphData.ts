/**
 * buildGraphData.ts
 *
 * Builds an Obsidian-style graph data structure from a flat array of Notes.
 *
 * Algorithm:
 *  1. Build a title → Note lookup map (case-insensitive).
 *  2. For every non-trashed, non-archived note, scan content for [[wikilinks]].
 *  3. Resolve each wikilink to an existing note id. Ignore broken links.
 *  4. Collect directed edges (source → target). Deduplicate using a Set key.
 *  5. Count in-degree + out-degree per node to get total connections.
 *  6. Interpolate node size linearly between NODE_SIZE_MIN and NODE_SIZE_MAX
 *     based on connection count relative to the most-connected node.
 *  7. Classify every node: "linked" (≥1 connection) | "orphan" (0 connections).
 */

import type { Note, Subject } from "@/lib/types";
import { subjectColor } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const NODE_SIZE_MIN = 4;
const NODE_SIZE_MAX = 20;

/** Regex that matches [[any text here]] — global + non-greedy. */
const WIKILINK_RE = /\[\[(.+?)\]\]/g;

// ── Public types ──────────────────────────────────────────────────────────────

/** Classification of a graph node based on its connectivity. */
export type NodeType = "linked" | "orphan";

/**
 * A single node in the graph, representing one note.
 */
export interface GraphNode {
  /** Stable unique identifier — same as Note.id. */
  id: string;

  /** Display label — same as Note.title. */
  label: string;

  /** Subject of the note, used for colour coding. */
  subject: Subject;

  /**
   * CSS-compatible colour string derived from the note's subject.
   * e.g. "#a78bfa" for Math, "#60a5fa" for Physics.
   */
  color: string;

  /**
   * Rendered radius of the node (pixels) in the range [NODE_SIZE_MIN, NODE_SIZE_MAX].
   * Proportional to total connections (in-degree + out-degree).
   */
  size: number;

  /** Total number of edges touching this node (in + out, deduplicated). */
  connections: number;

  /** "linked" if the node has ≥1 edge; "orphan" if it has none. */
  type: NodeType;

  /** Whether the note is pinned — useful for UI rendering decisions. */
  pinned: boolean;

  /** ISO string — passed through for tooltip / hover display. */
  updatedAt: string;
}

/**
 * A directed edge representing a [[wikilink]] from one note to another.
 */
export interface GraphEdge {
  /**
   * Stable unique key for React reconciliation / deduplication.
   * Format: "{sourceId}→{targetId}"
   */
  id: string;

  /** Note.id of the note that contains the wikilink. */
  source: string;

  /** Note.id of the note being linked to. */
  target: string;
}

/**
 * The complete graph data structure returned by buildGraphData.
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];

  /** Quick-access stats — useful for rendering a summary legend. */
  stats: {
    /** Total number of nodes (= number of visible notes). */
    totalNodes: number;

    /** Total number of deduplicated directed edges. */
    totalEdges: number;

    /** Number of nodes with zero connections. */
    orphanCount: number;

    /** Number of nodes with at least one connection. */
    linkedCount: number;

    /** Maximum connection count across all nodes (used for size scaling). */
    maxConnections: number;
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Extract all [[wikilink]] targets from a note's content string.
 * Returns raw text inside the brackets, trimmed, lowercased for matching.
 *
 * A fresh regex exec loop is used (instead of matchAll) so the function
 * is safe in environments without ES2020 iterators.
 */
function extractWikilinks(content: string): string[] {
  const targets: string[] = [];
  // Reset lastIndex — WIKILINK_RE is module-level with /g flag.
  WIKILINK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_RE.exec(content)) !== null) {
    const raw = match[1].trim();
    if (raw.length > 0) {
      targets.push(raw.toLowerCase());
    }
  }
  return targets;
}

/**
 * Linear interpolation of node size.
 *
 * @param connections  - This node's connection count.
 * @param maxConn      - The highest connection count across all nodes.
 * @returns            - An integer in [NODE_SIZE_MIN, NODE_SIZE_MAX].
 */
function interpolateSize(connections: number, maxConn: number): number {
  if (maxConn === 0 || connections === 0) return NODE_SIZE_MIN;
  const t = connections / maxConn; // 0..1
  return Math.round(NODE_SIZE_MIN + t * (NODE_SIZE_MAX - NODE_SIZE_MIN));
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build an Obsidian-style graph data structure from a flat Note array.
 *
 * Only notes that are NOT trashed and NOT archived are included as nodes.
 * Broken wikilinks (pointing to titles that don't exist in the note set)
 * are silently ignored — no phantom nodes are created.
 *
 * @param notes  - Full array of Note objects (from useNotesStore).
 * @returns      - { nodes, edges, stats } ready for a graph renderer.
 *
 * @example
 * ```ts
 * const notes = useNotesStore(s => s.notes);
 * const graph = buildGraphData(notes);
 * // graph.nodes → GraphNode[]
 * // graph.edges → GraphEdge[]
 * ```
 */
export function buildGraphData(notes: Note[]): GraphData {
  // ── Step 1: Filter to visible notes only ───────────────────────────────────
  const visible = notes.filter((n) => !n.trashed && !n.archived);

  // ── Step 2: Build case-insensitive title → id lookup ──────────────────────
  // If two notes share the same title (case-insensitively), the last one wins.
  // This mirrors Obsidian's behaviour for ambiguous links.
  const titleToId = new Map<string, string>();
  for (const note of visible) {
    titleToId.set(note.title.toLowerCase().trim(), note.id);
  }

  // Also build id → note for quick access later.
  const idToNote = new Map<string, Note>();
  for (const note of visible) {
    idToNote.set(note.id, note);
  }

  // ── Step 3: Parse wikilinks and build raw directed edges ──────────────────
  // edgeSet prevents duplicate edges with the same source → target pair.
  // Key format: "{sourceId}→{targetId}"
  const edgeSet = new Set<string>();
  const rawEdges: GraphEdge[] = [];

  for (const note of visible) {
    const linkedTitles = extractWikilinks(note.content);

    for (const linkedTitle of linkedTitles) {
      const targetId = titleToId.get(linkedTitle);

      // Ignore broken links and self-links.
      if (!targetId || targetId === note.id) continue;

      const edgeKey = `${note.id}→${targetId}`;
      if (edgeSet.has(edgeKey)) continue; // deduplicate

      edgeSet.add(edgeKey);
      rawEdges.push({
        id: edgeKey,
        source: note.id,
        target: targetId,
      });
    }
  }

  // ── Step 4: Count connections per node (in-degree + out-degree) ───────────
  // Use a Map rather than mutating nodes — cleaner separation of concerns.
  const connectionCount = new Map<string, number>();

  // Initialise every visible note at 0.
  for (const note of visible) {
    connectionCount.set(note.id, 0);
  }

  for (const edge of rawEdges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1);
  }

  // ── Step 5: Determine max connections for size scaling ────────────────────
  let maxConnections = 0;
  for (const count of connectionCount.values()) {
    if (count > maxConnections) maxConnections = count;
  }

  // ── Step 6: Build final nodes ─────────────────────────────────────────────
  const nodes: GraphNode[] = visible.map((note) => {
    const connections = connectionCount.get(note.id) ?? 0;
    return {
      id: note.id,
      label: note.title,
      subject: note.subject,
      color: subjectColor(note.subject),
      size: interpolateSize(connections, maxConnections),
      connections,
      type: connections > 0 ? "linked" : "orphan",
      pinned: note.pinned,
      updatedAt: note.updatedAt,
    };
  });

  // ── Step 7: Assemble stats ────────────────────────────────────────────────
  const orphanCount = nodes.filter((n) => n.type === "orphan").length;

  return {
    nodes,
    edges: rawEdges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: rawEdges.length,
      orphanCount,
      linkedCount: nodes.length - orphanCount,
      maxConnections,
    },
  };
}
