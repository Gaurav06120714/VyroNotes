import type { Note, Subject } from "@/lib/types";
import { subjectColor } from "@/lib/utils";

const NODE_SIZE_MIN = 4;
const NODE_SIZE_MAX = 20;

const WIKILINK_RE = /\[\[(.+?)\]\]/g;

export type NodeType = "linked" | "orphan";

export interface GraphNode {
  
  id: string;

  label: string;

  subject: Subject;

  color: string;

  size: number;

  connections: number;

  type: NodeType;

  pinned: boolean;

  updatedAt: string;
}

export interface GraphEdge {
  
  id: string;

  source: string;

  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];

  stats: {
    
    totalNodes: number;

    totalEdges: number;

    orphanCount: number;

    linkedCount: number;

    maxConnections: number;
  };
}

function extractWikilinks(content: string): string[] {
  const targets: string[] = [];
  
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

function interpolateSize(connections: number, maxConn: number): number {
  if (maxConn === 0 || connections === 0) return NODE_SIZE_MIN;
  const t = connections / maxConn; 
  return Math.round(NODE_SIZE_MIN + t * (NODE_SIZE_MAX - NODE_SIZE_MIN));
}

export function buildGraphData(notes: Note[]): GraphData {
  
  const visible = notes.filter((n) => !n.trashed && !n.archived);

  const titleToId = new Map<string, string>();
  for (const note of visible) {
    titleToId.set(note.title.toLowerCase().trim(), note.id);
  }

  const idToNote = new Map<string, Note>();
  for (const note of visible) {
    idToNote.set(note.id, note);
  }

  const edgeSet = new Set<string>();
  const rawEdges: GraphEdge[] = [];

  for (const note of visible) {
    const linkedTitles = extractWikilinks(note.content);

    for (const linkedTitle of linkedTitles) {
      const targetId = titleToId.get(linkedTitle);

      if (!targetId || targetId === note.id) continue;

      const edgeKey = `${note.id}→${targetId}`;
      if (edgeSet.has(edgeKey)) continue; 

      edgeSet.add(edgeKey);
      rawEdges.push({
        id: edgeKey,
        source: note.id,
        target: targetId,
      });
    }
  }

  const connectionCount = new Map<string, number>();

  for (const note of visible) {
    connectionCount.set(note.id, 0);
  }

  for (const edge of rawEdges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1);
  }

  let maxConnections = 0;
  for (const count of connectionCount.values()) {
    if (count > maxConnections) maxConnections = count;
  }

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
