"use client";
import { useState, useEffect } from "react";
import { useTimerStore } from "@/store/timer.store";
import { useAssignmentsStore } from "@/store/assignments.store";
import { useStreakStore } from "@/store/streak.store";
import { Play, Pause, RotateCcw, Coffee, Timer as TimerIcon, Zap } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Phase = "focus" | "short-break" | "long-break";

export default function TimerPage() {
  const { focusDuration, shortBreak, longBreak, sessions, currentTask, setCurrentTask, completeSession, totalToday } = useTimerStore();
  const { assignments } = useAssignmentsStore();
  const { logToday } = useStreakStore();
  const [phase, setPhase] = useState<Phase>("focus");
  const [seconds, setSeconds] = useState(focusDuration * 60);
  const [running, setRunning] = useState(false);

  const duration = phase === "focus" ? focusDuration : phase === "short-break" ? shortBreak : longBreak;

  useEffect(() => {
    setSeconds(duration * 60);
  }, [duration, phase]);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      completeSession({ duration, type: phase, task: currentTask || undefined });
      if (phase === "focus") logToday(duration);
      toast.success(`${phase === "focus" ? "Focus" : "Break"} complete!`);
      setPhase((p) => (p === "focus" ? "short-break" : "focus"));
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, seconds]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  const total = duration * 60;
  const progress = 1 - seconds / total;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-1">Pomodoro Timer</h1>
        <p className="text-text-secondary text-sm">Focus deeply. Rest fully. Repeat.</p>
      </div>

      <div className="flex justify-center gap-1 mb-6">
        {[
          { v: "focus", label: "Focus", icon: Zap },
          { v: "short-break", label: "Short", icon: Coffee },
          { v: "long-break", label: "Long", icon: Coffee },
        ].map((p) => (
          <button
            key={p.v}
            onClick={() => { setPhase(p.v as Phase); setRunning(false); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors",
              phase === p.v ? "bg-accent/20 border border-accent/40 text-white" : "text-text-secondary hover:bg-bg-elevated"
            )}
          >
            <p.icon className="w-3.5 h-3.5" /> {p.label}
          </button>
        ))}
      </div>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card mb-6">
        <div className="flex flex-col items-center py-6">
          <div className="relative w-64 h-64 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#tgrad)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                transition={{ duration: 0.4 }}
              />
              <defs>
                <linearGradient id="tgrad">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold font-mono tabular-nums">{mm}:{ss}</div>
                <div className="text-xs uppercase tracking-wider text-text-tertiary mt-2">{phase.replace("-", " ")}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setRunning(!running)} className="btn-primary px-6 py-3">
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {running ? "Pause" : "Start"}
            </button>
            <button onClick={() => { setSeconds(duration * 60); setRunning(false); }} className="btn-ghost px-4 py-3"><RotateCcw className="w-4 h-4" /></button>
          </div>

          <div className="mt-6 w-full max-w-md">
            <label className="text-xs text-text-tertiary mb-1 block uppercase tracking-wider">Working on</label>
            <select
              value={currentTask || ""}
              onChange={(e) => setCurrentTask(e.target.value || null)}
              className="input-base"
            >
              <option value="">No specific task</option>
              {assignments.filter((a) => a.status !== "done").map((a) => (
                <option key={a.id} value={a.title}>{a.title} ({a.subject})</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <TimerIcon className="w-6 h-6 text-accent mx-auto mb-2" />
          <div className="text-2xl font-bold">{totalToday}</div>
          <div className="text-xs text-text-tertiary">Minutes today</div>
        </div>
        <div className="card text-center">
          <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{sessions.filter((s) => s.type === "focus").length}</div>
          <div className="text-xs text-text-tertiary">Focus sessions</div>
        </div>
        <div className="card text-center">
          <Coffee className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{sessions.filter((s) => s.type !== "focus").length}</div>
          <div className="text-xs text-text-tertiary">Breaks taken</div>
        </div>
      </div>
    </div>
  );
}
