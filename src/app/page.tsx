"use client";
import Link from "next/link";
import {
  Sparkles,
  StickyNote,
  Layers,
  ListChecks,
  Kanban,
  Calendar,
  Timer,
  FileText,
  Zap,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, fadeUpTransition, stagger, staggerItem } from "@/lib/animations";

const FEATURES = [
  { icon: StickyNote, title: "Smart Notes", desc: "Markdown with slash commands, AI summaries, and links between notes." },
  { icon: Layers, title: "Flashcards", desc: "Spaced repetition with mastery rings and quick review modes." },
  { icon: ListChecks, title: "AI Quizzes", desc: "Generate quizzes from any note and get adaptive difficulty." },
  { icon: Kanban, title: "Assignments", desc: "Kanban board with drag-and-drop and priority-aware sorting." },
  { icon: Calendar, title: "Calendar", desc: "Exams, due dates and study sessions in one unified timeline." },
  { icon: Timer, title: "Pomodoro", desc: "Track deep work and build consistency without the noise." },
  { icon: FileText, title: "PDF Chat", desc: "Ask questions about your textbooks and save answers as notes." },
  { icon: Zap, title: "Exam Mode", desc: "A calm, focused cram space with just the topics that matter." },
];

const STATS = [
  { label: "Notes", val: "127" },
  { label: "Streak", val: "23d" },
  { label: "Mastered", val: "412" },
  { label: "Focus", val: "4h 12m" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-text-primary overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-[var(--bg-surface)] border-b border-app h-16 flex items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Vyro Notes</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-[13px] text-text-secondary">
          <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
          <a href="#stats" className="hover:text-text-primary transition-colors">Why Vyro</a>
          <a href="#cta" className="hover:text-text-primary transition-colors">Get Started</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-3">Sign in</Link>
          <Link href="/register" className="btn-primary text-[13px]">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-app bg-[var(--bg-surface)] text-[11px] text-text-secondary mb-8"
        >
          <Sparkles className="w-3 h-3 text-accent" />
          <span>Notes, flashcards, quizzes — all in one place</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-[44px] md:text-[68px] font-bold tracking-[-0.025em] leading-[1.05] mb-6"
        >
          One place for<br />
          <span className="gradient-text">all your studying.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-[17px] md:text-[19px] text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Take notes, make flashcards, run quizzes, track assignments, and prep for exams — without switching between five different apps.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20"
        >
          <Link href="/dashboard" className="btn-primary text-[15px] px-5 py-2.5">
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-ghost text-[15px] px-5 py-2.5">
            Sign in
          </Link>
        </motion.div>

        {/* Mock dashboard card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="bg-[var(--bg-elevated)] border border-app rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2 px-4 h-9 border-b border-app bg-[var(--bg-elevated)]/40">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
              <div className="flex-1 text-center text-[11px] text-text-tertiary">vyronotes.app/dashboard</div>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="text-[11px] text-text-tertiary mb-1">{s.label}</div>
                  <div className="text-[24px] font-semibold text-text-primary">{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Dashboard proof section */}
      <section id="stats" className="relative max-w-5xl mx-auto px-6 py-12">
        <div className="card-v2 overflow-hidden" style={{ padding: 0 }}>
          {/* Fake browser bar */}
          <div className="flex items-center gap-2 px-4 h-9 border-b border-app bg-[var(--bg-elevated)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]/60" />
            <span className="flex-1 text-center text-[11px] text-text-tertiary">vyronotes.app/dashboard</span>
          </div>
          {/* Dashboard content */}
          <div className="p-5">
            {/* Top row: stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Notes', value: '127', delta: '+3 today' },
                { label: 'Cards mastered', value: '412', delta: '18 due today' },
                { label: 'Streak', value: '23 days', delta: 'best: 31' },
                { label: 'Focus today', value: '2h 14m', delta: 'goal: 3h' },
              ].map(({ label, value, delta }) => (
                <div key={label} className="stat-card">
                  <div className="text-[11px] text-text-tertiary mb-1">{label}</div>
                  <div className="text-[20px] font-semibold text-text-primary leading-tight">{value}</div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">{delta}</div>
                </div>
              ))}
            </div>
            {/* Bottom row: recent note + upcoming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Recent note */}
              <div className="stat-card">
                <div className="text-[11px] text-text-tertiary mb-2">Last edited note</div>
                <div className="text-[13px] font-semibold text-text-primary mb-1">Chapter 9 — Cellular Respiration</div>
                <div className="text-[12px] text-text-secondary leading-relaxed line-clamp-2">
                  Glycolysis converts glucose → 2 pyruvate, net +2 ATP. Occurs in cytoplasm, no O₂ needed. Krebs cycle runs ×2 per glucose...
                </div>
                <div className="flex gap-1.5 mt-2.5">
                  {['Biology', 'Exam prep'].map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-accent">{t}</span>
                  ))}
                </div>
              </div>
              {/* Upcoming */}
              <div className="stat-card">
                <div className="text-[11px] text-text-tertiary mb-2">Coming up</div>
                <div className="space-y-2">
                  {[
                    { title: 'Bio midterm', date: 'Fri 30 May', type: 'Exam', urgent: true },
                    { title: 'Chem lab report', date: 'Mon 2 Jun', type: 'Assignment', urgent: false },
                    { title: 'Stats quiz 4', date: 'Wed 4 Jun', type: 'Quiz', urgent: false },
                  ].map(({ title, date, type, urgent }) => (
                    <div key={title} className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${urgent ? 'bg-[rgba(245,158,11,0.12)] text-[var(--warning)]' : 'bg-[var(--bg-elevated)] text-text-tertiary'}`}>{type}</span>
                      <span className="text-[12px] text-text-primary flex-1 truncate">{title}</span>
                      <span className="text-[11px] text-text-tertiary shrink-0">{date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[0.12em] text-accent mb-3 font-semibold">What&apos;s included</div>
          <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.02em] mb-3">Everything connected, nothing missing.</h2>
          <p className="text-text-secondary max-w-xl mx-auto text-[15px]">Jot a note in class. Turn it into a quiz before bed. Track your exam on the calendar. It all connects.</p>
        </div>
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={staggerItem}
              className="card-v2 interactive group cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-[1.05]"
                style={{ background: "var(--accent-soft)" }}
              >
                <f.icon className="w-4.5 h-4.5 text-accent" style={{ width: 18, height: 18 }} />
              </div>
              <div className="font-semibold mb-1 text-[15px]">{f.title}</div>
              <div className="text-[13px] text-text-secondary leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={fadeUpTransition}
          className="card-v2 relative overflow-hidden"
          style={{ padding: 48, borderRadius: 20 }}
        >
          <div className="relative">
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.02em] mb-3">Give it a try — it&apos;s free.</h2>
            <p className="text-text-secondary mb-7 text-[15px]">No credit card. No trial period. Your notes and data are yours.</p>
            <Link href="/dashboard" className="btn-primary text-[15px] px-5 py-2.5">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-app py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-text-tertiary">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>© 2026 Vyro Notes — built for students.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-text-primary transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
