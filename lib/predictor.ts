import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

interface PredictionSignal {
  id: string;
  label: string;
  severity: "info" | "warning" | "critical";
  recommendation: string;
}

export function generatePredictionSignals(
  logs: DoseLog[],
  schedules: ScheduleItem[],
  medications: Medication[]
) {
  const signals: PredictionSignal[] = [];
  const missedLogs = logs.filter((log) => log.status === "missed");
  const eveningMisses = missedLogs.filter((log) => new Date(log.timestamp).getHours() >= 18).length;

  if (eveningMisses >= 3) {
    signals.push({
      id: "evening-risk",
      label: "High evening miss risk",
      severity: "warning",
      recommendation: "Send reminders 45 minutes early and notify the caregiver after 2 misses."
    });
  }

  const dualSlotPressure = schedules.filter((schedule) => schedule.medicines.length > 1).length;

  if (dualSlotPressure >= 2) {
    signals.push({
      id: "dual-slot-pressure",
      label: "High bundle complexity",
      severity: "info",
      recommendation: "Show slot visuals in the app and keep dual compartments for stable medicine pairs only."
    });
  }

  const refillRisk = medications
    .filter((medication) => {
      const remaining = medication.remainingPills ?? 0;
      const threshold = medication.refillThreshold ?? 5;
      return remaining <= threshold;
    })
    .map((medication) => medication.name);

  if (refillRisk.length) {
    signals.push({
      id: "refill-risk",
      label: "Refill needed soon",
      severity: "critical",
      recommendation: `${refillRisk.join(", ")} should be refilled within the next 2-3 days.`
    });
  }

  if (!signals.length) {
    signals.push({
      id: "stable-pattern",
      label: "Pattern stable",
      severity: "info",
      recommendation: "Current adherence looks stable. Maintain reminders and weekly caregiver check-ins."
    });
  }

  return signals;
}
