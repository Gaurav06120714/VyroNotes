"use client";
import { useStreakStore } from "@/store/streak.store";
import { useMemo, useState } from "react";

interface Day {
  date: string;
  minutes: number;
}

function intensityClass(minutes: number) {
  if (minutes <= 0) return "heat-0";
  if (minutes < 25) return "heat-1";
  if (minutes < 60) return "heat-2";
  if (minutes < 90) return "heat-3";
  return "heat-4";
}

function buildLast84Days(days: Day[]): Day[] {
  const map = new Map(days.map((d) => [d.date, d.minutes]));
  const out: Day[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, minutes: map.get(key) ?? 0 });
  }
  return out;
}

export function Heatmap() {
  const { days } = useStreakStore();
  const cells = useMemo(() => buildLast84Days(days), [days]);
  const [hovered, setHovered] = useState<Day | null>(null);

  // Group into 12 columns of 7 days (weeks)
  const weeks: Day[][] = [];
  for (let i = 0; i < 12; i++) {
    weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  const totalMinutes = cells.reduce((s, d) => s + d.minutes, 0);
  const activeDays = cells.filter((d) => d.minutes > 0).length;

  return (
    <div className="card-v2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-semibold">Activity</h3>
          <p className="text-[11px] text-text-tertiary">Last 12 weeks</p>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-semibold">{Math.round(totalMinutes / 60)}h</div>
          <div className="text-[11px] text-text-tertiary">{activeDays} active days</div>
        </div>
      </div>
      <div className="flex gap-[3px]" role="grid" aria-label="Daily activity heatmap">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                role="gridcell"
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                title={`${day.date} · ${day.minutes} min`}
                className={`w-[14px] h-[14px] rounded-[3px] ${intensityClass(day.minutes)} cursor-default transition-transform hover:scale-125`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[10px] text-text-tertiary">
        <div>
          {hovered ? (
            <span>{hovered.date} · {hovered.minutes} min</span>
          ) : (
            <span>Hover for details</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {["heat-0", "heat-1", "heat-2", "heat-3", "heat-4"].map((c) => (
            <span key={c} className={`w-[10px] h-[10px] rounded-[2px] ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
