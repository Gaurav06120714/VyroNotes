"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Exam } from "@/lib/types";
import { DUMMY_EXAMS, DUMMY_EVENTS } from "@/lib/dummy-data";
import { CalendarEvent } from "@/lib/types";
import { uid } from "@/lib/utils";

interface ExamsState {
  exams: Exam[];
  events: CalendarEvent[];
  createExam: (e: Omit<Exam, "id" | "prepProgress">) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  removeExam: (id: string) => void;
  createEvent: (e: Omit<CalendarEvent, "id">) => void;
  removeEvent: (id: string) => void;
}

export const useExamsStore = create<ExamsState>()(
  persist(
    (set) => ({
      exams: DUMMY_EXAMS,
      events: DUMMY_EVENTS,
      createExam: (e) =>
        set((s) => ({
          exams: [...s.exams, { ...e, id: uid(), prepProgress: 0 }],
        })),
      updateExam: (id, patch) =>
        set((s) => ({
          exams: s.exams.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeExam: (id) =>
        set((s) => ({ exams: s.exams.filter((x) => x.id !== id) })),
      createEvent: (e) =>
        set((s) => ({ events: [...s.events, { ...e, id: uid() }] })),
      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((x) => x.id !== id) })),
    }),
    { name: "vyronotes-exams" }
  )
);
