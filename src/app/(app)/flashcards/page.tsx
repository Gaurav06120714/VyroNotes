"use client";
import { useFlashcardsStore } from "@/store/flashcards.store";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Layers,
  X,
  RotateCcw,
  Sparkles,
  Zap,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import { pct } from "@/lib/utils";
import { SUBJECTS } from "@/lib/dummy-data";
import { Subject, FlashcardDeck, Flashcard } from "@/lib/types";
import { Rating, masteryLabel } from "@/lib/srs";
import toast from "react-hot-toast";

type StudyMode = "normal" | "mistakes" | "rapid";

export default function FlashcardsPage() {
  const { decks, createDeck, rateCard, deleteDeck, getDueCards, getMistakeReviewCards } =
    useFlashcardsStore();
  const [studyDeck, setStudyDeck] = useState<FlashcardDeck | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>("normal");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<Subject>("Math");

  const startStudy = (d: FlashcardDeck, mode: StudyMode) => {
    setStudyDeck(d);
    setStudyMode(mode);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Flashcards</h1>
          <p className="text-text-secondary text-[13px] mt-0.5">
            Spaced repetition · {decks.length} decks ·{" "}
            {decks.reduce((a, d) => a + getDueCards(d.id), 0)} due today
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Deck
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((d, i) => {
          const mastered = d.cards.filter((c) => c.mastery >= 80).length;
          const p = pct(mastered, d.cards.length);
          const due = getDueCards(d.id);
          const mistakes = getMistakeReviewCards(d.id).length;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="card-v2 hover-lift group relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-soft)] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                  {d.subject}
                </span>
              </div>
              <h3 className="font-semibold text-[15px] mb-0.5">{d.name}</h3>
              <p className="text-[11px] text-text-tertiary mb-3">{d.cards.length} cards</p>

              {/* Mastery ring inline */}
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-text-secondary">Mastery</span>
                <span className="font-semibold text-emerald-400">{p}%</span>
              </div>
              <div className="h-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-accent"
                />
              </div>

              {/* Stats chips */}
              <div className="flex items-center gap-1.5 mb-3 text-[10px]">
                {due > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-accent">
                    {due} due
                  </span>
                )}
                {mistakes > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    {mistakes} to review
                  </span>
                )}
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => startStudy(d, "normal")}
                  className="flex-1 text-[12px] font-medium px-2.5 py-2 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] hover:bg-[var(--accent-soft-strong)] text-accent transition-colors"
                >
                  Study
                </button>
                {mistakes > 0 && (
                  <button
                    onClick={() => startStudy(d, "mistakes")}
                    className="text-[12px] font-medium px-2.5 py-2 rounded-[var(--radius-sm)] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                    title="Mistake review"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => startStudy(d, "rapid")}
                  className="text-[12px] font-medium px-2.5 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/70 text-text-secondary transition-colors"
                  title="Rapid fire (30s)"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    deleteDeck(d.id);
                    toast.success("Deleted");
                  }}
                  className="text-[12px] px-2.5 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-elevated)] text-text-tertiary hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create deck modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md glass-strong rounded-[var(--radius-lg)] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-[17px] font-semibold mb-4">Create Deck</h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Deck name"
                className="input-base mb-3"
                autoFocus
              />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="input-base mb-4"
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setCreateOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!name.trim()) return toast.error("Name required");
                    createDeck(name, subject);
                    setName("");
                    setCreateOpen(false);
                    toast.success("Deck created");
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

      {/* Study mode */}
      <AnimatePresence>
        {studyDeck && (
          <StudySession
            deck={studyDeck}
            mode={studyMode}
            mistakeIds={getMistakeReviewCards(studyDeck.id)}
            onClose={() => setStudyDeck(null)}
            onRate={(cId, rating) => rateCard(studyDeck.id, cId, rating)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StudySession({
  deck,
  mode,
  mistakeIds,
  onClose,
  onRate,
}: {
  deck: FlashcardDeck;
  mode: StudyMode;
  mistakeIds: string[];
  onClose: () => void;
  onRate: (cardId: string, rating: Rating) => void;
}) {
  const cards = useMemo(() => {
    if (mode === "mistakes") return deck.cards.filter((c) => mistakeIds.includes(c.id));
    return deck.cards;
  }, [deck, mode, mistakeIds]);

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [rapidTimeLeft, setRapidTimeLeft] = useState(30);
  const [done, setDone] = useState(false);

  const card: Flashcard | undefined = cards[idx];
  const total = cards.length;

  // Rapid fire timer
  useEffect(() => {
    if (mode !== "rapid" || done) return;
    if (rapidTimeLeft <= 0) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setRapidTimeLeft((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, rapidTimeLeft, done]);

  if (!card || total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div className="card-v2 max-w-md text-center" style={{ padding: 28 }}>
          <Sparkles className="w-10 h-10 text-accent mx-auto mb-3" />
          <h2 className="text-[20px] font-bold mb-2">
            {mode === "mistakes" ? "No mistakes to review" : "Empty deck"}
          </h2>
          <p className="text-[13px] text-text-secondary mb-4">
            {mode === "mistakes" ? "Great job — your recent cards are looking solid." : "Add cards to start studying."}
          </p>
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  if (done) {
    const totalRated = stats.again + stats.hard + stats.good + stats.easy;
    return <SessionComplete stats={stats} totalRated={totalRated} onClose={onClose} />;
  }

  const rate = (rating: Rating) => {
    onRate(card.id, rating);
    setStats((s) => ({ ...s, [rating]: s[rating] + 1 }));
    if (mode === "rapid") {
      setIdx((idx + 1) % cards.length);
      setFlipped(false);
    } else if (idx < total - 1) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      setDone(true);
    }
  };

  const masteryInfo = masteryLabel(card.mastery);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 text-[13px] text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">{deck.name}</span>
            {mode === "mistakes" && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px]">
                Mistake review
              </span>
            )}
            {mode === "rapid" && (
              <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] inline-flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Rapid · {rapidTimeLeft}s
              </span>
            )}
          </div>
          <span>
            Card {idx + 1} of {total}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-[var(--bg-elevated)] rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{
              width: mode === "rapid" ? `${pct(30 - rapidTimeLeft, 30)}%` : `${pct(idx + 1, total)}%`,
            }}
            transition={{ duration: 0.25 }}
          />
        </div>

        {/* Card */}
        <div className="relative" style={{ perspective: 1200 }}>
          <motion.div
            key={card.id + (flipped ? "f" : "b")}
            className="relative w-full h-80 cursor-pointer"
            onClick={() => setFlipped(!flipped)}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 glass-strong rounded-[var(--radius-lg)] flex items-center justify-center p-8 border border-app"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.1em] text-text-tertiary mb-3">
                  Question
                </div>
                <div className="text-[24px] font-semibold leading-relaxed">{card.front}</div>
                <div className="text-[11px] text-text-tertiary mt-7">Tap or press space to flip</div>
              </div>
            </div>
            <div
              className="absolute inset-0 glass-strong rounded-[var(--radius-lg)] flex items-center justify-center p-8 border border-accent/30"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.1em] text-accent mb-3">Answer</div>
                <div className="text-[24px] font-semibold leading-relaxed">{card.back}</div>
                <div className={`text-[10px] mt-4 ${masteryInfo.color}`}>
                  {masteryInfo.label} · {card.mastery}% mastery
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Rating buttons */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-4 gap-2 mt-6"
            >
              <RatingButton color="red" label="Again" hint="< 1d" onClick={() => rate("again")} />
              <RatingButton color="orange" label="Hard" hint="~3d" onClick={() => rate("hard")} />
              <RatingButton color="emerald" label="Good" hint="~7d" onClick={() => rate("good")} />
              <RatingButton color="blue" label="Easy" hint="14d+" onClick={() => rate("easy")} />
            </motion.div>
          )}
        </AnimatePresence>

        {!flipped && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setFlipped(true)}
              className="btn-primary px-7 py-3"
            >
              Show Answer
            </button>
            <button
              onClick={() => setFlipped(!flipped)}
              className="p-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] text-text-secondary border border-app"
              aria-label="Flip"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-text-tertiary">
          <span className="text-red-400">Again: {stats.again}</span>
          <span className="text-orange-400">Hard: {stats.hard}</span>
          <span className="text-emerald-400">Good: {stats.good}</span>
          <span className="text-blue-400">Easy: {stats.easy}</span>
        </div>
      </div>
    </motion.div>
  );
}

function RatingButton({
  color,
  label,
  hint,
  onClick,
}: {
  color: "red" | "orange" | "emerald" | "blue";
  label: string;
  hint: string;
  onClick: () => void;
}) {
  const styles: Record<typeof color, string> = {
    red: "bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-500/20",
    orange: "bg-orange-500/10 border-orange-500/40 text-orange-300 hover:bg-orange-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20",
    blue: "bg-blue-500/10 border-blue-500/40 text-blue-300 hover:bg-blue-500/20",
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-[var(--radius-md)] border transition-colors ${styles[color]}`}
    >
      <span className="text-[13px] font-semibold">{label}</span>
      <span className="text-[10px] opacity-70">{hint}</span>
    </button>
  );
}

function SessionComplete({
  stats,
  totalRated,
  onClose,
}: {
  stats: { again: number; hard: number; good: number; easy: number };
  totalRated: number;
  onClose: () => void;
}) {
  const correct = stats.good + stats.easy;
  const accuracy = totalRated > 0 ? Math.round((correct / totalRated) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="card-v2 max-w-md w-full text-center"
        style={{ padding: 32 }}
      >
        <div className="w-14 h-14 rounded-full bg-[var(--accent-soft)] mx-auto mb-4 flex items-center justify-center">
          <Target className="w-7 h-7 text-accent" />
        </div>
        <h2 className="text-[22px] font-bold mb-1">Session Complete</h2>
        <p className="text-[13px] text-text-secondary mb-6">
          {accuracy}% accuracy on {totalRated} cards
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Stat icon={<TrendingUp className="w-4 h-4" />} label="Correct" value={correct} color="text-emerald-400" />
          <Stat icon={<Clock className="w-4 h-4" />} label="Needs review" value={stats.again + stats.hard} color="text-amber-400" />
        </div>
        <button onClick={onClose} className="btn-primary w-full">
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card-v2 text-center" style={{ padding: 14 }}>
      <div className={`flex items-center justify-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-[20px] font-bold">{value}</span>
      </div>
      <div className="text-[11px] text-text-tertiary">{label}</div>
    </div>
  );
}
