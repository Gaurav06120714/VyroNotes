"use client";
import { useExamsStore } from "@/store/exams.store";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Zap, Clock, Calendar as CalIcon } from "lucide-react";
import { formatDate, daysUntil } from "@/lib/utils";

export default function ExamsPage() {
  const { exams } = useExamsStore();
  const upcoming = exams.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const past = exams.filter((e) => daysUntil(e.date) < 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Exams</h1>
          <p className="text-text-secondary text-sm">{upcoming.length} upcoming</p>
        </div>
        <Link href="/exam-mode" className="btn-primary">
          <Zap className="w-4 h-4" /> 1 Hour Mode
        </Link>
      </div>

      <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-3 font-semibold">Upcoming</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {upcoming.map((e, i) => {
          const dd = daysUntil(e.date);
          const urgent = dd <= 3;
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card hover-lift relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 ${urgent ? "bg-red-500/20" : "bg-accent/15"} rounded-full blur-3xl -translate-y-1/2 translate-x-1/4`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-text-tertiary">{e.subject}</span>
                </div>
                <h3 className="font-semibold mb-1">{e.title}</h3>
                <div className="flex items-center gap-2 text-[11px] text-text-tertiary mb-4">
                  <CalIcon className="w-3 h-3" />
                  {formatDate(e.date, "EEE, MMM d")}
                </div>

                <div className={`text-5xl font-bold mb-1 ${urgent ? "text-red-400" : dd <= 7 ? "text-amber-400" : "text-emerald-400"}`}>
                  {dd}<span className="text-base text-text-secondary ml-1">d</span>
                </div>
                <div className="text-xs text-text-tertiary mb-4 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {dd === 0 ? "Today!" : dd === 1 ? "Tomorrow" : `In ${dd} days`}
                </div>

                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-secondary">Prep progress</span>
                  <span className="font-semibold">{e.prepProgress}%</span>
                </div>
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mb-3">
                  <div className="h-full gradient-accent" style={{ width: `${e.prepProgress}%` }} />
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {e.topics.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated border border-app">{t}</span>
                  ))}
                </div>

                <Link href="/revision" className="block text-center text-sm px-3 py-2 rounded-lg bg-accent/15 hover:bg-accent/25 transition-colors text-white">
                  Start Prep
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-3 font-semibold">Past exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {past.map((e) => (
              <div key={e.id} className="card opacity-60">
                <div className="text-sm font-medium">{e.title}</div>
                <div className="text-xs text-text-tertiary">{formatDate(e.date)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
