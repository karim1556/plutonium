import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";
import type { Slot } from "@/types/slot";
import { extractHour, getTodayIsoDate } from "@/lib/utils";

interface SchedulerOptions {
  wakeTime?: string;
  scheduledDate?: string;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function deriveTimesForMedication(
  medication: Pick<Medication, "frequency" | "timing">,
  wakeTime = "07:00"
) {
  if (medication.timing.customTimes?.length) {
    return medication.timing.customTimes;
  }

  const fallbackByFrequency: Record<number, string[]> = {
    1: ["09:00"],
    2: ["09:00", "21:00"],
    3: ["08:00", "14:00", "20:00"],
    4: ["06:00", "12:00", "18:00", "22:00"]
  };

  const partOfDayMap: Record<string, string> = {
    morning: "09:00",
    afternoon: "14:00",
    evening: "19:00",
    night: "22:00"
  };

  const fromParts = medication.timing.partsOfDay
    .map((part) => partOfDayMap[part])
    .filter(Boolean);

  if (fromParts.length) {
    return fromParts;
  }

  const wakeHour = Number(wakeTime.split(":")[0] ?? 7);
  const adaptive: Record<number, string[]> = {
    1: [`${String(wakeHour + 2).padStart(2, "0")}:00`],
    2: [`${String(wakeHour + 2).padStart(2, "0")}:00`, "21:00"],
    3: [`${String(wakeHour + 1).padStart(2, "0")}:00`, "14:00", "20:00"],
    4: ["06:00", "12:00", "18:00", "22:00"]
  };

  return adaptive[medication.frequency] ?? fallbackByFrequency[1];
}

export function resolveSlotForMedication(medication: Medication, slots: Slot[]) {
  const byConfiguredMedicine = slots.find((slot) =>
    slot.medicines.map(normalizeName).includes(normalizeName(medication.name))
  );

  if (byConfiguredMedicine) {
    return byConfiguredMedicine;
  }

  return slots.find((slot) => slot.capacity > slot.medicines.length) ?? slots[0];
}

export function generateScheduleFromMedications(
  medications: Medication[],
  slots: Slot[],
  options: SchedulerOptions = {}
) {
  const scheduledDate = options.scheduledDate ?? getTodayIsoDate();
  const wakeTime = options.wakeTime ?? "07:00";
  const grouped = new Map<string, ScheduleItem>();

  medications.forEach((medication) => {
    const slot = resolveSlotForMedication(medication, slots);
    const times = deriveTimesForMedication(medication, wakeTime);

    times.forEach((time) => {
      const key = `${scheduledDate}-${time}-${slot.id}`;
      const entry = grouped.get(key);

      if (entry) {
        entry.medicationIds.push(medication.id);
        entry.medicines.push(medication.name);
        return;
      }

      grouped.set(key, {
        id: key,
        medicationIds: [medication.id],
        medicines: [medication.name],
        slotId: slot.id,
        time,
        status: getScheduleStatus(time),
        scheduledFor: scheduledDate,
        safeGapHours: medication.frequency >= 2 ? 6 : 12
      });
    });
  });

  return Array.from(grouped.values()).sort((left, right) => {
    if (left.scheduledFor === right.scheduledFor) {
      return left.time.localeCompare(right.time);
    }

    return left.scheduledFor.localeCompare(right.scheduledFor);
  });
}

export function getScheduleStatus(time: string, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [hours, minutes] = time.split(":").map(Number);
  const scheduledMinutes = hours * 60 + minutes;

  if (currentMinutes >= scheduledMinutes + 90) {
    return "missed" as const;
  }

  if (currentMinutes >= scheduledMinutes - 30 && currentMinutes <= scheduledMinutes + 30) {
    return "due_soon" as const;
  }

  if (currentMinutes > scheduledMinutes + 30) {
    return "delayed" as const;
  }

  return "pending" as const;
}

export function suggestReschedule(schedule: ScheduleItem, logs: DoseLog[], now = new Date()) {
  const alreadyTaken = logs.some((log) => log.scheduleId === schedule.id && log.status === "taken");

  if (alreadyTaken) {
    return {
      canReschedule: false,
      reason: "Dose already logged as taken."
    };
  }

  const lastTaken = logs
    .filter((log) => log.status === "taken")
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];

  if (!lastTaken) {
    return {
      canReschedule: true,
      suggestedTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    };
  }

  const hoursSinceLastDose =
    (now.getTime() - new Date(lastTaken.timestamp).getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastDose >= (schedule.safeGapHours ?? 6)) {
    return {
      canReschedule: true,
      suggestedTime: new Date(now.getTime() + 45 * 60 * 1000).toISOString()
    };
  }

  return {
    canReschedule: false,
    reason: "Safe gap not reached. Hold and notify caregiver."
  };
}

export function buildDoseTimeline(schedules: ScheduleItem[]) {
  const hourlyBuckets = new Map<number, ScheduleItem[]>();

  schedules.forEach((schedule) => {
    const hour = extractHour(schedule.time);
    const current = hourlyBuckets.get(hour) ?? [];
    current.push(schedule);
    hourlyBuckets.set(hour, current);
  });

  return Array.from(hourlyBuckets.entries()).map(([hour, entries]) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    entries
  }));
}
