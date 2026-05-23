"use client";
import { useExamsStore } from "@/store/exams.store";
import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SUBJECTS } from "@/lib/dummy-data";
import { EventType, Subject } from "@/lib/types";
import toast from "react-hot-toast";

const TYPE_COLORS: Record<EventType, string> = {
  exam: "bg-red-500/80",
  assignment: "bg-amber-500/80",
  study: "bg-blue-500/80",
};

export default function CalendarPage() {
  const { events, createEvent, removeEvent } = useExamsStore();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "study" as EventType, subject: "Math" as Subject });

  const start = startOfWeek(startOfMonth(cursor));
  const end = endOfWeek(endOfMonth(cursor));
  const days = eachDayOfInterval({ start, end });

  const eventsByDay = (d: Date) => events.filter((e) => isSameDay(new Date(e.date), d));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-text-secondary text-sm">{format(cursor, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(subMonths(cursor, 1))} className="p-2 rounded-lg hover:bg-bg-elevated"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCursor(new Date())} className="text-sm px-3 py-1.5 rounded-lg hover:bg-bg-elevated">Today</button>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-2 rounded-lg hover:bg-bg-elevated"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => setCreateOpen(true)} className="btn-primary ml-2"><Plus className="w-4 h-4" /> Event</button>
        </div>
      </div>

      <div className="card p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-[11px] uppercase tracking-wider text-text-tertiary text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const events = eventsByDay(d);
            const inMonth = isSameMonth(d, cursor);
            const today = isSameDay(d, new Date());
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={cn(
                  "min-h-[88px] p-1.5 rounded-lg border text-left transition-colors flex flex-col gap-1",
                  inMonth ? "border-app bg-bg-elevated/30 hover:bg-bg-elevated" : "border-transparent text-text-tertiary opacity-40",
                  today && "border-accent ring-1 ring-accent/30",
                  selected && isSameDay(selected, d) && "bg-accent/10 border-accent/50"
                )}
              >
                <div className={cn("text-xs font-medium", today && "text-accent")}>{format(d, "d")}</div>
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {events.slice(0, 3).map((e) => (
                    <div key={e.id} className={`text-[9px] truncate px-1 py-0.5 rounded ${TYPE_COLORS[e.type]} text-white`}>
                      {e.title}
                    </div>
                  ))}
                  {events.length > 3 && <div className="text-[9px] text-text-tertiary">+{events.length - 3} more</div>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 px-2 text-[11px] text-text-tertiary">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-500/80" /> Exam</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-amber-500/80" /> Assignment</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-500/80" /> Study</div>
        </div>
      </div>

      {selected && (
        <div className="card mt-4">
          <h3 className="font-semibold mb-3">Events on {format(selected, "MMM d, yyyy")}</h3>
          {eventsByDay(selected).length === 0 ? (
            <p className="text-sm text-text-tertiary">No events.</p>
          ) : (
            <div className="space-y-2">
              {eventsByDay(selected).map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-elevated">
                  <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[e.type]}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="text-[11px] text-text-tertiary">{e.subject} · {e.type}</div>
                  </div>
                  <button onClick={() => removeEvent(e.id)} className="p-1 rounded hover:bg-bg-base text-text-tertiary hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="w-full max-w-md glass-strong rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">New Event</h2>
              <div className="space-y-3">
                <input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-base" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}>
                    <option value="study">Study</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                  </select>
                  <select className="input-base" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })}>
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setCreateOpen(false)} className="btn-ghost">Cancel</button>
                <button
                  onClick={() => {
                    if (!form.title) return toast.error("Title required");
                    createEvent({ ...form, date: (selected || new Date()).toISOString() });
                    setCreateOpen(false);
                    setForm({ ...form, title: "" });
                    toast.success("Event created");
                  }}
                  className="btn-primary"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
