"use client";
import { useAssignmentsStore } from "@/store/assignments.store";
import { useState } from "react";
import { Assignment, AssignmentStatus, Subject, Priority } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Calendar as CalIcon, Flag } from "lucide-react";
import { formatRelative, daysUntil, cn } from "@/lib/utils";
import { SUBJECTS } from "@/lib/dummy-data";
import toast from "react-hot-toast";
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

const COLUMNS: { id: AssignmentStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-slate-500" },
  { id: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { id: "review", label: "Review", color: "bg-amber-500" },
  { id: "done", label: "Done", color: "bg-emerald-500" },
];

export default function AssignmentsPage() {
  const { assignments, moveStatus, create, remove } = useAssignmentsStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "Math" as Subject,
    priority: "medium" as Priority,
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  });

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const status = e.over.id as AssignmentStatus;
    moveStatus(e.active.id as string, status);
    toast.success(`Moved to ${status.replace("-", " ")}`);
  };

  const active = assignments.find((a) => a.id === activeId);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-text-secondary text-sm">Drag cards between columns to update status</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const items = assignments.filter((a) => a.status === col.id);
            return <Column key={col.id} col={col} items={items} onRemove={remove} />;
          })}
        </div>
        <DragOverlay>{active && <AssignmentCard a={active} dragging />}</DragOverlay>
      </DndContext>

      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="w-full max-w-md glass-strong rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">New Assignment</h2>
              <div className="space-y-3">
                <input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
                <textarea className="input-base min-h-20 resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-base" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })}>
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <select className="input-base" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <input type="date" className="input-base" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setCreateOpen(false)} className="btn-ghost">Cancel</button>
                <button
                  onClick={() => {
                    if (!form.title) return toast.error("Title required");
                    create({ ...form, status: "todo", dueDate: new Date(form.dueDate).toISOString() });
                    setCreateOpen(false);
                    setForm({ ...form, title: "", description: "" });
                    toast.success("Created");
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

function Column({ col, items, onRemove }: { col: { id: AssignmentStatus; label: string; color: string }; items: Assignment[]; onRemove: (id: string) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: col.id });
  return (
    <div ref={setNodeRef} className={cn("card p-3 transition-colors", isOver && "ring-2 ring-accent")}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${col.color}`} />
          <h3 className="font-semibold text-sm">{col.label}</h3>
          <span className="text-xs text-text-tertiary">{items.length}</span>
        </div>
      </div>
      <div className="space-y-2 min-h-[200px]">
        {items.map((a) => (
          <DraggableCard key={a.id} a={a} onRemove={onRemove} />
        ))}
        {items.length === 0 && (
          <div className="text-xs text-text-tertiary text-center py-8">Drop here</div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ a, onRemove }: { a: Assignment; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: a.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      <AssignmentCard a={a} onRemove={onRemove} />
    </div>
  );
}

function AssignmentCard({ a, dragging, onRemove }: { a: Assignment; dragging?: boolean; onRemove?: (id: string) => void }) {
  const dd = daysUntil(a.dueDate);
  const priColor = a.priority === "high" ? "text-red-400 bg-red-500/10 border-red-500/30" : a.priority === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  return (
    <div className={cn("bg-bg-elevated rounded-xl p-3 border border-app group cursor-grab active:cursor-grabbing hover:border-strong transition-colors", dragging && "shadow-xl rotate-2")}>
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary">{a.subject}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(a.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-tertiary hover:text-red-400 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <h4 className="font-medium text-sm leading-tight mb-1.5">{a.title}</h4>
      <p className="text-xs text-text-tertiary line-clamp-2 mb-3 leading-relaxed">{a.description}</p>
      <div className="flex items-center justify-between text-[11px]">
        <span className={cn("px-1.5 py-0.5 rounded border", priColor)}>
          <Flag className="w-2.5 h-2.5 inline mr-0.5" />
          {a.priority}
        </span>
        <span className={cn("flex items-center gap-1", dd <= 1 ? "text-red-400" : dd <= 3 ? "text-amber-400" : "text-text-tertiary")}>
          <CalIcon className="w-2.5 h-2.5" />
          {formatRelative(a.dueDate)}
        </span>
      </div>
      {a.progress > 0 && (
        <div className="mt-2 h-1 bg-bg-base rounded-full overflow-hidden">
          <div className="h-full gradient-accent" style={{ width: `${a.progress}%` }} />
        </div>
      )}
    </div>
  );
}
