/**
 * SM-2 Spaced Repetition Algorithm
 * Returns updated interval, easeFactor and next due date based on confidence rating
 */
export type Rating = "again" | "hard" | "good" | "easy";

export interface SRSResult {
  interval: number;
  easeFactor: number;
  mastery: number;
  dueAt: string;
}

export function applyRating(
  currentInterval: number,
  currentEase: number,
  currentMastery: number,
  rating: Rating
): SRSResult {
  let interval = currentInterval;
  let easeFactor = currentEase;
  let mastery = currentMastery;

  // SM-2 quality: 0 (again) → 1 (hard) → 2 (good) → 3 (easy)
  const qualityMap: Record<Rating, number> = { again: 0, hard: 2, good: 3, easy: 5 };
  const q = qualityMap[rating];

  if (q < 3) {
    // Failed — reset interval, keep ease above floor
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    mastery = Math.max(0, mastery - 15);
  } else {
    // Passed
    if (currentInterval === 0) interval = 1;
    else if (currentInterval === 1) interval = q === 5 ? 4 : 3;
    else interval = Math.round(currentInterval * easeFactor);

    // Adjust ease factor
    const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    easeFactor = Math.max(1.3, easeFactor + delta);

    const masteryBoost = q === 5 ? 18 : q === 3 ? 12 : 4;
    mastery = Math.min(100, mastery + masteryBoost);
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return { interval, easeFactor, mastery, dueAt: dueDate.toISOString() };
}

export function isDue(dueAt: string): boolean {
  return new Date(dueAt).getTime() <= Date.now();
}

export function masteryLabel(mastery: number): { label: string; color: string } {
  if (mastery >= 80) return { label: "Mastered", color: "text-emerald-400" };
  if (mastery >= 50) return { label: "Learning", color: "text-amber-400" };
  if (mastery >= 20) return { label: "Working on it", color: "text-orange-400" };
  return { label: "New", color: "text-text-tertiary" };
}
