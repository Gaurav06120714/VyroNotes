// Personalized recommendation engine — rules-based against store snapshots.
import { Note, Assignment, Exam, FlashcardDeck } from "@/lib/types";
import { daysUntil } from "@/lib/utils";

export interface Recommendation {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  tone: "info" | "warn" | "critical" | "success";
}

interface Input {
  notes: Note[];
  assignments: Assignment[];
  exams: Exam[];
  decks: FlashcardDeck[];
  streak: number;
}

export function generateRecommendations(input: Input): Recommendation[] {
  const out: Recommendation[] = [];
  const { notes, assignments, exams, decks, streak } = input;

  // Upcoming critical exams
  const sortedExams = [...exams].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const closestExam = sortedExams[0];
  if (closestExam) {
    const days = daysUntil(closestExam.date);
    if (days >= 0 && days <= 7 && closestExam.prepProgress < 75) {
      out.push({
        id: `exam-${closestExam.id}`,
        title: `${closestExam.title} in ${days}d`,
        body: `Only ${closestExam.prepProgress}% prepared. Switch to Survival Mode and we'll route you straight to the highest-yield topics.`,
        href: "/exam-mode",
        cta: "Open Survival Mode",
        tone: days <= 3 ? "critical" : "warn",
      });
    }
  }

  // Stale notes (>3 days since update on a frequently-edited subject)
  const staleNotes = notes
    .filter((n) => !n.archived && !n.trashed)
    .filter((n) => daysUntil(n.updatedAt) < -3)
    .slice(0, 1);
  if (staleNotes[0]) {
    const note = staleNotes[0];
    out.push({
      id: `stale-${note.id}`,
      title: `You haven't reviewed ${note.subject} in a while`,
      body: `"${note.title}" was last edited ${Math.abs(daysUntil(note.updatedAt))} days ago. A quick 5-minute flashcard session keeps it sticky.`,
      href: "/flashcards",
      cta: "Review now",
      tone: "info",
    });
  }

  // Low-mastery deck nudge
  const weakDeck = decks
    .map((d) => ({
      d,
      avg: d.cards.length
        ? d.cards.reduce((s, c) => s + c.mastery, 0) / d.cards.length
        : 100,
    }))
    .filter((x) => x.avg < 60)
    .sort((a, b) => a.avg - b.avg)[0];
  if (weakDeck) {
    out.push({
      id: `weak-${weakDeck.d.id}`,
      title: `${weakDeck.d.name} needs love`,
      body: `Average mastery is only ${Math.round(weakDeck.avg)}%. 10 minutes today moves you to ~75%.`,
      href: "/flashcards",
      cta: "Study deck",
      tone: "info",
    });
  }

  // Overdue assignment
  const overdue = assignments
    .filter((a) => a.status !== "done" && daysUntil(a.dueDate) < 0)
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0];
  if (overdue) {
    out.push({
      id: `overdue-${overdue.id}`,
      title: `Overdue: ${overdue.title}`,
      body: `Due ${Math.abs(daysUntil(overdue.dueDate))} days ago. Mark it done or push the due date.`,
      href: "/assignments",
      cta: "Open task",
      tone: "critical",
    });
  }

  // Streak hype
  if (streak >= 7 && streak < 30) {
    out.push({
      id: "streak-momentum",
      title: `${streak}-day streak — keep it going`,
      body: `You're in the zone. One short focus session today keeps the streak alive.`,
      href: "/timer",
      cta: "Start a session",
      tone: "success",
    });
  }

  return out.slice(0, 4);
}
