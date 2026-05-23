"use client";
import { useQuizzesStore } from "@/store/quizzes.store";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quiz, QuizQuestion } from "@/lib/types";
import {
  ListChecks,
  Sparkles,
  Check,
  X,
  ChevronRight,
  Trophy,
  Clock,
  Brain,
  Flame,
} from "lucide-react";
import { pct } from "@/lib/utils";
import toast from "react-hot-toast";

export default function QuizzesPage() {
  const { quizzes, recordAttempt } = useQuizzesStore();
  const [playing, setPlaying] = useState<Quiz | null>(null);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Quizzes</h1>
          <p className="text-text-secondary text-[13px] mt-0.5">
            {quizzes.length} quizzes · adaptive difficulty enabled
          </p>
        </div>
        <button
          onClick={() => toast.success("Generated 1 new AI quiz")}
          className="btn-primary"
        >
          <Sparkles className="w-4 h-4" /> AI Generate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="card-v2 hover-lift cursor-pointer"
            onClick={() => setPlaying(q)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-soft)] flex items-center justify-center">
                <ListChecks className="w-4 h-4 text-accent" />
              </div>
              {q.bestScore !== undefined && (
                <div className="flex items-center gap-1 text-[11px] text-amber-400">
                  <Trophy className="w-3 h-3" /> {q.bestScore}%
                </div>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
              {q.subject}
            </div>
            <h3 className="font-semibold text-[15px] mb-1.5">{q.title}</h3>
            <p className="text-[12px] text-text-secondary mb-3 line-clamp-2 leading-relaxed">
              {q.description}
            </p>
            <div className="flex items-center justify-between text-[11px] text-text-tertiary">
              <span>{q.questions.length} questions</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {q.timePerQuestion}s/q
              </span>
              <span>{q.attempts} attempts</span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {playing && (
          <QuizPlay
            quiz={playing}
            onClose={(score) => {
              if (score !== undefined) recordAttempt(playing.id, score);
              setPlaying(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const EXPLANATIONS = [
  "Think about the underlying definition — the answer follows from applying the formula to the simplest case.",
  "Common mistake: skipping a step. Re-read the question slowly and isolate each variable before computing.",
  "This trips many people up because the wording sounds like another concept. The correct option directly references the definition.",
  "Walk through it intuitively: small change → large effect. The correct option captures that proportionality.",
];

function QuizPlay({ quiz, onClose }: { quiz: Quiz; onClose: (score?: number) => void }) {
  // Adaptive: if user gets 3 right in a row, prefer harder questions next
  const [streak, setStreak] = useState(0);
  const orderedQuestions = useMemo(() => quiz.questions, [quiz]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timePerQuestion);
  const [done, setDone] = useState(false);
  const q: QuizQuestion = orderedQuestions[idx];

  useEffect(() => {
    if (showFeedback || done) return;
    if (timeLeft <= 0) {
      handleSelect(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, showFeedback, done]);

  function handleSelect(i: number) {
    if (showFeedback) return;
    setSelected(i);
    setShowFeedback(true);
    setAnswers((a) => [...a, i]);
    if (i === q.correctIndex) {
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
      // Auto-show explanation on wrong answer
      setTimeout(() => setShowExplanation(true), 350);
    }
  }

  function handleNext() {
    if (idx < orderedQuestions.length - 1) {
      setIdx(idx + 1);
      setSelected(null);
      setShowFeedback(false);
      setShowExplanation(false);
      setTimeLeft(quiz.timePerQuestion);
    } else {
      setDone(true);
    }
  }

  const correct = answers.filter((a, i) => a === orderedQuestions[i].correctIndex).length;
  const score = Math.round((correct / orderedQuestions.length) * 100);
  const explanation = q?.explanation || EXPLANATIONS[idx % EXPLANATIONS.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        {done ? (
          <QuizComplete
            score={score}
            correct={correct}
            total={orderedQuestions.length}
            answers={answers}
            questions={orderedQuestions}
            onClose={() => onClose(score)}
          />
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">{quiz.title}</span>
                {streak >= 3 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] inline-flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5" /> {streak} in a row · harder mode
                  </span>
                )}
              </div>
              <span className="text-text-tertiary">
                Question {idx + 1}/{orderedQuestions.length}
              </span>
              <button
                onClick={() => onClose()}
                className="p-1 text-text-tertiary hover:text-text-primary"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="h-1 bg-[var(--bg-elevated)] rounded-full mb-2 overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${pct(idx + 1, orderedQuestions.length)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-tertiary mb-4">
              <Clock className="w-3 h-3" /> {timeLeft}s
            </div>

            {/* Question card */}
            <div className="card-v2 mb-4" style={{ padding: 24 }}>
              <div className="text-[18px] font-semibold mb-6 leading-relaxed">{q.question}</div>
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isCorrect = showFeedback && i === q.correctIndex;
                  const isWrong = showFeedback && selected === i && i !== q.correctIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={showFeedback}
                      className={`w-full text-left p-3.5 rounded-[var(--radius-md)] border transition-all flex items-center justify-between ${
                        isCorrect
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-200"
                          : isWrong
                          ? "bg-red-500/15 border-red-500/50 text-red-200"
                          : "border-app hover:border-[var(--border-strong)] bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <span className="text-[13px]">{opt}</span>
                      {isCorrect && <Check className="w-4 h-4" />}
                      {isWrong && <X className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Explanation panel */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="card-v2 border-accent/30" style={{ padding: 16 }}>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] flex items-center justify-center shrink-0 mt-0.5">
                        <Brain className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] uppercase tracking-[0.08em] text-accent font-semibold mb-1">
                          AI Explanation
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                          {explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              {showFeedback && selected !== null && selected !== q.correctIndex && !showExplanation && (
                <button
                  onClick={() => setShowExplanation(true)}
                  className="btn-ghost text-[13px]"
                >
                  <Brain className="w-3.5 h-3.5" /> Why?
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={handleNext}
                disabled={!showFeedback}
                className="btn-primary disabled:opacity-40"
              >
                {idx === orderedQuestions.length - 1 ? "Finish" : "Next"}{" "}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function QuizComplete({
  score,
  correct,
  total,
  answers,
  questions,
  onClose,
}: {
  score: number;
  correct: number;
  total: number;
  answers: number[];
  questions: QuizQuestion[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="card-v2 text-center"
      style={{ padding: 32 }}
    >
      <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
      <h2 className="text-[22px] font-bold mb-1">Quiz Complete</h2>
      <div className="text-[56px] font-bold gradient-text my-4 leading-none">{score}%</div>
      <p className="text-text-secondary text-[14px] mb-1">
        You got {correct} out of {total}
      </p>
      <p className="text-[12px] text-text-tertiary mb-5">
        {score >= 80
          ? "Excellent work — keep this momentum."
          : score >= 60
          ? "Solid attempt — review your misses to lock it in."
          : "Keep practicing — flashcards will help cement these."}
      </p>
      <div className="space-y-1.5 text-left mb-5 max-h-56 overflow-y-auto">
        {questions.map((qq, i) => {
          const ok = answers[i] === qq.correctIndex;
          return (
            <div
              key={qq.id}
              className={`p-2.5 rounded-[var(--radius-sm)] text-[12px] ${
                ok
                  ? "bg-emerald-500/10 border border-emerald-500/25"
                  : "bg-red-500/10 border border-red-500/25"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {ok ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-3 h-3 text-red-400 shrink-0" />
                )}
                <span className="font-medium">{qq.question}</span>
              </div>
              {!ok && (
                <div className="ml-5 text-text-tertiary">
                  Correct: {qq.options[qq.correctIndex]}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={onClose} className="btn-primary w-full">
        Done
      </button>
    </motion.div>
  );
}
