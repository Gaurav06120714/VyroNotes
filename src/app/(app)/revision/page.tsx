"use client";
import { useState } from "react";
import { SUBJECTS } from "@/lib/dummy-data";
import { useFlashcardsStore } from "@/store/flashcards.store";
import Link from "next/link";
import { BookOpen, Layers, Printer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const REVISION_CONTENT: Record<string, { key: string; items: string[] }[]> = {
  Math: [
    { key: "Calculus", items: ["Chain rule: f'(g(x)) · g'(x)", "Power rule: d/dx[xⁿ] = n·xⁿ⁻¹", "Product rule: (fg)' = f'g + fg'", "Integration by parts: ∫u dv = uv - ∫v du"] },
    { key: "Algebra", items: ["Quadratic formula: x = (-b ± √(b²-4ac)) / 2a", "Discriminant: b² - 4ac"] },
  ],
  Physics: [
    { key: "Mechanics", items: ["F = ma (Newton's 2nd)", "KE = ½mv²", "p = mv (momentum)", "W = Fd"] },
    { key: "Constants", items: ["g = 9.81 m/s²", "c = 3 × 10⁸ m/s", "G = 6.67 × 10⁻¹¹"] },
  ],
  Chemistry: [
    { key: "Organic", items: ["Alkenes: CnH2n", "Markovnikov's rule for HX addition", "SN1 vs SN2 mechanisms"] },
  ],
  CS: [
    { key: "Complexity", items: ["Binary search: O(log n)", "Merge sort: O(n log n)", "Hash lookup: O(1) avg", "DP often reduces O(2ⁿ) to O(n²)"] },
  ],
  History: [{ key: "WWII", items: ["1939-1945", "D-Day: June 6, 1944", "Pearl Harbor: Dec 7, 1941"] }],
  Biology: [{ key: "Cells", items: ["Mitochondria = powerhouse", "Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "Mitosis: 2 identical cells"] }],
  English: [{ key: "Themes", items: ["Identify motifs and recurring symbols", "Connect themes to historical context"] }],
  Economics: [{ key: "Basics", items: ["Law of demand: P↑ → Q↓", "Law of supply: P↑ → Q↑", "Equilibrium: S = D"] }],
};

export default function RevisionPage() {
  const [subject, setSubject] = useState<string>("Math");
  const [quickGlance, setQuickGlance] = useState(false);
  const { decks } = useFlashcardsStore();
  const deck = decks.find((d) => d.subject === subject);
  const sections = REVISION_CONTENT[subject] || [];

  return (
    <div className="max-w-5xl mx-auto print:p-0">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Revision Sheets</h1>
          <p className="text-text-secondary text-sm">Auto-generated last-minute summaries</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setQuickGlance(!quickGlance)} className={cn("btn-ghost text-sm", quickGlance && "border-accent text-accent")}>
            <Zap className="w-4 h-4" /> Quick Glance
          </button>
          <button onClick={() => window.print()} className="btn-ghost text-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5 print:hidden">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={cn(
              "text-sm px-3 py-1.5 rounded-lg border transition-colors",
              subject === s ? "bg-accent/15 text-white border-accent/40" : "border-app text-text-secondary hover:border-strong"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold">{subject} — Revision Sheet</h2>
        </div>

        {sections.map((sec, i) => (
          <motion.div key={sec.key} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mb-4 last:mb-0">
            <h3 className="text-sm font-semibold text-accent mb-2 uppercase tracking-wider">{sec.key}</h3>
            <ul className="space-y-1.5">
              {sec.items.map((it, j) => (
                <li key={j} className={cn("flex items-start gap-2", quickGlance && "text-base font-medium")}>
                  <span className="text-accent mt-1.5">•</span>
                  <span className="text-text-secondary">{it}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}

        {deck && (
          <div className="mt-6 pt-4 border-t border-app print:hidden">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" /> Quick-fire flashcards
            </h3>
            <Link href="/flashcards" className="block p-4 rounded-xl bg-accent/5 border border-accent/30 hover:bg-accent/10 transition-colors">
              <div className="text-sm font-medium">{deck.name}</div>
              <div className="text-xs text-text-tertiary mt-1">{deck.cards.length} cards · Tap to start review</div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
