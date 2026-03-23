import type { DoseLog, ScheduleItem } from "@/types/medication";
import { clamp, formatShortDate } from "@/lib/utils";

export function calculateAdherence(logs: DoseLog[], expectedDoses: number) {
  const taken = logs.filter((log) => log.status === "taken").length;
  const missed = logs.filter((log) => log.status === "missed").length;
  const delayed = logs.filter((log) => log.status === "delayed").length;
  const totalResolved = taken + missed + delayed;
  const total = expectedDoses || totalResolved || 1;
  const score = clamp(Math.round((taken / total) * 100), 0, 100);

  return {
    taken,
    missed,
    delayed,
    total,
    score,
    trendLabel: score >= 85 ? "Improving" : score >= 70 ? "Needs support" : "High intervention needed"
  };
}

export function buildDailyTimeline(logs: DoseLog[]) {
  const grouped = logs.reduce<Record<string, DoseLog[]>>((accumulator, log) => {
    const day = log.timestamp.slice(0, 10);
    accumulator[day] ??= [];
    accumulator[day].push(log);
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, entries]) => {
      const hasMiss = entries.some((entry) => entry.status === "missed");
      const hasDelay = entries.some((entry) => entry.status === "delayed");
      const hasTaken = entries.some((entry) => entry.status === "taken");

      return {
        date,
        label: formatShortDate(date),
        status: hasMiss ? "missed" : hasDelay ? "delayed" : hasTaken ? "taken" : "pending"
      };
    });
}

export function summarizeToday(schedules: ScheduleItem[], logs: DoseLog[]) {
  return schedules.map((schedule) => {
    const matchingLog = logs
      .filter((log) => log.scheduleId === schedule.id)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];

    return {
      ...schedule,
      status: matchingLog?.status ?? schedule.status,
      actualTimestamp: matchingLog?.timestamp
    };
  });
}
