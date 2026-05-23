"use client";
import { useAuthStore } from "@/store/auth.store";
import { useNotesStore } from "@/store/notes.store";
import { useAssignmentsStore } from "@/store/assignments.store";
import { useExamsStore } from "@/store/exams.store";
import { useFlashcardsStore } from "@/store/flashcards.store";
import { useStreakStore } from "@/store/streak.store";
import {
  StickyNote,
  Flame,
  GraduationCap,
  Layers,
  ListChecks,
  Sparkles,
  ArrowRight,
  Sun,
  CheckCircle2,
  Circle,
  Play,
  Clock,
  Timer as TimerIcon,
  AlertCircle,
  X,
  Target,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { daysUntil, formatRelative, formatDate } from "@/lib/utils";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { generateRecommendations } from "@/lib/recommendations";
import { useMemo, useState } from "react";
import { stagger, staggerItem } from "@/lib/animations";

// Mock daily goals — three concrete items
interface Goal {
  id: string;
  title: string;
  time: number; // minutes
  href: string;
  done: boolean;
}

const INITIAL_GOALS: Goal[] = [
  { id: "g1", title: "Review Trigonometry identities", time: 25, href: "/notes", done: false },
  { id: "g2", title: "Finish Physics problem set", time: 45, href: "/assignments", done: false },
  { id: "g3", title: "Quick Calculus flashcard pass", time: 10, href: "/flashcards", done: false },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const allNotes = useNotesStore((s) => s.notes);
  const notes = useMemo(
    () => allNotes.filter((n) => !n.trashed && !n.archived),
    [allNotes]
  );
  const assignments = useAssignmentsStore((s) => s.assignments);
  const exams = useExamsStore((s) => s.exams);
  const decks = useFlashcardsStore((s) => s.decks);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const streakDays = useStreakStore((s) => s.days);

  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const toggleGoal = (id: string) =>
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));

  const dueAssignments = useMemo(
    () =>
      assignments
        .filter((a) => a.status !== "done")
        .filter((a) => daysUntil(a.dueDate) <= 7)
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
        .slice(0, 6),
    [assignments]
  );

  const upcomingExams = useMemo(
    () =>
      [...exams]
        .filter((e) => daysUntil(e.date) >= 0)
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [exams]
  );
  const closestExamWithin14 = upcomingExams.find((e) => daysUntil(e.date) <= 14);

  const totalCards = decks.reduce((s, d) => s + d.cards.length, 0);
  const masteredCards = decks.reduce(
    (s, d) => s + d.cards.filter((c) => c.mastery >= 80).length,
    0
  );

  // Today summary
  const todayMin = (streakDays[streakDays.length - 1]?.minutes ?? 0);
  const todayHr = Math.floor(todayMin / 60);
  const todayRemMin = todayMin % 60;

  // Sparkline data from last 14 days
  const last14 = streakDays.slice(-14).map((d) => d.minutes);
  // Generate variant arrays for the other stats
  const tasksSpark = useMemo(() => Array.from({ length: 14 }, (_, i) => 4 + Math.round(Math.sin(i / 2) * 2 + Math.random())), []);
  const cardsSpark = useMemo(() => Array.from({ length: 14 }, (_, i) => 20 + Math.round(Math.cos(i / 1.5) * 8 + Math.random() * 6)), []);
  const streakSpark = useMemo(() => Array.from({ length: 14 }, (_, i) => Math.min(currentStreak, i + (currentStreak - 13))), [currentStreak]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = formatDate(new Date(), "EEEE, MMM d");

  const stats = [
    {
      label: "Focus today",
      value: todayMin > 0 ? `${todayHr}h ${todayRemMin}m` : "0m",
      icon: TimerIcon,
      data: last14,
      delta: "+12%",
    },
    {
      label: "Tasks done",
      value: `${assignments.filter((a) => a.status === "done").length}/${assignments.length}`,
      icon: ListChecks,
      data: tasksSpark,
      delta: "+3 this week",
    },
    {
      label: "Flashcards",
      value: `${masteredCards}/${totalCards}`,
      icon: Layers,
      data: cardsSpark,
      delta: "+47 reviewed",
    },
    {
      label: "Streak",
      value: `${currentStreak}d`,
      icon: Flame,
      data: streakSpark,
      delta: currentStreak >= 7 ? "On fire" : "Keep going",
    },
  ];

  const recommendations = useMemo(
    () => generateRecommendations({ notes, assignments, exams, decks, streak: currentStreak }),
    [notes, assignments, exams, decks, currentStreak]
  ).filter((r) => !dismissed.includes(r.id));

  const completedGoals = goals.filter((g) => g.done).length;
  const goalsPct = Math.round((completedGoals / goals.length) * 100);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-5 max-w-7xl mx-auto"
    >
      {/* Greeting */}
      <motion.div variants={staggerItem} className="card-v2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-text-tertiary mb-1.5">
            <Sun className="w-3 h-3" />
            <span>{greeting} · {today}</span>
          </div>
          <h1 className="text-[28px] md:text-[32px] font-bold tracking-[-0.02em] leading-tight">
            Welcome back, <span className="text-accent">{user?.name || "Student"}</span>.
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">Here&apos;s what your study day looks like.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-app" style={{ background: "var(--bg-elevated)" }}>
            <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
            <div>
              <div className="text-[10px] text-text-tertiary leading-none uppercase tracking-wider">Streak</div>
              <div className="text-[14px] font-semibold leading-tight">{currentStreak} days</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Daily Goals */}
      <motion.div variants={staggerItem} className="card-v2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-[15px] font-semibold">Today&apos;s focus</h2>
            <span className="text-[11px] text-text-tertiary">· AI generated</span>
          </div>
          <div className="text-[11px] text-text-tertiary">{completedGoals}/{goals.length} · {goalsPct}%</div>
        </div>
        <div className="space-y-1.5">
          {goals.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-bg-elevated transition-colors group"
            >
              <button
                onClick={() => toggleGoal(g.id)}
                className="shrink-0"
                aria-label={`Mark "${g.title}" as ${g.done ? "incomplete" : "complete"}`}
              >
                {g.done ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-accent" style={{ width: 18, height: 18 }} />
                ) : (
                  <Circle className="w-4.5 h-4.5 text-text-tertiary group-hover:text-text-secondary transition-colors" style={{ width: 18, height: 18 }} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-medium ${g.done ? "text-text-tertiary line-through" : "text-text-primary"}`}>
                  {g.title}
                </div>
                <div className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{g.time} min</span>
                </div>
              </div>
              {!g.done && (
                <Link
                  href={g.href}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded text-[11px] text-accent hover:bg-[var(--accent-soft)]"
                >
                  <Play className="w-3 h-3" />
                  Start
                </Link>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="stat-card hover-lift">
            <div className="flex items-start justify-between gap-2 mb-2">
              <s.icon className="w-4 h-4 text-text-tertiary" />
              <Sparkline values={s.data} width={56} height={20} />
            </div>
            <div className="text-[22px] font-semibold leading-none mb-1">{s.value}</div>
            <div className="text-[11px] text-text-tertiary">{s.label}</div>
            <div className="text-[10px] text-accent mt-1">{s.delta}</div>
          </div>
        ))}
      </motion.div>

      {/* Heatmap */}
      <motion.div variants={staggerItem}>
        <Heatmap />
      </motion.div>

      {/* Exam alert */}
      {closestExamWithin14 && (
        <motion.div variants={staggerItem}>
          <div
            className="card-v2 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ borderColor: daysUntil(closestExamWithin14.date) <= 5 ? "rgba(240,71,71,0.30)" : "rgba(245,158,11,0.30)" }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                style={{
                  background: daysUntil(closestExamWithin14.date) <= 5 ? "rgba(240,71,71,0.10)" : "rgba(245,158,11,0.10)",
                  color: daysUntil(closestExamWithin14.date) <= 5 ? "var(--danger)" : "var(--warning)",
                }}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">{closestExamWithin14.title}</div>
                <div className="text-[11px] text-text-tertiary mt-0.5">
                  {daysUntil(closestExamWithin14.date)} days left · {closestExamWithin14.prepProgress}% prepared
                </div>
                <div className="h-1 mt-2 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${closestExamWithin14.prepProgress}%` }}
                  />
                </div>
              </div>
            </div>
            <Link href="/exam-mode" className="btn-primary text-[12px] py-2 px-3 shrink-0">
              <Target className="w-3.5 h-3.5" /> Survival Mode
            </Link>
          </div>
        </motion.div>
      )}

      {/* Two columns: due soon + recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div variants={staggerItem} className="lg:col-span-2 space-y-5">
          {/* Due soon */}
          <div className="card-v2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-accent" /> Due soon
              </h2>
              <Link href="/assignments" className="text-[11px] text-accent hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1.5">
              {dueAssignments.length === 0 ? (
                <p className="text-[13px] text-text-tertiary py-6 text-center">Nothing in the next 7 days. Breathe.</p>
              ) : (
                dueAssignments.map((a) => {
                  const dd = daysUntil(a.dueDate);
                  const priorityColor = a.priority === "high" ? "#f04747" : a.priority === "medium" ? "#f59e0b" : "#34c98e";
                  return (
                    <Link
                      key={a.id}
                      href="/assignments"
                      className="flex items-center gap-3 p-2.5 rounded-md hover:bg-bg-elevated transition-colors group"
                    >
                      <div className="w-1 h-9 rounded-full shrink-0" style={{ background: priorityColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{a.title}</div>
                        <div className="text-[11px] text-text-tertiary flex items-center gap-2 mt-0.5">
                          <span>{a.subject}</span>
                          <span>·</span>
                          <span style={{ color: dd <= 1 ? "#f04747" : dd <= 3 ? "#f59e0b" : undefined }}>
                            {formatRelative(a.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-text-secondary w-12 text-right tabular-nums">{a.progress}%</div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="card-v2">
              <h2 className="text-[15px] font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" /> Smart suggestions
              </h2>
              <div className="space-y-2">
                {recommendations.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-app group"
                    style={{
                      background:
                        r.tone === "critical"
                          ? "rgba(240,71,71,0.05)"
                          : r.tone === "warn"
                          ? "rgba(245,158,11,0.05)"
                          : r.tone === "success"
                          ? "rgba(52,201,142,0.05)"
                          : "var(--accent-soft)",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background:
                          r.tone === "critical"
                            ? "rgba(240,71,71,0.15)"
                            : r.tone === "warn"
                            ? "rgba(245,158,11,0.15)"
                            : r.tone === "success"
                            ? "rgba(52,201,142,0.15)"
                            : "var(--accent-soft-strong)",
                      }}
                    >
                      <Sparkles
                        className="w-3 h-3"
                        style={{
                          color:
                            r.tone === "critical"
                              ? "var(--danger)"
                              : r.tone === "warn"
                              ? "var(--warning)"
                              : r.tone === "success"
                              ? "var(--success)"
                              : "var(--accent)",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold mb-0.5">{r.title}</div>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{r.body}</p>
                      <Link href={r.href} className="text-[11px] text-accent hover:underline mt-1.5 inline-flex items-center gap-1">
                        {r.cta} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <button
                      onClick={() => setDismissed((d) => [...d, r.id])}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-text-tertiary hover:text-text-primary"
                      aria-label="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar column */}
        <motion.div variants={staggerItem} className="space-y-5">
          {/* Recently edited */}
          <div className="card-v2">
            <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-accent" /> Recent notes
            </h2>
            <div className="space-y-0.5">
              {notes
                .slice()
                .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
                .slice(0, 5)
                .map((n) => (
                  <Link
                    key={n.id}
                    href={`/notes/${n.id}`}
                    className="block p-2 rounded-md hover:bg-bg-elevated transition-colors"
                  >
                    <div className="text-[13px] font-medium truncate">{n.title}</div>
                    <div className="text-[10px] text-text-tertiary">{n.subject} · {formatRelative(n.updatedAt)}</div>
                  </Link>
                ))}
            </div>
          </div>

          {/* Upcoming exams */}
          <div className="card-v2">
            <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-accent" /> Exams
            </h2>
            <div className="space-y-2">
              {upcomingExams.slice(0, 3).map((e) => {
                const dd = daysUntil(e.date);
                return (
                  <Link
                    key={e.id}
                    href="/exams"
                    className="block p-2.5 rounded-md hover:bg-bg-elevated transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[12px] font-medium truncate">{e.title}</div>
                      <span className="text-[11px] font-semibold tabular-nums" style={{ color: dd <= 3 ? "#f04747" : dd <= 7 ? "#f59e0b" : "var(--success)" }}>
                        {dd}d
                      </span>
                    </div>
                    <div className="h-0.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)]" style={{ width: `${e.prepProgress}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
