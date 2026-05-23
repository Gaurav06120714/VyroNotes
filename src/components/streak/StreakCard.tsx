"use client";
import { useStreakStore } from "@/store/streak.store";
import { Flame, TrendingUp } from "lucide-react";

export function StreakCard() {
  const { days, currentStreak, longestStreak } = useStreakStore();
  const last30 = days.slice(-30);

  return (
    <div className="card-v2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Study Streak</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-semibold leading-none">{currentStreak}</span>
            <span className="text-[12px] text-text-secondary">days</span>
            <Flame className="w-4 h-4 text-[#f59e0b]" />
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[10px] text-text-tertiary uppercase tracking-wider">Best</div>
          <div className="flex items-center gap-1 text-[13px] font-semibold text-[var(--success)]">
            <TrendingUp className="w-3 h-3" /> {longestStreak}d
          </div>
        </div>
      </div>

      <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
        {last30.map((d) => {
          const intensity = d.minutes === 0 ? 0 : d.minutes < 30 ? 1 : d.minutes < 60 ? 2 : d.minutes < 90 ? 3 : 4;
          return (
            <div
              key={d.date}
              title={`${d.date}: ${d.minutes} min`}
              className={`aspect-square rounded-[3px] heat-${intensity} hover:scale-125 transition-transform`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-tertiary">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
