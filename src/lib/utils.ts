import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy"): string {
  return format(typeof date === "string" ? new Date(date) : date, fmt);
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return differenceInDays(d, new Date());
}

export function readingTime(text: string): number {
  const wpm = 220;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wpm));
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function pct(num: number, total: number): number {
  if (!total) return 0;
  return Math.round((num / total) * 100);
}

export function classFromSubject(subject: string): string {
  const map: Record<string, string> = {
    Math: "from-purple-500 to-pink-500",
    Physics: "from-blue-500 to-cyan-500",
    Chemistry: "from-emerald-500 to-teal-500",
    CS: "from-orange-500 to-red-500",
    History: "from-amber-500 to-yellow-500",
    Biology: "from-lime-500 to-green-500",
    English: "from-rose-500 to-pink-500",
    Economics: "from-indigo-500 to-violet-500",
  };
  return map[subject] || "from-violet-500 to-fuchsia-500";
}

export function subjectColor(subject: string): string {
  const map: Record<string, string> = {
    Math: "#a78bfa",
    Physics: "#60a5fa",
    Chemistry: "#34d399",
    CS: "#fb923c",
    History: "#fbbf24",
    Biology: "#a3e635",
    English: "#f472b6",
    Economics: "#818cf8",
  };
  return map[subject] || "#a78bfa";
}
