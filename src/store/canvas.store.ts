"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid }    from "@/lib/utils";

export type NodeType = "note" | "concept" | "text";

export interface CanvasNode {
  id:      string;
  type:    NodeType;
  x:       number;
  y:       number;
  width:   number;
  
  label:   string;
  
  noteId?: string;
  
  color?:  string;
  
  body?:   string;
}

export interface CanvasEdge {
  id:     string;
  source: string; 
  target: string; 
}

export interface Viewport {
  x:    number; 
  y:    number;
  zoom: number; 
}

interface CanvasState {
  nodes:    CanvasNode[];
  edges:    CanvasEdge[];
  viewport: Viewport;

  addNode:    (node: Omit<CanvasNode, "id">) => string;
  updateNode: (id: string, patch: Partial<Omit<CanvasNode, "id">>) => void;
  removeNode: (id: string) => void;
  clearAll:   () => void;

  addEdge:    (source: string, target: string) => void;
  removeEdge: (id: string) => void;

  setViewport: (vp: Partial<Viewport>) => void;
  resetViewport: () => void;
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

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
          
          edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        })),

      clearAll: () => set({ nodes: [], edges: [] }),

      addEdge: (source, target) => {
        
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
