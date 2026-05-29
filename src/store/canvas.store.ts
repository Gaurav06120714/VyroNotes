"use client";

/**
 * canvas.store.ts
 *
 * Zustand v5 store for the Canvas / Mind-Map feature.
 * Persisted to localStorage under the key "vyronotes-canvas".
 *
 * Node types
 * ──────────
 *  • "note"    — links to a VyroNotes note (shows title + snippet)
 *  • "concept" — titled bubble, coloured by the user
 *  • "text"    — free-form label, no border
 *
 * Edges
 * ─────
 *  SVG lines rendered between node centre-points.
 *  Each edge is directional (source → target) but rendered as a simple curve.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid }    from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NodeType = "note" | "concept" | "text";

export interface CanvasNode {
  id:      string;
  type:    NodeType;
  x:       number;
  y:       number;
  width:   number;
  // height is auto but we store a min
  label:   string;
  /** For "note" nodes — the linked note's id. */
  noteId?: string;
  /** Accent/background colour chosen by the user (concept nodes). */
  color?:  string;
  /** Free body text for concept/text nodes. */
  body?:   string;
}

export interface CanvasEdge {
  id:     string;
  source: string; // node id
  target: string; // node id
}

export interface Viewport {
  x:    number; // pan offset (pixels)
  y:    number;
  zoom: number; // scale factor
}

interface CanvasState {
  nodes:    CanvasNode[];
  edges:    CanvasEdge[];
  viewport: Viewport;

  // Node CRUD
  addNode:    (node: Omit<CanvasNode, "id">) => string;
  updateNode: (id: string, patch: Partial<Omit<CanvasNode, "id">>) => void;
  removeNode: (id: string) => void;
  clearAll:   () => void;

  // Edge CRUD
  addEdge:    (source: string, target: string) => void;
  removeEdge: (id: string) => void;

  // Viewport
  setViewport: (vp: Partial<Viewport>) => void;
  resetViewport: () => void;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      nodes:    [],
      edges:    [],
      viewport: DEFAULT_VIEWPORT,

      addNode: (node) => {
        const id = uid();
        set((s) => ({ nodes: [...s.nodes, { ...node, id }] }));
        return id;
      },

      updateNode: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),

      removeNode: (id) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== id),
          // Also remove any edges connected to this node
          edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        })),

      clearAll: () => set({ nodes: [], edges: [] }),

      addEdge: (source, target) => {
        // Prevent duplicate edges and self-loops
        const { edges } = get();
        if (source === target) return;
        if (edges.some((e) => e.source === source && e.target === target)) return;
        set((s) => ({
          edges: [...s.edges, { id: uid(), source, target }],
        }));
      },

      removeEdge: (id) =>
        set((s) => ({ edges: s.edges.filter((e) => e.id !== id) })),

      setViewport: (vp) =>
        set((s) => ({ viewport: { ...s.viewport, ...vp } })),

      resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),
    }),
    { name: "vyronotes-canvas" }
  )
);
