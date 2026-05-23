"use client";
import { useState, useEffect, useMemo } from "react";
import { useExamsStore } from "@/store/exams.store";
import { useFlashcardsStore } from "@/store/flashcards.store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Heart,
  Brain,
  Coffee,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Wind,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Subject } from "@/lib/types";
import { SUBJECTS } from "@/lib/dummy-data";

const CALM_TIPS = [
  "Take 3 deep breaths. In for 4, hold for 4, out for 6.",
  "Your prep is real. Trust the work you've already done.",
  "Skip what you don't know — return to it later.",
  "Read each question twice before answering.",
  "If stuck, write what you do know. Partial credit matters.",
];

interface PriorityItem {
  concept: string;
  detail: string;
  weight: "high" | "medium" | "low";
}

const HIGH_PRIORITY: Record<string, PriorityItem[]> = {
  Math: [
    { concept: "Chain rule", detail: "d/dx[f(g(x))] = f'(g(x)) · g'(x)", weight: "high" },
    { concept: "Integration by parts", detail: "∫u dv = uv − ∫v du", weight: "high" },
    { concept: "Quadratic formula", detail: "x = (−b ± √(b²−4ac)) / 2a", weight: "medium" },
    { concept: "Common derivatives", detail: "sin→cos, cos→−sin, eˣ→eˣ, ln(x)→1/x", weight: "high" },
    { concept: "L'Hôpital's rule", detail: "Use only for 0/0 or ∞/∞ indeterminate forms", weight: "medium" },
  ],
  Physics: [
    { concept: "Newton's 2nd law", detail: "F = ma", weight: "high" },
    { concept: "Kinetic energy", detail: "KE = ½mv²", weight: "high" },
    { concept: "Conservation laws", detail: "Energy & momentum conserved in closed systems", weight: "high" },
    { concept: "Kinematics", detail: "v = u + at, s = ut + ½at²", weight: "medium" },
  ],
  Chemistry: [
    { concept: "Mole concept", detail: "n = m/M, 1 mol = 6.022 × 10²³ particles", weight: "high" },
    { concept: "pH", detail: "pH = −log[H⁺], neutral = 7", weight: "high" },
    { concept: "Equilibrium", detail: "Kc = [products]/[reactants] at equilibrium", weight: "medium" },
  ],
  CS: [
    { concept: "Big-O of common ops", detail: "Binary search: O(log n), hashmap: O(1), merge sort: O(n log n)", weight: "high" },
    { concept: "DP pattern", detail: "Define state → recurrence → base case → tabulate", weight: "high" },
    { concept: "Graph traversal", detail: "BFS uses queue, DFS uses stack/recursion", weight: "medium" },
  ],
  History: [
    { concept: "WWII timeline", detail: "1939 starts. 1941 US enters. 1944 D-Day. 1945 ends.", weight: "high" },
  ],
  Biology: [
    { concept: "Cell organelles", detail: "Mitochondria=energy, Ribosome=protein, ER=transport", weight: "high" },
    { concept: "Photosynthesis", detail: "Light + 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", weight: "high" },
  ],
  English: [
    { concept: "Essay structure", detail: "Intro (thesis) → 3 body paras → conclusion", weight: "high" },
  ],
  Economics: [
    { concept: "Supply & demand", detail: "Equilibrium where the curves meet", weight: "high" },
    { concept: "Elasticity", detail: "PED = %ΔQ / %ΔP. >1 elastic, <1 inelastic.", weight: "medium" },
  ],
};

interface TimelineMilestone {
  pct: number;
  label: string;
  action: string;
}

const TIMELINE: TimelineMilestone[] = [
  { pct: 100, label: "T-60", action: "Quick scan of high-yield concepts" },
  { pct: 67, label: "T-40", action: "Rapid-fire flashcards" },
  { pct: 50, label: "T-30", action: "Re-read formula sheet" },
  { pct: 33, label: "T-20", action: "Breathe · hydrate · brief rest" },
  { pct: 17, label: "T-10", action: "Quick mental walkthrough" },
  { pct: 0, label: "T-0", action: "You're ready. Walk in calm." },
];

export default function ExamModePage() {
  const { exams } = useExamsStore();
  const { decks } = useFlashcardsStore();
  const [subject, setSubject] = useState<Subject>(exams[0]?.subject || "Math");
  const [seconds, setSeconds] = useState(60 * 60);
  const [running, setRunning] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [showBreathe, setShowBreathe] = useState(false);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const deck = decks.find((d) => d.subject === subject);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds]);

  // Auto-suggest breathing every 15 min
  useEffect(() => {
    if (!running) return;
    if (seconds > 0 && seconds % (15 * 60) === 0) {
      setShowBreathe(true);
      setTimeout(() => setShowBreathe(false), 8000);
    }
  }, [seconds, running]);

  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  const concepts = HIGH_PRIORITY[subject] || [];
  const remainingPct = (seconds / 3600) * 100;

  // Reorder concepts by confidence: lowest confidence first
  const orderedConcepts = useMemo(() => {
    return [...concepts].sort((a, b) => {
      const ca = confidence[a.concept] ?? (a.weight === "high" ? 50 : 75);
      const cb = confidence[b.concept] ?? (b.weight === "high" ? 50 : 75);
      return ca - cb;
    });
  }, [concepts, confidence]);

  const currentMilestone = TIMELINE.find((m) => remainingPct <= m.pct) || TIMELINE[TIMELINE.length - 1];
  const avgConfidence =
    Object.values(confidence).length > 0
      ? Math.round(Object.values(confidence).reduce((a, b) => a + b, 0) / Object.values(confidence).length)
      : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Calm header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[11px] text-accent mb-4"
        >
          <Zap className="w-3 h-3" /> Survival Mode · 1 Hour Before Exam
        </motion.div>
        <h1 className="text-[36px] md:text-[44px] font-bold tracking-tight mb-2">
          You&apos;ve got this.
        </h1>
        <p className="text-text-secondary text-[15px]">
          Just the essentials. Stay calm. Trust your prep.
        </p>
      </div>

      {/* Breathing reminder toast */}
      <AnimatePresence>
        {showBreathe && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-40 card-v2 flex items-center gap-3 border-accent/30"
            style={{ padding: "12px 18px" }}
          >
            <Wind className="w-4 h-4 text-accent" />
            <span className="text-[13px]">Time to breathe — 4 seconds in, 6 out.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 mb-8">
        {/* Timer */}
        <div className="card-v2 flex flex-col items-center" style={{ padding: 24 }}>
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="var(--accent)"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - seconds / 3600)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[36px] font-bold font-mono tabular-nums leading-none">
                  {mm}:{ss}
                </div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-text-tertiary mt-2">
                  remaining
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRunning(!running)} className="btn-primary">
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => {
                setSeconds(3600);
                setRunning(false);
              }}
              className="btn-ghost"
              aria-label="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Emergency Revision Timeline */}
        <div className="card-v2" style={{ padding: 24 }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-[14px]">Revision Timeline</h3>
          </div>
          <div className="space-y-2">
            {TIMELINE.map((m) => {
              const isCurrent = m.label === currentMilestone.label;
              const isPast = remainingPct < m.pct;
              return (
                <div
                  key={m.label}
                  className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] transition-colors ${
                    isCurrent
                      ? "bg-[var(--accent-soft)] border border-accent/30"
                      : isPast
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  <div
                    className={`w-12 text-[11px] font-mono ${
                      isCurrent ? "text-accent font-semibold" : "text-text-tertiary"
                    }`}
                  >
                    {m.label}
                  </div>
                  <div className="text-[12px] text-text-secondary flex-1">{m.action}</div>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subject selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`text-[12px] px-3 py-1.5 rounded-[var(--radius-sm)] border transition-colors ${
              subject === s
                ? "bg-[var(--accent-soft)] text-accent border-accent/40"
                : "border-app text-text-secondary hover:border-[var(--border-strong)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4">
          {/* Confidence-prioritized concepts */}
          <div className="card-v2" style={{ padding: 20 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent" /> Priority concepts
                <span className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                  weakest first
                </span>
              </h2>
              {avgConfidence > 0 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-text-secondary">Avg {avgConfidence}%</span>
                </div>
              )}
            </div>
            <div className="space-y-2.5">
              {orderedConcepts.map((c, i) => {
                const conf = confidence[c.concept] ?? (c.weight === "high" ? 50 : 75);
                return (
                  <motion.div
                    key={c.concept}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-app"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-[14px]">{c.concept}</div>
                      <span
                        className={`text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded ${
                          c.weight === "high"
                            ? "bg-red-500/10 text-red-300"
                            : c.weight === "medium"
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-blue-500/10 text-blue-300"
                        }`}
                      >
                        {c.weight}
                      </span>
                    </div>
                    <div className="text-[13px] text-text-secondary mb-2.5">{c.detail}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-tertiary w-16">Confidence</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={conf}
                        onChange={(e) =>
                          setConfidence((s) => ({ ...s, [c.concept]: parseInt(e.target.value) }))
                        }
                        className="flex-1 h-1 rounded-full accent-[var(--accent)]"
                      />
                      <span
                        className={`text-[11px] font-mono w-9 text-right ${
                          conf >= 75 ? "text-emerald-400" : conf >= 40 ? "text-amber-400" : "text-red-400"
                        }`}
                      >
                        {conf}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick-fire flashcards */}
          {deck && deck.cards.length > 0 && (
            <div className="card-v2" style={{ padding: 20 }}>
              <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" /> Quick-fire cards
              </h2>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCardIdx((i) => Math.max(0, i - 1))}
                  className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-elevated)]"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={cardIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 text-center p-4"
                  >
                    <div className="text-[11px] text-text-tertiary mb-1.5">
                      Q · {cardIdx + 1}/{deck.cards.length}
                    </div>
                    <div className="text-[16px] font-medium mb-3">
                      {deck.cards[cardIdx]?.front}
                    </div>
                    <div className="text-[14px] text-emerald-300 italic">
                      {deck.cards[cardIdx]?.back}
                    </div>
                  </motion.div>
                </AnimatePresence>
                <button
                  onClick={() => setCardIdx((i) => Math.min(deck.cards.length - 1, i + 1))}
                  className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-elevated)]"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="card-v2 border-accent/20" style={{ padding: 16, background: "rgba(124,109,250,0.04)" }}>
            <h3 className="font-semibold text-[13px] mb-2.5 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-accent" /> Stay calm
            </h3>
            <ul className="space-y-2">
              {CALM_TIPS.map((t, i) => (
                <li
                  key={i}
                  className="text-[12px] text-text-secondary flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="text-accent mt-1">·</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-v2" style={{ padding: 16 }}>
            <h3 className="font-semibold text-[13px] mb-1.5 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-400" /> Quick fuel
            </h3>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              A glass of water and a few deep breaths will sharpen you faster than re-reading
              notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
