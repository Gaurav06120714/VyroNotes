"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Assignment, AssignmentStatus } from "@/lib/types";
import { DUMMY_ASSIGNMENTS } from "@/lib/dummy-data";
import { uid } from "@/lib/utils";

interface AssignmentsState {
  assignments: Assignment[];
  create: (a: Omit<Assignment, "id" | "createdAt" | "progress">) => void;
  update: (id: string, patch: Partial<Assignment>) => void;
  moveStatus: (id: string, status: AssignmentStatus) => void;
  remove: (id: string) => void;
}

export const useAssignmentsStore = create<AssignmentsState>()(
  persist(
    (set) => ({
      assignments: DUMMY_ASSIGNMENTS,
      create: (a) =>
        set((s) => ({
          assignments: [
            ...s.assignments,
            {
              ...a,
              id: uid(),
              createdAt: new Date().toISOString(),
              progress: 0,
            },
          ],
        })),
      update: (id, patch) =>
        set((s) => ({
          assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      moveStatus: (id, status) =>
        set((s) => ({
          assignments: s.assignments.map((x) =>
            x.id === id
              ? { ...x, status, progress: status === "done" ? 100 : x.progress }
              : x
          ),
        })),
      remove: (id) =>
        set((s) => ({ assignments: s.assignments.filter((x) => x.id !== id) })),
    }),
    { name: "vyronotes-assignments" }
  )
);
